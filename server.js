const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const app = require('./app');
const runDailyCron = require('./services/dailyCronJob');
const { getPopularNews } = require('./services/googleNews');
const {
  resolveGoogleNewsUrl,
  getNewsContent,
  getNewsContentByTextLength,
} = require('./services/playwright');
const GoogleNews = require('./models/googleNewsModel');

process.on('uncaughtException', (err) => {
  console.log('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(db, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 5104;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// runDailyCron().catch((err) => {
//   console.error('Initial daily cron job failed:', err);
// });
// getPopularNews().then((res) => {
//   console.log(res);
// });

// cron.schedule('0 */6 * * *', () => {
//   runDailyCron().catch((err) => {
//     console.error('Scheduled daily cron job failed:', err);
//   });
// });
// getPopularNews();
// const getUniqueUrl = async () => {
//   const articles = await GoogleNews.find().exec();
//   const urlSet = new Set();
//   articles.forEach((article) => {
//     const refs = article.references || [];
//     refs.forEach((ref) => {
//       if (!ref) return '';
//       const baseUrl = ref.split('/')[2];
//       urlSet.add(baseUrl);
//     });
//   });
//   console.log(`Total unique URLs: ${urlSet.size}`);
//   console.log(Array.from(urlSet));
//   return urlSet;
// };

// getUniqueUrl();
// getNewsContent(
//   'https://vov.vn/xa-hoi/khao-sat-nang-luc-tieng-anh-cua-giao-vien-buoc-khoi-dong-cho-muc-tieu-song-ngu-post1267223.vov',
//   null,
//   'div.article-content p:not(div.article__inner-story p)',
// ).then((content) => {
//   console.log(content);
// });

const test = async () => {
  const res = await resolveGoogleNewsUrl(
    'https://news.google.com/rss/articles/CBMimAFBVV95cUxPNHhvaVNUUlFKZ0N3cWllM2hlWE40QldmTDFVMmt4ODh6SDB6aHFLWGFOMGdkRHdfQjJCMmFDNnNheHI1N01US3hSa0pXdnpDZWMzWVNrWS1oaU15emhFUjJqWWRZNGc2QzhjX1c0azcxOXBzcDRPbEJ3R0VwU2JoaVNhem9OczBTd1g2NzVENWctOGtLWVhjVg?oc=5',
  );

  console.log(res.finalUrl, res.content);
};

test();

process.on('unhandledRejection', (err) => {
  console.log('💥 UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
