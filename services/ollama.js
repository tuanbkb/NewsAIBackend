const axios = require('axios');

exports.ollamaInstance = axios.create({
  baseURL: process.env.OLLAMA_URL || 'http://localhost:11434',
  timeout: 600000,
});

exports.getOllamaResponse = async (system, prompt, model, maxTokens = 3072) => {
  try {
    const res = await this.ollamaInstance.post(`/api/generate`, {
      model: model || 'hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M',
      system: system,
      prompt: prompt,
      stream: false,
      max_tokens: maxTokens,
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching Ollama response:', error);
    throw error;
  }
};

exports.getArticleSummary = async (articleContent) => {
  try {
    const systemPrompt = `You are a professional news editor. Your task is to create a short, factual summary from the following article content in its original language. The input article is provided as a string, including the article's content.\n\nRequirements:\n- Focus only on the actual news content: what happened, who was involved, when, and why it matters.\n- Keep the tone neutral and objective.\n- Write a concise summary of 3–5 sentences.\n- Do not include anything besides the summary result itself.`;
    const prompt = `Tóm tắt nội dung bài báo trên thành một đoạn dài khoảng 3-5 câu theo văn phong báo chí:\n\n${articleContent}`;
    const res = await this.getOllamaResponse(systemPrompt, prompt);
    return res.response;
  } catch (error) {
    console.error('Error summarizing article content:', error);
    throw error;
  }
};

exports.getNewsFromArticlesSummary = async (summaries) => {
  try {
    const systemPrompt = `You are a professional Vietnamese news editor. You will receive a list of articles, each article is a short summary of a news story, containing key facts and insights.\n\nYour task:\n- Read all the summaries carefully.\n- Identify the main shared topic or news event they describe.\n- Write a **single coherent Vietnamese news article** summarizing the key facts, trends, and insights from all summaries.\n- Keep your tone formal, neutral, and journalistic.\n- Do not copy or translate each summary literally — synthesize them into one unified piece.\n- Write naturally in **Vietnamese**, suitable for a newspaper.\n- Return your result strictly as a string of the news article content, without any additional explanation or formatting.`;
    const summariesText = summaries
      .map((s, idx) => `Đoạn ${idx + 1}: ${s}`)
      .join('\n\n');
    const prompt = `Hãy tổng hợp các nội dung tóm tắt sau thành một bài báo tổng hợp hoàn chỉnh theo văn phong báo chí:\n\n${summariesText}`;
    const res = await this.getOllamaResponse(systemPrompt, prompt);
    return res.response;
  } catch (error) {
    console.error('Error generating news content from summaries:', error);
    throw error;
  }
};
