const {test, after, beforeEach} = require('node:test');
const Blog = require('../models/blog');
const assert = require('node:assert');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const helper = require('./test_helper');

const api = supertest(app);

//npm test -- --test-only
//npm test -- --test-name-pattern='the first blog has 7 likes'
beforeEach(async () => {
  await Blog.deleteMany({});
 
  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog);
    await blogObject.save();
  }
});

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type',/application\/json/);
});

test('there are three blogs', async () => {
  const response = await api.get('/api/blogs');

  assert.strictEqual(response.body.length, helper.initialBlogs.length);
});

test('the first blog has 7 likes', async () => {
  const response = await api.get('/api/blogs');   
  
  const likes = response.body.map(e => e.likes);
  assert.strictEqual(likes[0], 7);
});

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 10
  };

  await api.post('/api/blogs').send(newBlog).expect(201).expect('Content-Type',/application\/json/);
  const response = await api.get('/api/blogs');
  const titles = response.body.map(r => r.title);

  assert.strictEqual(response.body.length, helper.initialBlogs.length + 1);
  assert(titles.includes('First class tests'));
  
});

test('likes property has default value 0 when is undefined', async () => {
  const newBlog = {
    title: 'Ceramic First class',
    author: 'Ennio C. Mattioli',
    url: 'https://ceramicstudio.ca/upcoming-courses/'
  };

  await api.post('/api/blogs').send(newBlog).expect(201).expect('Content-Type',/application\/json/);
  const response = await api.get('/api/blogs');
  const blog = response.body.find(r => r.author === newBlog.author);

  assert(blog.likes === 0);
});

test('unique identifier name is id', async () => {
  const response = await api.get('/api/blogs');
  const propertyName = Object.keys(response.body[0]).find(key => key === 'id');

  assert.strictEqual(propertyName, 'id');
});

test('response 400 bad request when url or title is missed', async () => {
  const newBlog = {
    title: '',
    author: 'Ennio C. Mattioli',
    url: 'https://ceramicstudio.ca/upcoming-courses/',
    likes: 5
  };

  const response = await api.post('/api/blogs').send(newBlog).expect(400).expect('Content-Type',/application\/json/);

  assert(response.body.error.includes('Blog validation failed'));
});

test('deletion of a blog', async () => {
  const blogsAtStart = await api.get('/api/blogs');
  const blogToDelete = blogsAtStart.body[0];

  await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

  const blogsAtEnd = await api.get('/api/blogs');
  assert.strictEqual(blogsAtEnd.body.length, helper.initialBlogs.length - 1);
});

test('update a blog', async () => {
  const blogsAtStart = await api.get('/api/blogs');
  let blogToUpdate = blogsAtStart.body[0];
  blogToUpdate.likes = blogToUpdate.likes + 1;

  const result = await api.put(`/api/blogs/${blogToUpdate.id}`).send(blogToUpdate).expect(200).expect('Content-Type',/application\/json/);

  assert.deepStrictEqual(result.body, blogToUpdate);
});

after(async () => {
  await mongoose.connection.close();
});