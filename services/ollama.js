const axios = require('axios');

exports.ollamaInstance = axios.create({
  baseURL: 'http://localhost:11434',
});

exports.getOllamaResponse = async (system, prompt, maxTokens = 3072) => {
  try {
    const res = await this.ollamaInstance.post(`/api/generate`, {
      model: 'qwen2.5:7b',
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
