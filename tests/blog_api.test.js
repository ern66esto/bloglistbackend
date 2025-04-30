const {test, after, beforeEach, describe} = require('node:test');
const bcrypt = require('bcrypt');
const Blog = require('../models/blog');
const assert = require('node:assert');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const helper = require('./test_helper');
const User = require('../models/user');

const api = supertest(app);

//npm test -- --test-only
//npm test -- --test-name-pattern='the first blog has 7 likes'


describe('when there is initially at least one user in db', () => {
  beforeEach(async () => {
    await Blog.deleteMany({});
    await User.deleteMany({});
   
    for (let user of helper.initialUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const newUser = new User({username: user.username, name: user.name, passwordHash});
      await newUser.save();
    }
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    };

    await api.post('/api/users').send(newUser).expect(201).expect('Content-Type',/application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);
    
    const usernames = usersAtEnd.map(u => u.username);
    assert(usernames.includes(newUser.username));
  });

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert(result.body.error.includes('expected `username` to be unique'));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test('creation fails with proper statuscode and message if username length is shorter than the minimum allowed length (3)', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'ml',
      name: 'Mat Lukainen',
      password: 'sanen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert(result.body.error.includes('User validation failed: username: Path `username`'));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test('creation fails with proper statuscode and message if password length is shorter than the minimum allowed length (3)', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'melanie',
      name: 'Malanie Dupont',
      password: 'me',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert(result.body.errors[0].msg.includes('Password must be at least 3 characters long'));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
});

describe('creation of blogs once users is created', () => {
  beforeEach(async () => {
    await Blog.deleteMany({});
    await User.updateMany({}, { $set: { blogs: [] } });
    
    const users = helper.initialUsers;
    for (let index = 0; index < helper.initialBlogs.length; index++) {
      let userToken = await helper.userTokenForBlogs(users[index].name);
      await api.post('/api/blogs').set('Authorization', `Bearer ${userToken}`).send(helper.initialBlogs[index]);
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
  
  test('one blog has 7 likes', async () => {
    const response = await api.get('/api/blogs');   

    const blog = response.body.find(l => l.likes === 7);
    assert.strictEqual(blog.likes, 7);
  });
  
  test('a valid blog can be added', async () => {
    const newBlog = {
      title: 'First class tests',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.html',
      likes: 10
    };
    
    const userToken = await helper.userToken('Michael Chan');
    await api.post('/api/blogs').set('Authorization', `Bearer ${userToken}`).send(newBlog).expect(201).expect('Content-Type',/application\/json/);
    const response = await api.get('/api/blogs');
    const titles = response.body.map(r => r.title);
  
    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1);
    assert(titles.includes('First class tests'));
    
  });

  test('unauthorized to add a blog', async () => {
    const newBlog = {
      title: 'First class tests',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.html',
      likes: 10
    };
    
    const result = await api.post('/api/blogs').send(newBlog).expect(401).expect('Content-Type',/application\/json/);
    assert(result.body.error.includes('unauthorized'));
  });
  
  test('likes property has default value 0 when is undefined', async () => {
    const newBlog = {
      title: 'Ceramic First class',
      author: 'Mahmoud Baghaeian',
      url: 'https://ceramicstudio.ca/upcoming-courses/'
    };
    const userToken = await helper.userTokenForBlogs('Edsger W. Dijkstra');
    await api.post('/api/blogs').set('Authorization', `Bearer ${userToken}`).send(newBlog).expect(201).expect('Content-Type',/application\/json/);
    const response = await api.get('/api/blogs');
    const blog = response.body.find(r => r.title === newBlog.title);
  
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
      author: 'Michael Chan',
      url: 'https://ceramicstudio.ca/upcoming-courses/',
      likes: 5
    };
    const userToken = await helper.userToken(newBlog.author);
    const response = await api.post('/api/blogs').set('Authorization', `Bearer ${userToken}`).send(newBlog).expect(400).expect('Content-Type',/application\/json/);
  
    assert(response.body.error.includes('Blog validation failed'));
  });
  
  test('deletion of a blog with valid user', async () => {
    const blogsAtStart = await api.get('/api/blogs');
    const blogToDelete = blogsAtStart.body.find(u => u.user.username === 'mluukkai');
    const userToken = await helper.userTokenForBlogs(blogToDelete.user.name);
    await api.delete(`/api/blogs/${blogToDelete.id}`).set('Authorization', `Bearer ${userToken}`).expect(204);
  
    const blogsAtEnd = await api.get('/api/blogs');
    assert.strictEqual(blogsAtEnd.body.length, helper.initialBlogs.length - 1);
  });

  test('deletion of a blog fail with invalid user', async () => {
    const blogsAtStart = await api.get('/api/blogs');
    const blogToDelete = blogsAtStart.body.find(u => u.user.username === 'mluukkai');
    const invalidUserToDelete = blogsAtStart.body.find(u => u.user.username !== 'mluukkai');
    const userToken = await helper.userTokenForBlogs(invalidUserToDelete.user.name);
    await api.delete(`/api/blogs/${blogToDelete.id}`).set('Authorization', `Bearer ${userToken}`).expect(403);
  
    const blogsAtEnd = await api.get('/api/blogs');
    assert.strictEqual(blogsAtEnd.body.length, helper.initialBlogs.length);
  });
  
  test('update a blog', async () => {
    const blogsAtStart = await api.get('/api/blogs');
    let blogToUpdate = blogsAtStart.body[0];
    blogToUpdate.likes = blogToUpdate.likes + 1;
    const userId = blogToUpdate.user.id;
    blogToUpdate.user = userId;
  
    const result = await api.put(`/api/blogs/${blogToUpdate.id}`).send(blogToUpdate).expect(200).expect('Content-Type',/application\/json/);
  
    assert.deepStrictEqual(result.body, blogToUpdate);
  });
});


after(async () => {
  await mongoose.connection.close();
});