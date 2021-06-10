require('dotenv').config();
const express = require('express');
const { errors } = require('celebrate');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const router = require('./routes/index');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const mainErrorHandler = require('./middlewares/mainErrorHandler');
const limiter = require('./middlewares/limiter');

const app = express();

const { PORT = 3000 } = process.env;

app.use(cors());

mongoose
  .connect('mongodb://localhost:27017/movies-explorer', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to DB'));

app.use(helmet());
app.use(express.json());
app.use(requestLogger);
app.use(limiter);
app.use(router);
app.use(errorLogger);
app.use(errors());
app.use(mainErrorHandler);

app.listen(PORT, () => {
  console.log(`App слушает порт ${PORT}`);
});
