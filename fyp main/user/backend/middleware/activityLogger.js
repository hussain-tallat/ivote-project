const ActivityLog = require('../models/ActivityLog');

/**
 * Middleware to automatically log user activities
 */
const activityLogger = (actionType, description) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      try {
        if (req.user || req.body.cnic || req.body.email) {
          const userId = req.user?.id || req.userId;

          const logData = {
            userId: userId,
            actionType: actionType,
            description: typeof description === 'function' ? description(req, data) : description,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            deviceInfo: parseUserAgent(req.get('user-agent')),
            metadata: {
              endpoint: req.originalUrl,
              method: req.method,
              success: data.success || false,
              ...req.logMetadata
            },
            status: data.success ? 'success' : 'failed',
            riskScore: req.riskScore || 0
          };

          if (userId) {
            await ActivityLog.logActivity(logData);
          }
        }
      } catch (error) {
        console.error('Activity logging error:', error);
      }

      return originalJson(data);
    };

    next();
  };
};

const parseUserAgent = (userAgent) => {
  if (!userAgent) return {};

  const info = {
    browser: 'Unknown',
    os: 'Unknown',
    device: 'Desktop'
  };

  if (userAgent.includes('Chrome')) info.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) info.browser = 'Firefox';
  else if (userAgent.includes('Safari')) info.browser = 'Safari';
  else if (userAgent.includes('Edge')) info.browser = 'Edge';

  if (userAgent.includes('Windows')) info.os = 'Windows';
  else if (userAgent.includes('Mac')) info.os = 'macOS';
  else if (userAgent.includes('Linux')) info.os = 'Linux';
  else if (userAgent.includes('Android')) info.os = 'Android';
  else if (userAgent.includes('iOS')) info.os = 'iOS';

  if (userAgent.includes('Mobile')) info.device = 'Mobile';
  else if (userAgent.includes('Tablet')) info.device = 'Tablet';

  return info;
};

const manualLog = async (userId, actionType, description, req, metadata = {}) => {
  try {
    await ActivityLog.logActivity({
      userId,
      actionType,
      description,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('user-agent'),
      deviceInfo: req ? parseUserAgent(req.get('user-agent')) : {},
      metadata,
      status: metadata.status || 'success',
      riskScore: metadata.riskScore || 0
    });
  } catch (error) {
    console.error('Manual activity logging error:', error);
  }
};

module.exports = {
  activityLogger,
  manualLog
};
