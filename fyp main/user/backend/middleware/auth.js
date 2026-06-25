const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { hasAnyUsableBiometricLogin, hasCompletedTwoFactorBiometricMfa } = require('../utils/biometricState');
const ALLOW_DEV_ACCOUNT_REACTIVATION = process.env.NODE_ENV !== 'production';

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = await User.findById(decoded.id).select('-password -otp');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      if (ALLOW_DEV_ACCOUNT_REACTIVATION) {
        user.isActive = true;
        await user.save();
        console.warn(`[Auth][DEV_BYPASS] Reactivated suspended account for local testing: ${user.email || user._id}`);
      } else {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id).select('-password -otp');
        if (user && user.isActive) {
          req.user = user;
        }
      }
    } catch (error) {
      console.log('Optional auth failed, continuing without user');
    }
  }

  next();
};

// Require completed second-factor authentication before protected actions.
const requireMfa = async (req, res, next) => {
  try {
    // `protect` middleware must run before this so `req.user` is populated.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const hasSavedBiometrics = hasAnyUsableBiometricLogin(req.user);

    if (!hasSavedBiometrics) {
      // no biometric registration exists yet; permit access after password login only
      return next();
    }

    if (!hasCompletedTwoFactorBiometricMfa(req.user)) {
      return res.status(401).json({
        success: false,
        message: 'Biometric verification requires both fingerprint and face before accessing this resource.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Multi-factor authentication is required before accessing this resource.'
    });
  }
};

module.exports = { protect, authorize, optionalAuth, requireMfa };
