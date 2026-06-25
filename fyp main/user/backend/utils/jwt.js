const jwt = require('jsonwebtoken');

const generateToken = (userId, role = 'voter') => {
  return jwt.sign(
    {
      id: userId,
      role: role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

const generateRecoveryToken = (userId, role = 'voter') => {
  return jwt.sign(
    {
      id: userId,
      role,
      recovery: true
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30m'
    }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  generateRecoveryToken,
  verifyToken
};
