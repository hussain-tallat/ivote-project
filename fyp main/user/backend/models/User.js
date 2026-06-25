const mongoose = require('mongoose');

const webAuthnCredentialSchema = new mongoose.Schema({
  credentialId: {
    type: String,
    required: true
  },
  publicKey: {
    type: Buffer,
    required: true
  },
  counter: {
    type: Number,
    default: 0
  },
  // Authenticator transports reported by the browser during registration.
  // Example values: 'internal', 'hybrid', 'external', 'usb', 'nfc', 'ble', ...
  transports: {
    type: [String],
    default: []
  },
  // From WebAuthn registrationInfo. 'singleDevice' helps ensure same-device credentials.
  credentialDeviceType: {
    type: String,
    enum: ['singleDevice', 'multiDevice'],
    default: 'singleDevice'
  },
  // used to differentiate which step this credential belongs to
  type: {
    type: String,
    enum: ['face', 'fingerprint'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const simpleWebAuthnCredentialSchema = new mongoose.Schema({
  credentialId: {
    type: String
  },
  publicKey: {
    type: Buffer
  },
  counter: {
    type: Number,
    default: 0
  },
  transports: {
    type: [String],
    default: []
  },
  credentialDeviceType: {
    type: String,
    enum: ['singleDevice', 'multiDevice'],
    default: 'singleDevice'
  }
}, { _id: false });

const faceRecognitionSchema = new mongoose.Schema({
  isSetup: {
    type: Boolean,
    default: false
  },
  faceData: {
    type: String
  },
  faceSamples: {
    type: [String],
    default: []
  },
  faceHash: {
    type: String
  }
}, { _id: false });

const fingerprintSetupSchema = new mongoose.Schema({
  isSetup: {
    type: Boolean,
    default: false
  },
  credentialId: {
    type: String
  },
  webAuthnPublicKey: {
    type: Buffer
  },
  fingerprintKey: {
    type: String
  }
}, { _id: false });

const faceSetupSchema = new mongoose.Schema({
  isSetup: {
    type: Boolean,
    default: false
  },
  credentialId: {
    type: String
  },
  webAuthnPublicKey: {
    type: Buffer
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  cnic: {
    type: String,
    required: [true, 'Please add a CNIC'],
    unique: true,
    validate: {
      validator: function (v) {
        return /^\d{13}$/.test(v);
      },
      message: 'CNIC must be 13 digits'
    }
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
  },
  name: {
    type: String,
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
  halqaRequestedAt: {
    type: Date
  },
  role: {
    type: String,
    enum: ['voter', 'admin'],
    default: 'voter'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  registrationProgress: {
    otpVerified: {
      type: Boolean,
      default: false
    },
    biometricsCompleted: {
      type: Boolean,
      default: false
    },
    fingerprintCaptured: {
      type: Boolean,
      default: false
    },
    faceCaptured: {
      type: Boolean,
      default: false
    },
    securityQuestionsSet: {
      type: Boolean,
      default: false
    },
    isRegistrationComplete: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  webAuthnChallenge: {
    type: String
  },
  webAuthnChallengeType: {
    type: String,
    enum: ['biometric', 'fingerprint', 'face']
  },
  biometricCredentials: [{
    type: {
      type: String,
      enum: ['fingerprint', 'face'],
      required: true
    },
    credentialId: {
      type: String,
      required: true
    },
    publicKey: {
      type: Buffer,
      required: true
    },
    counter: {
      type: Number,
      default: 0
    },
    transports: {
      type: [String],
      default: []
    },
    credentialDeviceType: {
      type: String,
      enum: ['singleDevice', 'multiDevice'],
      default: 'singleDevice'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  fingerprintCredential: {
    type: simpleWebAuthnCredentialSchema,
    default: () => ({})
  },
  faceCredential: {
    type: simpleWebAuthnCredentialSchema,
    default: () => ({})
  },
  attempts: {
    type: Number,
    default: 0,
  },
  recoveryOtp: {
    type: String
  },
  recoveryOtpExpires: {
    type: Date
  },
  recoveryQuestionIndex: {
    type: Number
  },
  adminOtp: {
    type: String
  },
  adminOtpExpires: {
    type: Date
  },
  securityQuestions: [{
    question: String,
    answer: String
  }],
  biometricSetup: {
    isComplete: {
      type: Boolean,
      default: false
    },
    fingerprint: {
      type: fingerprintSetupSchema,
      default: () => ({})
    },
    face: {
      type: faceSetupSchema,
      default: () => ({})
    },
    faceRecognition: {
      type: faceRecognitionSchema,
      default: () => ({})
    }
  },
  webAuthnCredentials: {
    type: [webAuthnCredentialSchema],
    default: []
  },
  hasVoted: [{
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  loginAttempts: {
    count: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    lockUntil: Date
  },
  lastLogin: Date,
  activeMfaSessionStartedAt: Date,
  lastFingerprintVerifiedAt: Date,
  lastFaceVerifiedAt: Date,
  lastMfaVerifiedAt: Date,
  lastLoginMethod: {
    type: String,
    enum: ['mfa', 'recovery', 'otp', 'password', 'biometric']
  },
  ipAddresses: [{
    ip: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.index({ cnic: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ role: 1, halqaId: 1 });

module.exports = mongoose.model('User', userSchema);
