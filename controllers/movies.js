const BadRequestError = require('../errors/bad-request-err');
const ForbiddenError = require('../errors/forbidden-err');
const NotFoundError = require('../errors/not-found-err');
const { Movie } = require('../models/movie');

exports.getMovies = (req, res, next) => Movie.find({})
  .then((movies) => res.status(200).send(movies))
  .catch(next);

exports.postMovie = (req, res, next) => {
  const {
    country,
    director,
    duration,
    year,
    description,
    image,
    trailer,
    nameRU,
    nameEN,
  } = req.body;
  const owner = req.user._id;
  Movie.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailer,
    nameRU,
    nameEN,
    owner,
  })
    .then((movie) => res.send({ data: movie }))
    .catch(next);
};

exports.deleteMovie = (req, res, next) => {
  const owner = req.user._id;
  Movie.findOne({ _id: req.params.movieId })
    .orFail(() => new NotFoundError('Фильм с таким id не найден'))
    .then((movie) => {
      if (!movie.owner.equels(owner)) {
        next(new ForbiddenError('Нельзя удалить чужой фильм'));
      } else {
        Movie.deleteOne(movie)
          .then(() => res.status(200).send({ message: 'Фильм удалён' }));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Данные не прошли валидацию'));
      }
      throw err;
    })
    .catch(next);
};
