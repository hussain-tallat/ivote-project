const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add election title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add election description']
  },
  type: {
    type: String,
    enum: ['National', 'Provincial', 'Local', 'Senate', 'Presidential'],
    required: true
  },
  districtCode: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  halqaId: {
    type: String,
    trim: true,
    uppercase: true
  },
  constituency: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Please add start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add end date']
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  candidates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  }],
  parties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party'
  }],
  totalVotes: {
    type: Number,
    default: 0
  },
  eligibleVoters: {
    type: Number,
    default: 0
  },
  turnoutPercentage: {
    type: Number,
    default: 0
  },
  results: [{
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate'
    },
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Party'
    },
    votes: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  }],
  fraudDetectionEnabled: {
    type: Boolean,
    default: true
  },
  allowedRegions: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

electionSchema.index({ status: 1, startDate: 1 });
electionSchema.index({ type: 1, constituency: 1 });
electionSchema.index({ districtCode: 1, halqaId: 1 });

electionSchema.methods.updateStatus = function() {
  const now = new Date();
  if (now < this.startDate) {
    this.status = 'upcoming';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'active';
  } else {
    this.status = 'completed';
  }
  return this.save();
};

electionSchema.methods.calculateResults = async function() {
  const Vote = mongoose.model('Vote');
  const votes = await Vote.find({ election: this._id });
  
  const resultMap = new Map();
  votes.forEach(vote => {
    const key = vote.candidate.toString();
    resultMap.set(key, (resultMap.get(key) || 0) + 1);
  });

  this.results = Array.from(resultMap.entries()).map(([candidateId, votes]) => ({
    candidateId,
    votes,
    percentage: (votes / this.totalVotes) * 100
  }));

  return this.save();
};

module.exports = mongoose.model('Election', electionSchema);
