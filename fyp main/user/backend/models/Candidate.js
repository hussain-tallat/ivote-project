const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add candidate name'],
    trim: true
  },
  cnic: {
    type: String,
    required: [true, 'Please add candidate CNIC'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{13}$/.test(v);
      },
      message: 'CNIC must be 13 digits'
    }
  },
  email: {
    type: String,
    required: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  phone: {
    type: String,
    required: true
  },
  photo: {
    type: String
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: [true, 'Please add party']
  },
  partySymbol: {
    type: String
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
  biography: {
    type: String
  },
  education: {
    type: String
  },
  achievements: [String],
  promises: [String],
  experience: {
    type: String
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  address: {
    type: String
  },
  elections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election'
  }],
  totalVotes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'disqualified', 'withdrawn'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

candidateSchema.index({ cnic: 1 });
candidateSchema.index({ party: 1, constituency: 1 });
candidateSchema.index({ districtCode: 1, halqaId: 1 });
candidateSchema.index({ status: 1, isActive: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);
