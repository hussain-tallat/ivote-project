const mongoose = require('mongoose');

const securityQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['personal', 'family', 'education', 'work', 'misc'],
    default: 'personal'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

securityQuestionSchema.statics.getDefaultQuestions = function() {
  return [
    { question: 'What is your mother\'s maiden name?', category: 'family', displayOrder: 1 },
    { question: 'What was the name of your first pet?', category: 'personal', displayOrder: 2 },
    { question: 'In which city were you born?', category: 'personal', displayOrder: 3 },
    { question: 'What is your favorite color?', category: 'personal', displayOrder: 4 },
    { question: 'What was the name of your elementary school?', category: 'education', displayOrder: 5 },
    { question: 'What is your father\'s middle name?', category: 'family', displayOrder: 6 },
    { question: 'What was your childhood nickname?', category: 'personal', displayOrder: 7 },
    { question: 'What is the name of your favorite teacher?', category: 'education', displayOrder: 8 },
    { question: 'What was your first job?', category: 'work', displayOrder: 9 },
    { question: 'What is your favorite book?', category: 'misc', displayOrder: 10 }
  ];
};

module.exports = mongoose.model('SecurityQuestion', securityQuestionSchema);
