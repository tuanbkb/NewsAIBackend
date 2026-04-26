const { getBrowser } = require('./services/playwright');
const { parseArticleMainContent } = require('./services/newspaper3k');

const test = async (url) => {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log('Page loaded successfully');

    const content = await page.content();
    console.log('content:', content.slice(0, 500)); // Log the first 500 characters of the content
    const parsedArticle = parseArticleMainContent(content, { url });

    console.log('res:', parsedArticle.text);
  } catch (error) {
    console.error('Error in test function:', error);
  }
};

test(
  'https://tuoitre.vn/ong-trump-nhac-lai-can-xay-phong-khieu-vu-toi-mat-tai-nha-trang-sau-vu-no-sung-20260426225706788.htm',
);
