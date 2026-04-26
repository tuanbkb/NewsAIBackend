const axios = require('axios');

exports.ollamaInstance = axios.create({
  baseURL: 'http://localhost:11434',
  timeout: 600000,
});

exports.getOllamaResponse = async (system, prompt, model, maxTokens = 3072) => {
  try {
    const res = await this.ollamaInstance.post(`/api/generate`, {
      model: model || 'gemma-4:latest',
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
