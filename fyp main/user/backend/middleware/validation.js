const validator = require('validator');

const validateRegistration = (req, res, next) => {
  const { cnic, email, phone, password } = req.body;

  if (!cnic || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  if (!/^\d{13}$/.test(cnic)) {
    return res.status(400).json({
      success: false,
      message: 'CNIC must be 13 digits'
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  if (!/^(\+92|0)?[0-9]{10}$/.test(phone.replace(/[\s-]/g, ''))) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid Pakistani phone number'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide CNIC/Email and password'
    });
  }

  next();
};

const validateVote = (req, res, next) => {
  const { electionId, candidateId, securityAnswers } = req.body;

  if (!electionId || !candidateId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide election and candidate'
    });
  }

  if (!securityAnswers || !Array.isArray(securityAnswers) || securityAnswers.length !== 3) {
    return res.status(400).json({
      success: false,
      message: 'Please provide answers to all security questions'
    });
  }

  next();
};

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(req.body[key].trim());
      }
    });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateVote,
  sanitizeInput
};
