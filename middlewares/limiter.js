const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowsMs: 15 * 60 * 1000,
  max: 100,
});

module.exports = limiter;
