/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const serpApi = require('./serpApi');
const openAi = require('./openAi');
const firecrawl = require('./firecrawl');
const Article = require('../models/articleModel');
const softFilterArticle = require('../utils/softFilterArticle');
const Trend = require('../models/trendModel');
const News = require('../models/newsModel');

module.exports = async () => {
  try {
    const trendingKeywords = await serpApi.getTrendingNows();
    const newsArticlesToSave = [];
    const news = [];

    for (const item of trendingKeywords || []) {
      const newsPageToken = item.news_page_token;
      const newsItemList = await serpApi.getNewsFromTrends(newsPageToken);
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
          // TODO: Temporary fix timeout by skipping timeout request
          // Implement a more robust solution later
          try {
            const scrapedData = await firecrawl.scrapeArticles(url);
            const { markdown, metadata } = scrapedData;
            const softFilteredMarkdown = softFilterArticle(markdown);
            const summary =
              await openAi.getArticleSummary(softFilteredMarkdown);
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
      const newsResult = await openAi.getNewsFromArticlesSummary(
        summaries.map((a) => ({ title: a.title, summary: a.summary })),
      );
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
      reference_articles_id: (n.articleUrls || [])
        .map((u) => urlToId[u])
        .filter(Boolean),
      data: n.data,
    }));

    await News.insertMany(newsDocs);
    console.log('Daily cron job completed successfully.');
  } catch (error) {
    console.error('Error in daily cron job:', error);
  }
};
