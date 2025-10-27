const axios = require('axios');
const AppError = require('../utils/appError');

const openAiInstance = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});

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
    throw new AppError('Error fetching chat completion from OpenAI', 500);
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
    const newsArticle = JSON.parse(response);
    return newsArticle;
  } catch (error) {
    throw new AppError('Error generating news from articles summary', 500);
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
${articleData}
"""

Output:
A short, clean summary (in original language).`;
    const summary = await this.getChatCompletion(prompt);
    return summary;
  } catch (error) {
    throw new AppError('Error generating article summary', 500);
  }
};
