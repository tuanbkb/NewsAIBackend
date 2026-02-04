const { chromium } = require('playwright');

let browser;

exports.getBrowser = async () => {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    });
  }
  return browser;
};

exports.resolveGoogleNewsUrl = async (googleNewsUrl) => {
  const browserInstance = await this.getBrowser();
  const context = await browserInstance.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    await page.goto(googleNewsUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Google News sẽ redirect bằng JS
    await page.waitForURL(
      (url) => {
        console.log('Current URL during wait:', url);
        return !url.origin.includes('news.google.com');
      },
      {
        timeout: 10000,
        waitUntil: 'domcontentloaded',
      },
    );

    const finalUrl = page.url();
    return finalUrl;
  } finally {
    await page.close();
    await context.close();
  }
};
