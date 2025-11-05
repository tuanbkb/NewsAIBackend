const axios = require('axios');
const AppError = require('../utils/appError');
const parseOpenAIJson = require('../utils/openAIJsonParse');

const openAiInstance = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

openAiInstance.interceptors.request.use(
  (config) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new AppError(
        'OpenAI API key is not set in environment variables',
        500,
      );
    }
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${key}`;
    return config;
  },
  (error) => Promise.reject(error),
);

exports.getChatCompletion = async (
  content,
  model = 'gpt-4o-mini',
  role = 'user',
) => {
  try {
    const response = await openAiInstance.post('/chat/completions', {
      model,
      messages: [{ role, content }],
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI error: ', error);
    throw new AppError('Error fetching chat completion from OpenAI', 400);
  }
};

exports.filterTrends = async (trends) => {
  try {
    const prompt = `You are a data filtering assistant specialized in trending topic analysis.

    You will receive input data in JSON format — an array of trending topic objects from the Google Trending Now API.
    Each object may include fields such as "query", "search_volume", "start_timestamp", "end_timestamp", etc.

    Your tasks:
    1. Group topic objects with highly similar query params (e.g. "iPhone 16 Pro", "Apple iPhone 16", "New iPhone 16").
    2. From each group, keep only one representative topic — the one with the clearest and most general query.
     - Keep its entire object (not just the query).
    3. Remove all topics related to **lotteries, lottery results, or gambling**  
     (examples: "Powerball", "Mega Millions", "Kết quả xổ số", "Vietlott", "Xổ số miền Bắc", etc.).
    4. Do **not** modify or add any data fields.
    5. Return only a valid **JSON array** of the remaining topic objects, preserving all their original fields and values.

    ### Example
    **Input:**
    [
    {"query": "Apple iPhone 16 Pro", "search_volume": "20000", "start_timestamp": 1750384300},
    {"query": "iPhone 16", "search_volume": "15000", "start_timestamp": 1750384310},
    {"query": "Bitcoin price", "search_volume": "10000", "start_timestamp": 1750384320},
    {"query": "Kết quả xổ số miền Bắc", "search_volume": "8000", "start_timestamp": 1750384330}
    ]

    **Correct Output (preserve original objects, remove duplicates/lottery):**
    [
    {"query": "iPhone 16", "search_volume": "15000", "start_timestamp": 1750384310},
    {"query": "Bitcoin price", "search_volume": "10000", "start_timestamp": 1750384320}
    ]

    Now process the following input:
    ${JSON.stringify(trends, null, 2)}`;
    const response = await this.getChatCompletion(prompt);
    const filtered = parseOpenAIJson(response);
    return filtered;
  } catch (error) {
    console.error(error);
    throw new AppError('Error filtering trends from OpenAI', 400);
  }
};

exports.getNewsFromArticlesSummary = async (articlesSummary) => {
  try {
    const prompt = `You are a professional Vietnamese news editor.

You will receive a list of articles in JSON format. Each object includes:
{
  "title": string,           // title of the article
  "summary": string          // summary of the article
}

Your task:
1. Read all the summaries carefully.
2. Identify the main shared topic or news event they describe.
3. Write a **single coherent Vietnamese news article** summarizing the key facts, trends, and insights from all summaries.
4. Keep your tone formal, neutral, and journalistic.
5. Do not copy or translate each summary literally — synthesize them into one unified piece.
6. Write naturally in **Vietnamese**, suitable for a newspaper.
7. Return your result strictly as valid JSON in the format below:

{
  "title": string,   // short Vietnamese title summarizing the topic
  "data": string     // Vietnamese article body, 3–5 short paragraphs
}

Make sure the output is valid JSON and does not include any additional explanation or markdown.
Here are the input articles:
${JSON.stringify(articlesSummary, null, 2)}`;
    const response = await this.getChatCompletion(prompt);
    const newsArticle = parseOpenAIJson(response);
    return newsArticle;
  } catch (error) {
    throw new AppError('Error generating news from articles summary', 400);
  }
};

exports.getArticleSummary = async (articleData) => {
  try {
    const prompt = `You are a professional news editor.  
Your task is to create a short, factual summary from the following article content in its original language.
The input article is provided in JSON format as follows:
{
  "title": string,   // title of the article
  "data": string     // full text content of the article
}
The data comes from a web crawler and may contain unwanted metadata such as author names, publication date, category tags, or unrelated footer text.

Requirements:
- Clean the input automatically by ignoring metadata, ads, or navigation text.
- Focus only on the actual news content: what happened, who was involved, when, and why it matters.
- Keep the tone neutral and objective.
- Write a concise summary of 3–5 sentences.
- Do not include any metadata, HTML tags, or external links in the output.

Input:
"""
${JSON.stringify(articleData, null, 2)}
"""

Output:
A short, clean summary (in original language).`;
    const summary = await this.getChatCompletion(prompt);
    return summary;
  } catch (error) {
    throw new AppError('Error generating article summary', 400);
  }
};
