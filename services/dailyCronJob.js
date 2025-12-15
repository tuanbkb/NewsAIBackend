/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const pLimit = require('p-limit');
const serpApi = require('./serpApi');
const openAi = require('./openAi');
const firecrawl = require('./firecrawl');
const Article = require('../models/articleModel');
const softFilterArticle = require('../utils/softFilterArticle');
const Trend = require('../models/trendModel');
const News = require('../models/newsModel');
const retry = require('../utils/retryFunc');
const softFilterTrend = require('../utils/softFilterTrend');
const textEmbed = require('./textEmbed');

// Helper to process articles for a single trend with concurrency control
async function processArticlesForTrend(
  newsItemList,
  newsArticlesToSaveArr,
  articleLimit,
) {
  const newsArticles = [];
  const summaries = [];

  // Process articles with controlled concurrency
  const articlePromises = (newsItemList || []).map((newsItem) =>
    articleLimit(async () => {
      const url = newsItem.link;

      // Check if the article already exists
      const existingArticle = await Article.findOne({ url });
      if (existingArticle || newsArticlesToSaveArr.find((a) => a.url === url)) {
        console.log(`Article already exists: ${url}`);
        return { summary: existingArticle, article: null };
      }

      try {
        const scrapedData = await retry(() => firecrawl.scrapeArticles(url));
        const { markdown, metadata } = scrapedData;
        const softFilteredMarkdown = softFilterArticle(markdown);
        const articleData = {
          title: newsItem.title,
          data: softFilteredMarkdown,
        };
        const summary = await retry(() =>
          openAi.getArticleSummary(articleData),
        );
        const sourceLogoUrl = metadata.favicon || metadata.icon || undefined;
        const newArticle = {
          title: newsItem.title,
          source: newsItem.source,
          source_logo_url: sourceLogoUrl,
          url,
          thumbnail_url: newsItem.thumbnail,
          summary,
        };
        return { summary: newArticle, article: newArticle };
      } catch (err) {
        console.error(`Skipping article due to error: ${url}`, err);
        return { summary: null, article: null };
      }
    }),
  );

  const results = await Promise.all(articlePromises);
  results.forEach((result) => {
    if (result.summary) summaries.push(result.summary);
    if (result.article) newsArticles.push(result.article);
  });

  return { newsArticles, summaries };
}

module.exports = async () => {
  try {
    let trendingKeywords;
    try {
      trendingKeywords = await retry(() => serpApi.getTrendingNows());
    } catch (err) {
      console.error(
        'Failed to fetch trending keywords, aborting cron run.',
        err,
      );
      return;
    }

    trendingKeywords = softFilterTrend(trendingKeywords);

    // Filter trends using OpenAI
    // try {
    //   trendingKeywords = await retry(() =>
    //     openAi.filterTrends(trendingKeywords),
    //   );
    // } catch (err) {
    //   console.error(
    //     'Failed to filter trends, proceeding with unfiltered list.',
    //     err,
    //   );
    // }

    const newsArticlesToSave = [];
    const news = [];

    // Concurrency limits for 2GB RAM server:
    // - Max 2 trends at once
    // - Max 2 articles per trend
    // Total: ~4 concurrent operations (safe for 2GB RAM)
    const trendLimit = pLimit(2);
    const articleLimit = pLimit(2);

    // Process trends with controlled concurrency
    const trendPromises = (trendingKeywords || []).map((item) =>
      trendLimit(async () => {
        const newsPageToken = item.news_page_token;
        let newsItemList;
        try {
          newsItemList = await retry(() =>
            serpApi.getNewsFromTrends(newsPageToken),
          );
        } catch (err) {
          console.error(
            `Skipping trend due to fetch error: ${item.keyword || newsPageToken}`,
            err,
          );
          return null;
        }

        const { newsArticles, summaries } = await processArticlesForTrend(
          newsItemList,
          newsArticlesToSave,
          articleLimit,
        );

        if (newsArticles.length === 0 && summaries.length === 0) {
          console.log(`No articles found for trend: ${item.query}`);
          return null;
        }

        // Filter summaries using text embedding
        const filteredSummaries = await retry(() =>
          textEmbed.getFilterResult(summaries),
        );
        const filteredUrls = new Set(filteredSummaries.map((s) => s.url));
        const filteredNewsArticles = newsArticles.filter((article) =>
          filteredUrls.has(article.url),
        );

        newsArticlesToSave.push(...filteredNewsArticles);

        let newsResult;
        try {
          newsResult = await retry(() =>
            openAi.getNewsFromArticlesSummary(
              summaries.map((a) => ({ title: a.title, summary: a.summary })),
            ),
          );
        } catch (err) {
          console.error(
            `Skipping trend due to summarization error: ${item.query}`,
            err,
          );
          return null;
        }

        return {
          title: newsResult.title,
          data: newsResult.data,
          articleUrls: summaries.map((a) => a.url),
          categoryIds: item.category_ids || [],
          trendQuery: item.query,
        };
      }),
    );

    // Wait for all trends to complete and filter out null results
    const trendResults = (await Promise.all(trendPromises)).filter(Boolean);
    news.push(...trendResults);

    // Save all new things to the database
    // Upsert trends (update if exists based on unique 'query', insert if new)

    if (trendingKeywords && trendingKeywords.length > 0) {
      const trendOps = trendingKeywords.map((trend) => ({
        updateOne: {
          filter: { query: trend.query },
          update: { $set: trend },
          upsert: true,
        },
      }));
      await Trend.bulkWrite(trendOps);
    }

    // Upsert articles (update if URL exists, insert if new) to avoid duplicates
    if (newsArticlesToSave.length > 0) {
      const articleOps = newsArticlesToSave.map((article) => ({
        updateOne: {
          filter: { url: article.url },
          update: { $set: article },
          upsert: true,
        },
      }));
      await Article.bulkWrite(articleOps);
    }

    // Build a map from URL -> _id for all article URLs referenced by news
    const allUrls = Array.from(
      new Set(news.flatMap((n) => n.articleUrls || [])),
    );
    const savedArticles = await Article.find(
      { url: { $in: allUrls } },
      { _id: 1, url: 1 },
    ).lean();
    const urlToId = savedArticles.reduce((acc, a) => {
      acc[a.url] = a._id;
      return acc;
    }, {});

    // Convert the intermediate news objects (which contain articleUrls)
    // into final News documents with ObjectId references.
    const newsDocs = news.map((n) => ({
      title: n.title,
      reference_articles: (n.articleUrls || [])
        .map((u) => urlToId[u])
        .filter(Boolean),
      data: n.data,
      category_ids: n.categoryIds || [],
    }));

    // Check for duplicates in bulk by querying existing titles
    const titles = newsDocs.map((n) => n.title);
    const existingNews = await News.find(
      { title: { $in: titles } },
      { title: 1 },
    ).lean();
    const existingTitles = new Set(existingNews.map((n) => n.title));

    // Filter out duplicates
    const newsToInsert = newsDocs.filter((n) => {
      if (existingTitles.has(n.title)) {
        console.log(`News already exists: ${n.title}`);
        return false;
      }
      return true;
    });

    if (newsToInsert.length > 0) {
      await News.insertMany(newsToInsert);
    }
    console.log('Daily cron job completed successfully.');
  } catch (error) {
    console.error('Error in daily cron job:', error);
  }
};
