const axios = require('axios');
const AppError = require('../utils/appError');

exports.textEmbedInstance = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

exports.getFilterResult = async (summaries) => {
  try {
    const texts = summaries.map((item) => item.summary);
    console.log('Calling text embedding service for outlier removal...', texts);
    const response = await this.textEmbedInstance.post('/remove-outliers', {
      texts,
    });
    const resultArticles = [];
    response.data.filtered_texts.forEach((text) => {
      const matchedSummary = summaries.find((item) => item.summary === text);
      if (matchedSummary) {
        resultArticles.push(matchedSummary);
      }
    });
    return resultArticles;
  } catch (error) {
    console.error(error);
    throw new AppError('Error fetching text embeddings');
  }
};
