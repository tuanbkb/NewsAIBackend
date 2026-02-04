const { default: axios } = require('axios');
const { XMLParser } = require('fast-xml-parser');

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
    const data = itemList.map((item) => ({
      title: item.title.split(' - ')[0],
      link: item.link,
      pubDate: item.pubDate,
      source: item.source,
      description: item.description,
    }));
    return data;
  } catch (error) {
    console.error('Error fetching popular news:', error);
    throw error;
  }
};
