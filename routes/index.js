const router = require('express').Router();
const usersRoute = require('./users');
const moviesRoute = require('./movies');
const NotFoundError = require('../errors/not-found-err');

router.use(usersRoute);
router.use(moviesRoute);
router.use('*', () => {
  throw new NotFoundError('Адрес не найден');
});

module.exports = router;
