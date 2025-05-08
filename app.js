const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const User = require('./models/user');
const Blog = require('./models/blog');
const logger = require('./utils/logger');
const userExtractor = require('./middleware/userExtractor');
const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');

app.use(express.json());

morgan.token('body', (req) => {return req.method === 'POST' ? JSON.stringify(req.body) : '';});
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

app.use(cors());

app.use(userExtractor);

app.use('/api/login', loginRouter);

app.use('/api/users',usersRouter);

app.get('/api/blogs', async (request, response, next) => {
  try {
    if (request.user === null) {
      return response.status(401).json({error: 'unauthorized'});
    }
    const blogs = await Blog.find({user: request.user.id}).populate('user', 'username name id');
    response.json(blogs);  
  } catch (exception) {
    next(exception);
  }
  
});
  
app.post('/api/blogs', async (request, response, next) => {
  const blog = new Blog(request.body);
  try {
    const user = request.user;
    if (user === null) {
      return response.status(401).json({error: 'unauthorized'});
    }
    blog.user = user.id;
    const result = await blog.save();
    const userWithBlogs = await User.findById(user.id);
    userWithBlogs.blogs = userWithBlogs.blogs.concat(result.id);
    await userWithBlogs.save();

    response.status(201).json(result);
  } catch (exception) {
    next(exception);
  }
});

app.delete('/api/blogs/:id', async (request, response, next) => {
  try {
    if (request.params.id === undefined || request.params.id === null) {
      return response.status(400).json({error:'Invalid id'}).end();
    }
    const user = request.user;
    const blog = await Blog.findById(request.params.id);
    if (blog.user.toString() !== user.id){
      return response.status(403).json({error: 'Forbidden: You do not have permission to delete this blog'});
    }

    const result = await Blog.findByIdAndDelete(request.params.id);
    if (!result) {
      return response.status(404).json({error: 'Blog not found'});
    }

    await User.findByIdAndUpdate(result.user, { $pull: {blogs: blog._id}});
    
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

if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

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
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({error: 'expected `username` to be unique'});
  } else if (error.message.includes('User validation failed')) {
    return response.status(400).json({error: 'expected `username` or `password` is shorter than the minimum allowed length (3)'});
  }
  else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({error: 'token invalid'});
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({error: 'token expired'});
  }
  next(error);
};

app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;
  

