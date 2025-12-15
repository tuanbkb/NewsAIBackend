const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const app = require('./app');
const runDailyCron = require('./services/dailyCronJob');

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

runDailyCron().catch((err) => {
  console.error('Initial daily cron job failed:', err);
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
