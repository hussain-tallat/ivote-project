const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  voterCnic: {
    type: String,
    required: true
  },
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  voteHash: {
    type: String,
    required: true,
    unique: true
  },
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: {
    type: String
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    browser: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    country: String
  },
  biometricVerified: {
    face: {
      type: Boolean,
      default: false
    },
    fingerprint: {
      type: Boolean,
      default: false
    }
  },
  securityQuestionVerified: {
    type: Boolean,
    default: false
  },
  fraudScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  status: {
    type: String,
    enum: ['valid', 'flagged', 'verified', 'rejected'],
    default: 'valid'
  },
  verificationAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

voteSchema.index({ voter: 1, election: 1 }, { unique: true });
voteSchema.index({ election: 1, candidate: 1 });
voteSchema.index({ voteHash: 1 });
voteSchema.index({ receiptNumber: 1 });
voteSchema.index({ timestamp: 1 });
voteSchema.index({ isFlagged: 1, fraudScore: -1 });

voteSchema.pre('save', function(next) {
  if (!this.receiptNumber) {
    this.receiptNumber = `VR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Vote', voteSchema);
