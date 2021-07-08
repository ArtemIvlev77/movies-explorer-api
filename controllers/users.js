const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/user');

const { NODE_ENV, JWT_SECRET } = process.env;

const NotFoundError = require('../errors/not-found-err');
const BadRequestError = require('../errors/bad-request-err');
const ConflictError = require('../errors/conflict-err');
const UnauthorizedError = require('../errors/unauthorized-err');
const ForbiddenError = require('../errors/forbidden-err');

exports.getMe = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Нет доступа' });
  }

  const token = authorization.replace('Bearer ', '');

  const isAuthorized = () => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return false;
    }
  };

  if (!isAuthorized(token)) {
    throw new ForbiddenError('Доступ запрещен');
  }

  return User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        next(new NotFoundError('Нет пользователя с таким id'));
      }
      return res.status(200).send({ data: user });
    })
    .catch(next);
};

exports.updateProfile = (req, res, next) => {
  const { name, email } = req.body;
  const owner = req.user._id;
  return User.findByIdAndUpdate(
    owner,
    { name, email },
    { new: true, runValidators: true },
  )
    .then((user) => {
      if (!user) {
        next(new NotFoundError('Нет пользователя с таким id'));
      }
      res.send(user);
    })
    .catch(() => {
      throw new ConflictError('Произошел конфликт');
    })
    .catch(next);
};

exports.registration = (req, res, next) => {
  const { name, email, password } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) => User.create({
      name,
      email,
      password: hash,
    }))
    .then((user) => res.status(200).send({ mail: user.email }))
    .catch((err) => {
      if (err.name === 'ValidationError' || err.name === 'CastError') {
        throw new BadRequestError('Данные не прошли валидацию');
      }
      if (err.name === 'MongoError' || err.code === '11000') {
        throw new ConflictError('Такой емейл уже зарегистрирован');
      }
      throw err;
    })
    .catch(next);
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret',
        { expiresIn: '7d' },
      );
      return res.send({ jwt: token });
    })
    .catch(() => {
      throw new UnauthorizedError('Не удалось авторизироваться');
    })
    .catch(next);
};
