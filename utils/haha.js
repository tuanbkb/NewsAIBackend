const path = require('path');
const fs = require('fs');
const pLimit = require('p-limit');
const { getOllamaResponse } = require('../services/ollama');
const retryFunc = require('./retryFunc');

module.exports = async (pathToFile, model) => {
  const filePath = path.join(__dirname, '..', pathToFile);
  const data = fs.readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(data);
  const limit = pLimit(3);

  if (!Array.isArray(jsonData)) {
    throw new Error('Expected JSON file to contain an array of objects');
  }

  const outputData = await Promise.all(
    jsonData.map((item, index) => {
      if (!item || typeof item !== 'object') {
        return item;
      }

      return limit(async () => {
        const system = item.system || '';
        const prompt = item.prompt || JSON.stringify(item);
        try {
          const response = await retryFunc(() =>
            getOllamaResponse(system, prompt, model),
          );

          console.log(
            `Output ${index}: `,
            `${response.response.slice(0, 100)}...`,
          ); // Log the first 100 characters of the response

          const modelOutput =
            typeof response === 'string' ? response : response.response;

          return {
            ...item,
            [model]: modelOutput.trim(),
          };
        } catch (error) {
          console.error(`Error processing item at index ${index}:`, error);
          return {
            ...item,
            [model]: '',
          };
        }
      });
    }),
  );

  const { dir } = path.parse(filePath);
  const outputFilePath = path.join(dir, 'data.json');

  fs.writeFileSync(
    outputFilePath,
    JSON.stringify(outputData, null, 2),
    'utf-8',
  );

  return { outputFilePath, data: outputData };
};
