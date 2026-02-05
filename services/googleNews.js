const { default: axios } = require('axios');
const { XMLParser } = require('fast-xml-parser');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
const pLimit = require('p-limit');
const { resolveGoogleNewsUrl, closeBrowser } = require('./playwright');
const GoogleNews = require('../models/googleNewsModel');

const CONCURRENCY_LIMIT = 3; // Limit concurrent browser pages
const limit = pLimit(CONCURRENCY_LIMIT);

exports.googleNewsInstance = axios.create({
  baseURL: 'https://news.google.com',
});

exports.getPopularNews = async (language = 'vi', countryCode = 'VN') => {
  try {
    const res = await this.googleNewsInstance.get(
      '/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FuWnBHZ0pXVGlnQVAB',
      {
        params: {
          hl: `${language}-${countryCode}`,
          gl: countryCode,
          ceid: `${countryCode}:${language}`,
        },
        responseType: 'arraybuffer',
      },
    );
    const parser = new XMLParser();
    const parseRes = parser.parse(res.data);
    const itemList = parseRes.rss.channel.item;

    // Collect all URLs to resolve
    const allUrls = [];
    const urlIndexMap = []; // Track which item and index each URL belongs to

    itemList.forEach((item, itemIndex) => {
      const desHtml = item.description;
      const $ = cheerio.load(desHtml);
      $('a').each((linkIndex, element) => {
        const href = $(element).attr('href');
        allUrls.push(href);
        urlIndexMap.push({ itemIndex, linkIndex });
      });
    });

    // Resolve all URLs with p-limit concurrency
    console.log(
      `Resolving ${allUrls.length} URLs with concurrency limit of ${CONCURRENCY_LIMIT}...`,
    );
    let resolvedUrls = await Promise.all(
      allUrls.map((url) => limit(() => resolveGoogleNewsUrl(url))),
    );

    resolvedUrls = resolvedUrls.filter((url) => url !== '');

    // Build the data with resolved URLs
    const data = itemList.map((item, itemIndex) => {
      const links = [];

      // Get resolved URLs for this item
      urlIndexMap.forEach((mapping, i) => {
        if (mapping.itemIndex === itemIndex) {
          links.push(resolvedUrls[i]);
        }
      });

      return {
        title: item.title.split(' - ')[0],
        embedded_link: item.link,
        pub_date: dayjs(item.pubDate).toISOString(),
        source: item.source._url,
        references: links,
      };
    });

    // Save to database
    const savedData = await GoogleNews.insertMany(data, { ordered: false });
    console.log(`Saved ${savedData.length} Google News articles to database`);

    await closeBrowser();
    return savedData;
  } catch (error) {
    console.error('Error fetching popular news:', error);
    throw error;
  }
};
