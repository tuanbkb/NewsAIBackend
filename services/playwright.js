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

exports.resolveGoogleNewsUrl = async (
  googleNewsUrl,
  minTextLength = 50,
  minWordCount = 10,
) => {
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

    await page.waitForURL((url) => !url.origin.includes('news.google.com'), {
      timeout: 10000,
      waitUntil: 'domcontentloaded',
    });

    const finalUrl = page.url();

    const content = await page.evaluate(
      ({ minTextLength: minTxtLng, minWordCount: minWrdCnt }) => {
        const paragraphs = document.querySelectorAll('p');
        const filteredParagraphs = [];

        paragraphs.forEach((p) => {
          const text = p.innerText.trim();
          if (text.length === 0) return;

          const wordCount = text.split(/\s+/).length;
          const textLength = text.length;

          if (textLength >= minTxtLng && wordCount >= minWrdCnt) {
            filteredParagraphs.push(text);
          }
        });

        return filteredParagraphs.join('\n\n');
      },
      { minTextLength, minWordCount },
    );
    return { finalUrl, content: content.toString() };
  } catch (error) {
    console.error('Error resolving Google News URL:', error);
    return { finalUrl: googleNewsUrl, content: '' };
  } finally {
    await page.close();
    await context.close();
  }
};

exports.getNewsContent = async (url, role, locator) => {
  const browserInstance = await this.getBrowser();
  const context = await browserInstance.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    let element;
    if (role && locator) {
      element = page.getByRole(role).locator(locator);
    } else if (role) {
      element = page.getByRole(role);
    } else if (locator) {
      element = page.locator(locator);
    } else {
      element = page.locator('body');
    }

    const data = await element.allInnerTexts();
    const content = data.join('\n');

    return content;
  } catch (error) {
    console.error('Error getting news content:', error);
    return '';
  } finally {
    await page.close();
    await context.close();
  }
};

exports.getNewsContentByTextLength = async (
  url,
  minTextLength = 50,
  minWordCount = 10,
) => {
  const browserInstance = await this.getBrowser();
  const context = await browserInstance.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    const content = await page.evaluate(
      ({ minTextLength: minTxtLng, minWordCount: minWrdCnt }) => {
        const paragraphs = document.querySelectorAll('p');
        const filteredParagraphs = [];

        paragraphs.forEach((p) => {
          const text = p.innerText.trim();
          if (text.length === 0) return;

          const wordCount = text.split(/\s+/).length;
          const textLength = text.length;

          if (textLength >= minTxtLng && wordCount >= minWrdCnt) {
            filteredParagraphs.push(text);
          }
        });

        return filteredParagraphs.join('\n\n');
      },
      { minTextLength, minWordCount },
    );

    console.log('Extracted content length:', content.length);
    console.log('Extracted content:', content.toString());
    return content;
  } catch (error) {
    console.error('Error getting news content by text density:', error);
    return '';
  } finally {
    await page.close();
    await context.close();
  }
};

exports.closeBrowser = async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
};
