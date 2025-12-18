const axios = require('axios');
const AppError = require('../utils/appError');

exports.serpApiInstance = axios.create({
  baseURL: 'https://serpapi.com',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.SERPAPI_API_KEY}`,
  },
});

this.serpApiInstance.interceptors.request.use(
  (config) => {
    if ((config.method || '').toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        api_key: process.env.SERPAPI_API_KEY,
      };
    }
    return config;
  },
  (error) => Promise.reject(error),
);

exports.getTrendingNows = async (hours) => {
  try {
    const response = await this.serpApiInstance.get('/search', {
      params: {
        hl: 'vi',
        geo: 'VN',
        hours,
        engine: 'google_trends_trending_now',
        json_restrictor: `trending_searches[].{query,search_volume,start_timestamp,end_timestamp,increase_percentage,categories[],news_page_token}`,
      },
    });
    const trendingSearches = response.data.trending_searches;
    const sortedSearches = trendingSearches.sort((a, b) => {
      const startA = a.start_timestamp;
      const startB = b.start_timestamp;
      return startB - startA;
    });

    // Map categories to extract only category IDs
    sortedSearches.forEach((search) => {
      if (Array.isArray(search.categories)) {
        search.category_ids = search.categories.map((cat) => cat.id);
        delete search.categories;
      }
    });

    return sortedSearches.slice(0, 50);
  } catch (error) {
    console.error(error);
    throw new AppError('Error fetching trending keywords from SerpAPI', 400);
  }
};

exports.getNewsFromTrends = async (newsPageToken) => {
  try {
    const response = await this.serpApiInstance.get('/search', {
      params: {
        page_token: newsPageToken,
        engine: 'google_trends_news',
        json_restrictor: 'news[0:9].{title,link,source,thumbnail}',
      },
    });
    return response.data.news;
  } catch (error) {
    throw new AppError('Error fetching news articles from SerpAPI', 400);
  }
};
