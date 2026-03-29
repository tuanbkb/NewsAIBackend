const { chromium } = require('playwright');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const retry = require('../utils/retryFunc');
const { getArticleSummary } = require('./openAi');

let browser;

const extractThumbnail = async (page, baseUrl) => {
  const normalizeImageUrl = (rawUrl) => {
    if (!rawUrl) return '';
    try {
      const absolute = new URL(rawUrl.trim(), baseUrl).href;
      return absolute.startsWith('data:') ? '' : absolute;
    } catch (_error) {
      return '';
    }
  };

  let thumbnail = '';
  const metaCandidates = [
    { selector: 'meta[property="og:image"]', attribute: 'content' },
    { selector: 'meta[name="og:image"]', attribute: 'content' },
    { selector: 'meta[property="twitter:image"]', attribute: 'content' },
    { selector: 'meta[name="twitter:image"]', attribute: 'content' },
    { selector: 'link[rel="image_src"]', attribute: 'href' },
  ];

  await metaCandidates.reduce(async (previous, candidate) => {
    await previous;
    if (thumbnail) return;

    const locator = page.locator(candidate.selector).first();
    const count = await locator.count();
    if (count > 0) {
      const value = await locator.getAttribute(candidate.attribute);
      thumbnail = normalizeImageUrl(value);
    }
  }, Promise.resolve());

  if (!thumbnail) {
    const imageCandidates = ['article img', 'main img', 'img'];
    const imageAttributes = ['src', 'data-src', 'data-original'];

    await imageCandidates.reduce(async (previous, selector) => {
      await previous;
      if (thumbnail) return;

      const locator = page.locator(selector).first();
      const count = await locator.count();
      if (count > 0) {
        await imageAttributes.reduce(async (prevAttribute, attribute) => {
          await prevAttribute;
          if (thumbnail) return;

          const value =
            attribute === 'src'
              ? await locator.evaluate(
                  (el) => el.currentSrc || el.getAttribute('src') || '',
                )
              : await locator.getAttribute(attribute);
          thumbnail = normalizeImageUrl(value);
        }, Promise.resolve());
      }
    }, Promise.resolve());
  }

  return thumbnail;
};

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

    await page.waitForURL(
      (url) =>
        !url.origin.includes('news.google.com') ||
        url.origin.includes('stories'),
      {
        timeout: 10000,
        waitUntil: 'domcontentloaded',
      },
    );

    const finalUrl = page.url();
    if (finalUrl.includes('stories')) {
      return null;
    }
    const thumbnail = await extractThumbnail(page, finalUrl);

    // page.on('console', (msg) => console.log('Browser:', msg.text()));

    const pageContent = await page.content();
    const dom = new JSDOM(pageContent, { finalUrl });

    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) return null;

    const content = article.textContent.trim();

    // const content = await page.evaluate(
    //   ({ minTextLength: minTxtLng, minWordCount: minWrdCnt }) => {
    //     const paragraphs = document.querySelectorAll('p');
    //     const filteredParagraphs = [];

    //     paragraphs.forEach((p, index) => {
    //       const text = Array.from(p.childNodes)
    //         .filter((n) => n.nodeType === Node.TEXT_NODE)
    //         .map((n) => n.textContent)
    //         .join('')
    //         .trim();

    //       if (text.length === 0) return;

    //       const wordCount = text.split(/\s+/).length;
    //       const textLength = text.length;

    //       if (textLength >= minTxtLng && wordCount >= minWrdCnt) {
    //         filteredParagraphs.push(text);
    //       }
    //     });

    // filteredParagraphs.forEach((para, idx) => {
    //   console.log(`Paragraph ${idx + 1}: ${para}`);
    // });

    //     return filteredParagraphs.join('\n\n');
    //   },
    //   { minTextLength, minWordCount },
    // );
    const strContent = content.toString();
    const summary = await retry(() => getArticleSummary(strContent));
    return { url: finalUrl, summary, thumbnail };
  } catch (error) {
    console.error('Error resolving Google News URL:', error);
    return { url: googleNewsUrl, summary: '', thumbnail: '' };
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
        // eslint-disable-next-line no-undef
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
