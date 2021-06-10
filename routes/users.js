const express = require('express');
const { celebrate, Joi } = require('celebrate');

const {
  getMe,
  updateProfile,
} = require('../controllers/users');

const usersRoute = express.Router();

usersRoute.get('/me', getMe);
usersRoute.patch('/me', celebrate({
  body: Joi.object().keys({
    email: Joi.string().min(2).max(30).required(),
    name: Joi.string().min(2).max(30).required(),
  }),
  updateProfile,
}));
