const axios = require('axios');
const AppError = require('../utils/appError');

exports.firecrawlInstance = axios.create({
  baseURL: 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
  },
});

exports.scrapeArticles = async (url) => {
  try {
    const response = await this.firecrawlInstance.post('/v1/scrape', { url });
    return response.data.data;
  } catch (error) {
    console.error('FireCrawl error: ', error);
    throw new AppError('Error scraping articles from FireCrawl', 500);
  }
};
