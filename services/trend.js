const { getBrowser } = require('./playwright');

module.exports = async () => {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36',
  });
  const page = await context.newPage();
  try {
    await page.goto('https://trends.google.com/trending?geo=VN', {
      waitUntil: 'networkidle0',
    });
    const trends = await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      const trendElements = document.querySelectorAll('.mZ3RIc');
      const trendData = [];
      for (
        let i = 0;
        i < trendElements.length && trendData.length < 10;
        i += 1
      ) {
        console.log('Trend element:', trendElements[i]);
        const el = trendElements[i];
        const title = (el.innerText || '').trim();
        if (title) trendData.push(title);
      }
      return trendData;
    });
    return trends;
  } catch (error) {
    console.error('Error in trend service:', error);
    throw error;
  } finally {
    await page.close();
    await context.close();
  }
};
