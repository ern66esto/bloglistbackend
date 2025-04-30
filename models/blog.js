const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('../utils/config');

mongoose.set('strictQuery', false);
logger.info('connecting to', config.MONGO_URI);

mongoose.connect(config.MONGO_URI)
  .then(result => {
    logger.info('connected to MongoDB');
  })
  .catch(error => {
    logger.error('error connecting to MongoDB', error.message);
  });

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: String,
  url: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: true
  }
});

blogSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const gracefulShutdown = () => {
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown).on('SIGTERM', gracefulShutdown);

module.exports = mongoose.model('Blog',blogSchema);