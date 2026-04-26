const { default: axios } = require('axios');
const { XMLParser } = require('fast-xml-parser');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
const pLimit = require('p-limit');
const { resolveGoogleNewsUrl, closeBrowser } = require('./playwright');
const News = require('../models/newsModel');
const { getNewsFromArticlesSummary } = require('./openAi');
const retry = require('../utils/retryFunc');

const CONCURRENCY_LIMIT = 2; // Limit concurrent browser pages
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
    let itemList = parseRes.rss.channel.item;

    itemList = itemList.slice(0, 2); // Limit to top 20 articles to control processing time

    // Check for latest saved article to avoid duplicates
    const latest = await News.findOne().sort({ createdAt: 1 }).exec();
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
    const titleMap = [];

    itemList.forEach((item, itemIndex) => {
      const desHtml = item.description;
      const $ = cheerio.load(desHtml);
      $('a').each((linkIndex, element) => {
        const href = $(element).attr('href');
        const title = $(element).text().trim();
        allUrls.push(href);
        urlIndexMap.push({ itemIndex, linkIndex });
        titleMap.push(title);
      });
    });

    // Resolve all URLs with p-limit concurrency
    console.log(
      `Resolving ${allUrls.length} URLs with concurrency limit of ${CONCURRENCY_LIMIT}...`,
    );
    let resolvedUrls = await Promise.all(
      allUrls.map((url) => limit(() => resolveGoogleNewsUrl(url))),
    );

    resolvedUrls = resolvedUrls.map((url, index) => ({
      ...url,
      title: titleMap[index],
    }));

    // Build the data with controlled concurrency
    const data = (
      await Promise.all(
        itemList.map((item, itemIndex) =>
          limit(async () => {
            const links = [];
            // let valid = true;

            // Get resolved URLs for this item
            urlIndexMap.forEach((mapping, i) => {
              if (mapping.itemIndex === itemIndex) {
                const resolvedUrl = resolvedUrls[i];
                if (
                  !resolvedUrl ||
                  !resolvedUrl.summary ||
                  resolvedUrl.summary === ''
                ) {
                  // valid = false;
                } else {
                  links.push(resolvedUrl);
                }
              }
            });

            console.log(`Article "${item.title}" has resolved URLs:`, links);

            // if (!valid) {
            if (links.length <= 1) {
              console.log(
                `Skipping article "${item.title}" due to unresolved URLs.`,
              );
              return null;
            }

            const media = links
              .map((link) => link.thumbnail)
              .filter((thumb) => thumb && thumb !== '');

            const summaries = links
              .map((link) => link.summary)
              .filter((summary) => summary && summary !== '');

            const content = await retry(() =>
              getNewsFromArticlesSummary(summaries),
            );

            return {
              title: item.title.split(' - ')[0],
              content: content || '',
              embedded_link: item.link,
              pub_date: dayjs(item.pubDate).toISOString(),
              source: item.source._url,
              references: links,
              media: media.length > 0 ? media : undefined,
              createdAt: new Date(Date.now() + itemIndex),
              updatedAt: new Date(Date.now() + itemIndex),
            };
          }),
        ),
      )
    ).filter((item) => item !== null && item.content && item.content !== '');

    // Save to database
    const savedData = await News.insertMany(data, { ordered: false });
    console.log(`Saved ${savedData.length} Google News articles to database`);
    // return data;
    // return savedData;
  } catch (error) {
    console.error('Error fetching popular news:', error);
    throw error;
  } finally {
    await closeBrowser();
  }
};

exports.getNewsFromKeyword = async (
  keyword,
  language = 'vi',
  countryCode = 'VN',
) => {
  try {
    const res = await this.googleNewsInstance.get('/rss/search', {
      params: {
        q: keyword,
        hl: `${language}-${countryCode}`,
        gl: countryCode,
        ceid: `${countryCode}:${language}`,
      },
      responseType: 'arraybuffer',
    });
    const parser = new XMLParser();
    const parseRes = parser.parse(res.data);
    const list = parseRes.rss.channel.item;
    if (!list || list.length === 0) {
      return [];
    }
    const itemList = parseRes.rss.channel.item.slice(0, 5); // Limit to top 5 results
    const data = await Promise.all(
      itemList.map(async (item) =>
        limit(async () => {
          const { link } = item;
          const resolved = await resolveGoogleNewsUrl(link);
          if (!resolved || !resolved.summary || resolved.summary === '') {
            console.log(
              `Skipping article "${item.title}" due to unresolved URL: ${link}`,
            );
            return null;
          }
          return {
            title: item.title.split(' - ')[0],
            content: resolved.summary,
            url: resolved.url,
            favicon: resolved.favicon ? resolved.favicon : undefined,
            source_name: resolved.source_name
              ? resolved.source_name
              : undefined,
            thumbnail: resolved.thumbnail ? resolved.thumbnail : undefined,
          };
        }),
      ),
    );

    const resData = data.filter(
      (item) => item !== null && item.content && item.content !== '',
    );
    return resData;
  } catch (error) {
    console.error('Error fetching news from keyword:', error);
    throw error;
  } finally {
    await closeBrowser();
  }
};
