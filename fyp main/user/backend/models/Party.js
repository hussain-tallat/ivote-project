const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add party name'],
    unique: true,
    trim: true
  },
  shortName: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: [true, 'Please add party symbol']
  },
  logo: {
    type: String
  },
  description: {
    type: String
  },
  founded: {
    type: Date
  },
  leader: {
    type: String
  },
  ideology: {
    type: String
  },
  headquarters: {
    type: String
  },
  website: {
    type: String
  },
  manifesto: {
    type: String
  },
  color: {
    type: String,
    default: '#000000'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registrationNumber: {
    type: String,
    unique: true
  },
  totalSeats: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

partySchema.index({ name: 1 });
partySchema.index({ isActive: 1 });

module.exports = mongoose.model('Party', partySchema);
