const { default: axios } = require('axios');
const { XMLParser } = require('fast-xml-parser');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
const pLimit = require('p-limit');
const { resolveGoogleNewsUrl, closeBrowser } = require('./playwright');
const GoogleNews = require('../models/googleNewsModel');

const CONCURRENCY_LIMIT = 2; // Limit concurrent browser pages
const limit = pLimit(CONCURRENCY_LIMIT);

exports.googleNewsInstance = axios.create({
  baseURL: 'https://news.google.com',
});

exports.getPopularNews = async (language = 'vi', countryCode = 'VN') => {
  try {
    const res = await this.googleNewsInstance.get(
      '/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FuWnBHZ0pXVGlnQVAB',
      // '/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNREZqY21RMUVnSjJhU2dBUAE',
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
    let itemList = parseRes.rss.channel.item;

    // itemList = itemList.slice(2, 4); // Limit to top 20 articles to reduce load

    // Check for latest saved article to avoid duplicates
    const latest = await GoogleNews.findOne().sort({ createdAt: 1 }).exec();
    console.log(latest);

    if (latest) {
      const latestEmbeddedUrl = latest.embedded_link;
      const latestIndex = itemList.findIndex(
        (item) => item.link === latestEmbeddedUrl,
      );
      if (latestIndex !== -1) {
        itemList = itemList.splice(0, latestIndex);
        console.log(
          `Found latest article in feed. Processing ${itemList.length} new articles.`,
        );
      } else {
        console.log(
          `Latest article not found in feed. Processing all ${itemList.length} articles.`,
        );
      }
    }

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
    const resolvedUrls = await Promise.all(
      allUrls.map((url) => limit(() => resolveGoogleNewsUrl(url))),
    );

    console.log('Resolved URLs:', resolvedUrls);

    // resolvedUrls = resolvedUrls.filter((url) => url !== '');

    // Build the data with resolved URLs
    const data = itemList
      .map((item, itemIndex) => {
        const links = [];
        let valid = true;

        // Get resolved URLs for this item
        urlIndexMap.forEach((mapping, i) => {
          if (mapping.itemIndex === itemIndex) {
            const resolvedUrl = resolvedUrls[i];
            if (
              !resolvedUrl ||
              !resolvedUrl.content ||
              resolvedUrl.content === ''
            ) {
              valid = false;
            }
            links.push(resolvedUrl);
          }
        });

        console.log(`Article "${item.title}" has resolved URLs:`, links);

        if (!valid) {
          console.log(
            `Skipping article "${item.title}" due to unresolved URLs.`,
          );
          return null;
        }

        return {
          title: item.title.split(' - ')[0],
          embedded_link: item.link,
          pub_date: dayjs(item.pubDate).toISOString(),
          source: item.source._url,
          references: links,
          createdAt: new Date(Date.now() + itemIndex),
          updatedAt: new Date(Date.now() + itemIndex),
        };
      })
      .filter((item) => item !== null);

    // Save to database
    const savedData = await GoogleNews.insertMany(data, { ordered: false });
    console.log(`Saved ${savedData.length} Google News articles to database`);

    await closeBrowser();
    // return data;
    // return savedData;
  } catch (error) {
    console.error('Error fetching popular news:', error);
    throw error;
  }
};
