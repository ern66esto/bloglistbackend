const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');
const {body, validationResult } = require('express-validator');

usersRouter.post('/', [body('password').isLength({min: 3}).withMessage('Password must be at least 3 characters long')], async (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400).json({errors: errors.array()});
  }
  const {username, name, password} = request.body;

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  const savedUser = await user.save();

  response.status(201).json(savedUser);
});

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs');
  
  response.json(users);
});

module.exports = usersRouter;