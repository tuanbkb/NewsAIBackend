const { default: mongoose } = require('mongoose');

const googleNewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, 'A Google News article must have a title'],
    },
    embedded_link: {
      type: String,
      trim: true,
      required: [true, 'A Google News article must have an embedded link'],
    },
    pub_date: {
      type: Date,
      required: [true, 'A Google News article must have a publication date'],
    },
    source: {
      type: String,
      trim: true,
    },
    references: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const GoogleNews = mongoose.model('GoogleNews', googleNewsSchema);

module.exports = GoogleNews;
