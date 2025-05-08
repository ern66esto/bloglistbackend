const User = require('../models/user');
const app = require('../app');
const supertest = require('supertest');
const api = supertest(app);

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'GitHub',
    url: 'https://reactpatterns.com/',
    likes: 7,
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Arizona Faculty Sites',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
  },
  {
    title: 'Canonical string reduction',
    author: 'Mikhail Esteves',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
  },
]; 

const initialUsers = [
  {
    username: 'mluukkai',
    name: 'Matti Luukkainen',
    password: 'salainen'
  },
  {
    username: 'mchan',
    name: 'Michael Chan',
    password: 'april-28'
  },
  {
    username: 'wdijkstra',
    name: 'Edsger W. Dijkstra',
    password: '2025-wdi'
  }
];

const usersInDb = async () => {
  const users = await User.find({});
  return users.map(u => u.toJSON());
};

// This function is only for Michael Chan in unit test for user validation
const userToken = async (name) => {
  const usersInDB = await usersInDb();
  const user = usersInDB.find(u => u.name === name);
  const userObject = {username: user.username, password: 'april-28'};
  const userCredentials = await api.post('/api/login').send(userObject).expect(200);
  const userToken = userCredentials.body.token;
  return userToken;
};

// This function is for any initial user in unit test for user validation
const userTokenForBlogs = async (name) => {
  const usersForTest = await initialUsers;
  const user = usersForTest.find(u => u.name === name);
  const userObject = {username: user.username, password: user.password};
  const userCredentials = await api.post('/api/login').send(userObject).expect(200);
  const userToken = userCredentials.body.token;
  return userToken;
};



module.exports = {initialBlogs, usersInDb, initialUsers, userToken, userTokenForBlogs};