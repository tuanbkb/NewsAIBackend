const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(db, {
    useNewUrlParser: true,
  })
  .then((con) => {
    console.log(con.connections);
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 5104;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
