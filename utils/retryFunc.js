/* eslint-disable no-await-in-loop */
module.exports = async (fn, retries = 3, delay = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }
  }
  throw lastError;
};
