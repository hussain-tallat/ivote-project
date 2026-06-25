const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Authentication cooldown removed per project requirement.
const authLimiter = (req, res, next) => next();

const generalLimiter = createRateLimiter(
  15 * 60 * 1000,
  1000,
  'Too many requests from this IP, please try again after 15 minutes'
);

const voteLimiter = createRateLimiter(
  60 * 60 * 1000,
  10,
  'Too many voting attempts, please try again after an hour'
);

const otpLimiter = createRateLimiter(
  15 * 60 * 1000,
  3,
  'Too many OTP requests, please try again after 15 minutes'
);

module.exports = {
  authLimiter,
  generalLimiter,
  voteLimiter,
  otpLimiter
};
