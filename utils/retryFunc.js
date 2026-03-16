/* eslint-disable no-await-in-loop */
module.exports = async (fn, retries = 3, delay = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const backoff = delay * 2 ** (attempt - 1);
        console.warn(`Attempt ${attempt} failed. Retrying in ${backoff}ms...`);
        await new Promise((resolve) => {
          setTimeout(resolve, backoff);
        });
      }
    }
  }
  throw lastError;
};
