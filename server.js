const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const app = require('./app');
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
    // useNewUrlParser: true,
    serverApi: {
      version: '1',
      strict: true,
      deprecationErrors: true,
    },
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 5104;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Run getPopularNews 3 times/day: 00:00, 08:00, 16:00
cron.schedule(
  '0 */8 * * *',
  async () => {
    try {
      console.log('⏰ Cron started: getPopularNews');
      await getPopularNews();
      console.log('✅ Cron finished: getPopularNews');
    } catch (err) {
      console.log('💥 Cron error: getPopularNews');
      console.log(err.name, err.message);
    }
  },
  {
    timezone: process.env.CRON_TIMEZONE || 'Asia/Ho_Chi_Minh',
  },
);

process.on('unhandledRejection', (err) => {
  console.log('💥 UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
