const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const Blog = require('./models/blog');
const logger = require('./utils/logger');

app.use(express.json());

morgan.token('body', (req) => {return req.method === 'POST' ? JSON.stringify(req.body) : '';});
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

app.use(cors());

app.get('/api/blogs', async (request, response, next) => {
  try {
    const blogs = await Blog.find({});
    response.json(blogs);  
  } catch (exception) {
    next(exception);
  }
  
});
  
app.post('/api/blogs', async (request, response, next) => {
  const blog = new Blog(request.body);
  try {
    const result = await blog.save();
    response.status(201).json(result);
  } catch (exception) {
    next(exception);
  }
  
});

app.delete('/api/blogs/:id', async (request, response, next) => {
  try {
    if (request.params.id === undefined || request.params.id === null) {
      response.status(400).json({error:'Invalid id'}).end();
    }
    const result = await Blog.findByIdAndDelete(request.params.id);
    
    response.set('X-Deleted-Resource', result.id);
    response.status(204).end();
  } catch (exception) {
    next(exception);
  }
});

app.put('/api/blogs/:id', async (request, response, next) => {
  try {
    const blog = request.body;
    const result = await Blog.findByIdAndUpdate(request.params.id, blog, {new: true, runValidators: true, context: 'query'});
    
    response.json(result);
  } catch (exception) {
    next(exception);
  }
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({error: 'unknown endpoint'});
};

const errorHandler = (error, request, response, next) => {
  logger.error(error.message);
  
  if (error.name === 'CastError') {
    return response.status(400).send({error: 'malformatted id'});
  } else if (error.name === 'ValidationError'){
    return response.status(400).json({error: error.message});
  } else if (error.message.includes('Cannot read properties of null')){
    return response.status(404).json({error: error.message});
  }
  next(error);
};

app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;
  

