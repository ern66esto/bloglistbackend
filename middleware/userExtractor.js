const jwt = require('jsonwebtoken');

const userExtractor = (request, response, next) => {
  const authorization = request.get('authorization');
  if (authorization && authorization.startsWith('Bearer ')) {
    const token = authorization.replace('Bearer ', '');
    request.user = jwt.verify(token, process.env.SECRET);
  }
  else {
    request.user = null;
  }
  next();
};

module.exports = userExtractor;