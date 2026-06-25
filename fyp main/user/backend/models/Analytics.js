const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  hourlyVotes: {
    type: Number,
    default: 0
  },
  turnoutRate: {
    type: Number,
    default: 0
  },
  partyWiseVotes: [{
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Party'
    },
    partyName: String,
    votes: Number,
    percentage: Number
  }],
  candidateWiseVotes: [{
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate'
    },
    candidateName: String,
    votes: Number,
    percentage: Number
  }],
  regionWiseVotes: [{
    region: String,
    votes: Number,
    percentage: Number
  }],
  fraudMetrics: {
    totalFraudAttempts: {
      type: Number,
      default: 0
    },
    flaggedVotes: {
      type: Number,
      default: 0
    },
    fraudPercentage: {
      type: Number,
      default: 0
    },
    commonFraudTypes: [{
      type: String,
      count: Number
    }]
  },
  peakVotingTime: {
    hour: Number,
    votes: Number
  },
  averageVotingTime: Number,
  uniqueVoters: {
    type: Number,
    default: 0
  },
  biometricVerifications: {
    face: Number,
    fingerprint: Number
  }
}, {
  timestamps: true
});

analyticsSchema.index({ electionId: 1, timestamp: -1 });
analyticsSchema.index({ electionId: 1, totalVotes: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
