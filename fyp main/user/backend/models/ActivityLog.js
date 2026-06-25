const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'registration',
      'otp_verification',
      'fingerprint_setup',
      'face_setup',
      'security_questions_set',
      'login_attempt',
      'login_success',
      'login_failed',
      'fingerprint_verification',
      'face_verification',
      'vote_cast',
      'vote_view_receipt',
      'password_reset_request',
      'password_reset_success',
      'profile_update',
      'account_locked',
      'account_unlocked',
      'suspicious_activity'
    ]
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  },
  location: {
    country: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'suspicious', 'blocked'],
    default: 'success'
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ actionType: 1, timestamp: -1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ riskScore: -1 });

activityLogSchema.statics.logActivity = async function (data) {
  try {
    const log = await this.create(data);
    return log;
  } catch (error) {
    console.error('Activity logging error:', error);
  }
};

activityLogSchema.statics.getUserActivity = async function (userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

activityLogSchema.statics.getSuspiciousActivities = async function (limit = 100) {
  return this.find({
    $or: [
      { status: 'suspicious' },
      { riskScore: { $gte: 70 } }
    ]
  })
    .populate('userId', 'email cnic name')
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
