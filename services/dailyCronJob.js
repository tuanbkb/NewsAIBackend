/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const serpApi = require('./serpApi');
const openAi = require('./openAi');
const firecrawl = require('./firecrawl');
const Article = require('../models/articleModel');
const softFilterArticle = require('../utils/softFilterArticle');
const Trend = require('../models/trendModel');
const News = require('../models/newsModel');
const retry = require('../utils/retryFunc');
const softFilterTrend = require('../utils/softFilterTrend');

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

    for (const item of trendingKeywords || []) {
      const newsPageToken = item.news_page_token;
      let newsItemList;
      try {
        newsItemList = await retry(() =>
          serpApi.getNewsFromTrends(newsPageToken),
        );
      } catch (err) {
        // Skip this trend if we cannot fetch its news page after retries
        console.error(
          `Skipping trend due to fetch error: ${item.keyword || newsPageToken}`,
          err,
        );
        continue;
      }
      const newsArticles = [];
      const summaries = [];
      for (const newsItem of newsItemList || []) {
        const url = newsItem.link;

        // Check if the article already exists
        const existingArticle = await Article.findOne({ url });
        if (existingArticle || newsArticlesToSave.find((a) => a.url === url)) {
          console.log(`Article already exists: ${url}`);
          summaries.push(existingArticle);
        } else {
          try {
            const scrapedData = await retry(() =>
              firecrawl.scrapeArticles(url),
            );
            const { markdown, metadata } = scrapedData;
            const softFilteredMarkdown = softFilterArticle(markdown);
            const articleData = {
              title: newsItem.title,
              data: softFilteredMarkdown,
            };
            const summary = await retry(() =>
              openAi.getArticleSummary(articleData),
            );
            // Get source logo URL from metadata if available
            const sourceLogoUrl =
              metadata.favicon || metadata.icon || undefined;
            const newArticle = {
              title: newsItem.title,
              source: newsItem.source,
              source_logo_url: sourceLogoUrl,
              url,
              thumbnail_url: newsItem.thumbnail,
              summary,
            };
            newsArticles.push(newArticle);
            summaries.push(newArticle);
          } catch (err) {
            console.error(`Skipping article due to error: ${url}`, err);
          }
        }
      }

      newsArticlesToSave.push(...newsArticles);
      let newsResult;
      try {
        newsResult = await retry(() =>
          openAi.getNewsFromArticlesSummary(
            summaries.map((a) => ({ title: a.title, summary: a.summary })),
          ),
        );
      } catch (err) {
        // Skip this trend if summarization fails after retries
        console.error(
          `Skipping trend due to summarization error: ${item.keyword || newsPageToken}`,
          err,
        );
        continue;
      }
      // Return article URLs for now — we'll resolve them to ObjectIds
      // after inserting/finding Article documents.
      news.push({
        title: newsResult.title,
        data: newsResult.data,
        articleUrls: newsArticles.map((a) => a.url),
      });
    }

    // Save all new things to the database
    // Persist trends
    await Trend.deleteMany();
    await Trend.insertMany(trendingKeywords || []);

    // Insert any new articles collected during scraping. Use ordered: false
    // to continue inserting other docs if one fails (e.g., duplicate key).
    if (newsArticlesToSave.length > 0) {
      try {
        await Article.insertMany(newsArticlesToSave, { ordered: false });
      } catch (err) {
        // ignore duplicate key errors here — we'll fetch existing docs below
        console.warn('Some articles may already exist, continuing.');
      }
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
    }));

    await News.deleteMany();
    await News.insertMany(newsDocs);
    console.log('Daily cron job completed successfully.');
  } catch (error) {
    console.error('Error in daily cron job:', error);
  }
};
