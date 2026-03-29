const fs = require('fs/promises');
const path = require('path');
const { getOllamaResponse } = require('../services/ollama');
const retry = require('../utils/retryFunc');

const getRandomSample = (items, sampleSize) => {
  const arr = [...items];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.slice(0, sampleSize);
};

const readJsonlFile = async (fileName) => {
  const filePath = path.join(__dirname, '..', fileName);
  const fileContent = await fs.readFile(filePath, 'utf-8');

  // return fileContent
  //   .split(/\r?\n/)
  //   .map((line) => line.trim())
  //   .filter(Boolean)
  //   .map((line) => JSON.parse(line));
  return JSON.parse(fileContent);
};

const getBaseData = async () => {
  try {
    // const singleObjects = await readJsonlFile('singleSummarizeData.jsonl');
    // const multipleObjects = await readJsonlFile('multipleSummarizeData.jsonl');

    // const singleData = getRandomSample(
    //   singleObjects,
    //   Math.min(25, singleObjects.length),
    // );
    // const multipleData = getRandomSample(
    //   multipleObjects,
    //   Math.min(25, multipleObjects.length),
    // );
    // // const data = [...singleData, ...multipleData];

    // const arr = [];
    // await singleData.reduce(
    //   async (previous, { system, input: prompt, output: response }, index) => {
    //     await previous;
    //     const promptWithInstruction = `Tóm tắt nội dung bài báo trên thành một đoạn dài khoảng 3-5 câu theo văn phong báo chí:\n\n${prompt}`;
    //     const generated = await getOllamaResponse(
    //       system,
    //       promptWithInstruction,
    //     );
    //     const baseModelResponse = generated.response;
    //     arr.push({
    //       system,
    //       input: promptWithInstruction,
    //       expectedOutput: response,
    //       baseOutput: baseModelResponse,
    //     });
    //     console.log(`Single: Finish ${index + 1} samples`);
    //   },
    //   Promise.resolve(),
    // );

    // await multipleData.reduce(
    //   async (previous, { system, input: prompt, output: response }, index) => {
    //     await previous;
    //     const inputData = prompt.reduce((acc, item, idx) => {
    //       acc += `Đoạn ${idx + 1}: ${item}`;
    //       if (idx < prompt.length - 1) {
    //         acc += '\n\n';
    //       }
    //       return acc;
    //     }, 'Hãy tổng hợp các nội dung tóm tắt sau thành một bài báo tổng hợp hoàn chỉnh theo văn phong báo chí:\n\n');
    //     const generated = await getOllamaResponse(system, inputData);
    //     const baseModelResponse = generated.response;
    //     arr.push({
    //       system,
    //       input: inputData,
    //       expectedOutput: response,
    //       baseOutput: baseModelResponse,
    //     });
    //     console.log(`Multiple: Finish ${index + 1} samples`);
    //   },
    //   Promise.resolve(),
    // );
    const data = await readJsonlFile('baseData.json');
    const arr = [];

    await data.reduce(
      async (
        previous,
        { system, input, expectedOutput, baseOutput },
        index,
      ) => {
        await previous;
        try {
          const generated = await retry(
            () => getOllamaResponse(system, input),
            3,
          );
          const tunedOutput = generated.response;
          arr.push({ system, input, expectedOutput, baseOutput, tunedOutput });
          console.log(`Multiple: Finish ${index + 1} samples`);
        } catch (error) {
          console.warn(
            `Multiple: Skip sample ${index + 1} after 3 retries. Error: ${error.message}`,
          );
        }
      },
      Promise.resolve(),
    );

    const outputPath = path.join(__dirname, '..', 'data.json');
    await fs.writeFile(outputPath, JSON.stringify(arr, null, 2), 'utf-8');

    return arr;
  } catch (error) {
    throw new Error(`getBaseData failed: ${error.message}`);
  }
};

module.exports = getBaseData;
