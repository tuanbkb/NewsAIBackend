const { getBrowser } = require('./playwright');

module.exports = async () => {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto('https://trends.google.com/trending?geo=VN', {
      waitUntil: 'domcontentloaded',
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
        const el = trendElements[i];
        const title = (el.innerText || '').trim();
        if (title) trendData.push(title);
      }
      return trendData;
    });
    page.close();
    return trends;
  } catch (error) {
    console.error('Error in trend service:', error);
    throw error;
  }
};
