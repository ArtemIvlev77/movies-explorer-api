const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
const NotFoundError = require('../errors/not-found-err');
const BadRequestError = require('../errors/bad-request-err');
const ForbiddenError = require('../errors/forbidden-err');
const ConflictError = require('../errors/conflict-err');
const UnauthorizedError = require('../errors/unauthorized-err');

const { NODE_ENV, JWT_SECRET } = process.env;

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret',
        { expiresIn: '7d' },
      );
      return res.send({ jwt: token });
    })
    .catch(() => {
      throw new UnauthorizedError('Не удалось авторизоваться');
    })
    .catch(next);
};

exports.registartion = (req, res, next) => {
  const { email, password, name } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) => User.create({
      email,
      passowrd: hash,
      name,
    }))
    .then(() => res.status(200).send('Регистрация произведена успешно'))
    .catch((err) => {
      if (err.name === 'ValidationError' || err.name === 'CastError') {
        throw new BadRequestError('Вы указали не валидные данные');
      }
      if (err.name === 'MongoError' || err.statusCode === 11000) {
        throw new ConflictError(
          'Пользователь с таким email уже зарегистрирован',
        );
      }
    })
    .catch(next);
};

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
        next(next(new NotFoundError('Пользователь таким id не найден')));
      }
      return res.send({ data: user });
    })
    .catch(next);
};

exports.updateProfile = (req, res, next) => {
  const { email, name } = req.body;
  const owner = req.user._id;
  return User.findByIdAndUpdate(
    owner,
    { email, name },
    { new: true, runValidators: true },
  )
    .then((user) => {
      if (!user) {
        next(new NotFoundError('Нет пользователя с таким id'));
      }
      res.send(user);
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new BadRequestError('Введены не валидные данные');
      }
    })
    .catch(next);
};
