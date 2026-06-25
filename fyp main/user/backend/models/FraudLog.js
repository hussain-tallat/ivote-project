const mongoose = require('mongoose');

const fraudLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  userCnic: {
    type: String,
    default: ''
  },
  voteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vote'
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election'
  },
  fraudType: {
    type: String,
    enum: [
      'multiple_votes',
      'duplicate_ip',
      'duplicate_device',
      'suspicious_pattern',
      'rapid_voting',
      'biometric_mismatch',
      'security_question_fail',
      'location_anomaly',
      'time_anomaly',
      'bot_detected',
      'vpn_detected',
      'proxy_detected',
      'other'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  description: {
    type: String,
    required: true
  },
  evidence: {
    ipAddress: String,
    deviceFingerprint: String,
    userAgent: String,
    location: {
      latitude: Number,
      longitude: Number,
      city: String,
      country: String
    },
    timestamp: Date,
    additionalData: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  deviceInfo: {
    userAgent: String,
    platform: String,
    browser: String,
    deviceId: String
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['detected', 'investigating', 'confirmed', 'false_positive', 'resolved'],
    default: 'detected'
  },
  actionTaken: {
    type: String,
    enum: ['none', 'flagged', 'blocked', 'reported', 'account_suspended'],
    default: 'none'
  },
  investigatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  investigationNotes: String,
  resolvedAt: Date,
  aiPrediction: {
    model: String,
    confidence: Number,
    features: mongoose.Schema.Types.Mixed
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  notificationSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

fraudLogSchema.index({ userId: 1, detectedAt: -1 });
fraudLogSchema.index({ electionId: 1, fraudType: 1 });
fraudLogSchema.index({ riskScore: -1, detectedAt: -1 });
fraudLogSchema.index({ status: 1, severity: 1 });
fraudLogSchema.index({ isResolved: 1 });

fraudLogSchema.methods.markAsResolved = function(adminId, notes) {
  this.status = 'resolved';
  this.isResolved = true;
  this.investigatedBy = adminId;
  this.investigationNotes = notes;
  this.resolvedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('FraudLog', fraudLogSchema);
