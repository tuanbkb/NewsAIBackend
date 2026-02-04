const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const app = require('./app');
const runDailyCron = require('./services/dailyCronJob');
const { getPopularNews } = require('./services/googleNews');
const { resolveGoogleNewsUrl } = require('./services/playwright');

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
resolveGoogleNewsUrl(
  'https://news.google.com/rss/articles/CBMirAFBVV95cUxNSTBvX0JVdVhmODFwWFcxVnlLclZ2ZzRFMGxvNE12ekJsdFR0d2tocUVYQ0t5enZwcnE3SmdMZWVQYXJtUFRqZmxlREs0Nkl6M3ZwWjcwcXk3SmhTRTFVdV9KLXJGamY3WWJTeXNRWExXSTRsbWFncEJ6S1dGOS1EQlJBMTc2VTZRVzgtVG5va2J2ZjJBZU1wb0RhTmRaLXpBbTVkd25fS2lJT3Jk?oc=5',
).then((res) => {
  console.log('Resolved URL:', res);
});

// cron.schedule('0 */6 * * *', () => {
//   runDailyCron().catch((err) => {
//     console.error('Scheduled daily cron job failed:', err);
//   });
// });

process.on('unhandledRejection', (err) => {
  console.log('💥 UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
