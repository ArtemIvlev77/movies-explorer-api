const express = require('express');
const { celebrate, Joi } = require('celebrate');
const { registration, login } = require('../controllers/users');
const auth = require('../middlewares/auth');

const {
  getMe,
  updateProfile,
} = require('../controllers/users');

const usersRoute = express.Router();

usersRoute.post(
  '/signup',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().min(2).max(30),
      email: Joi.string()
        .required()
        .email(),
      password: Joi.string().required(),
    }),
  }),
  registration,
);

usersRoute.post(
  '/signin',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
    }),
  }),
  login,
);

usersRoute.use(auth);
usersRoute.get('/me', getMe);
usersRoute.patch('/me', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    name: Joi.string().min(2).max(30).required(),
  }),
  updateProfile,
}));
