const User = require('../models/User');
const SecurityQuestion = require('../models/SecurityQuestion');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const { generateToken, generateRecoveryToken } = require('../utils/jwt');
const { hashData, encrypt, decrypt } = require('../utils/encryption');
const {
  createRegistrationOptions,
  verifyRegistration,
  createAuthenticationOptions,
  verifyAuthentication
} = require('../utils/webauthn');
const {
  validateFaceData,
  extractFaceFeatures,
  generateFaceHash,
  normalizeEmbedding,
  validateTemplateIntegrity,
  calculateTemplateQuality,
  mergeFaceSamples,
  verifyLiveness
} = require('../utils/faceRecognition');
const {
  hasAnyUsableBiometricLogin,
  hasCompletedTwoFactorBiometricMfa,
  isRegistrationComplete,
  syncRegistrationProgress
} = require('../utils/biometricState');
const { buildFraudUserSnapshot } = require('../utils/fraudLogHelpers');
const { manualLog } = require('../middleware/activityLogger');
const {
  detectDistrictFromCnic,
  isValidHalqaForDistrict,
  normalizeHalqaId
} = require('../utils/halqaData');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Temporarily lock credential verification after repeated failures (short duration).
const LOGIN_LOCK_MS = 10 * 1000; // 10 seconds

// Biometric session window used by protected endpoints after successful biometric auth.
const MFA_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const FACE_MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.96);
const FACE_MAX_EUCLIDEAN_DISTANCE = Number(process.env.FACE_MAX_EUCLIDEAN_DISTANCE || 0.45);
const FACE_AVERAGE_MATCH_THRESHOLD = Number(process.env.FACE_AVERAGE_MATCH_THRESHOLD || 0.955);
const FACE_AVERAGE_MAX_EUCLIDEAN_DISTANCE = Number(process.env.FACE_AVERAGE_MAX_EUCLIDEAN_DISTANCE || 0.42);
const MIN_FACE_LOGIN_SAMPLES = 4;
const REQUIRED_FACE_MATCH_RATIO = 1;
const ENFORCE_REGISTRATION_FRAUD_BLOCK = process.env.NODE_ENV === 'production';
const ALLOW_DEV_ACCOUNT_REACTIVATION = process.env.NODE_ENV !== 'production';
const FACE_DEBUG_ENABLED = process.env.NODE_ENV !== 'production';

const cosineSimilarity = (a, b) => {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (!Number.isFinite(denom) || denom === 0) return 0;
  return dot / denom;
};

const euclideanDistance = (a, b) => {
  const length = Math.min(a.length, b.length);
  if (!length) return Number.POSITIVE_INFINITY;

  let sum = 0;
  for (let i = 0; i < length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

const l2NormalizeEmbedding = (embedding) => {
  if (!Array.isArray(embedding) || embedding.length === 0) return [];

  const normSq = embedding.reduce((sum, value) => sum + (value * value), 0);
  const norm = Math.sqrt(normSq);
  if (!Number.isFinite(norm) || norm === 0) return [];

  return embedding.map((value) => value / norm);
};

const hasDuplicateCapturedSamples = (samples) => {
  for (let i = 0; i < samples.length; i += 1) {
    for (let j = i + 1; j < samples.length; j += 1) {
      if (euclideanDistance(samples[i], samples[j]) <= 1e-6) {
        return true;
      }
    }
  }
  return false;
};

const isRecentVerification = (timestamp, windowMs = MFA_WINDOW_MS) => {
  if (!timestamp) return false;
  const parsed = new Date(timestamp).getTime();
  if (!Number.isFinite(parsed)) return false;
  return (Date.now() - parsed) <= windowMs;
};

const updateMfaCompletionState = (user) => {
  if (!user) return false;

  const complete = hasCompletedTwoFactorBiometricMfa(user, MFA_WINDOW_MS);
  if (complete) {
    user.lastMfaVerifiedAt = Date.now();
    user.lastLoginMethod = 'mfa';
    user.activeMfaSessionStartedAt = undefined;
  } else {
    user.lastMfaVerifiedAt = undefined;
  }

  return complete;
};

const faceDebug = (event, payload = {}) => {
  if (!FACE_DEBUG_ENABLED) return;
  try {
    console.log(`[FaceDebug] ${event}`, payload);
  } catch (error) {
    console.log(`[FaceDebug] ${event}`);
  }
};

const getCredentialFieldByType = (type) => {
  if (type === 'fingerprint') return 'fingerprintCredential';
  if (type === 'face') return 'faceCredential';
  return null;
};

const normalizeIdentifierValue = (value) => String(value || '').trim();

const normalizeEmail = (value) => normalizeIdentifierValue(value).toLowerCase();

const normalizeCnic = (value) => normalizeIdentifierValue(value).replace(/\D/g, '');

const getNormalizedLoginCandidates = (identifier) => {
  const raw = normalizeIdentifierValue(identifier);
  const normalizedEmail = normalizeEmail(raw);
  const normalizedCnic = normalizeCnic(raw);

  const candidates = new Set([raw, normalizedEmail]);
  if (normalizedCnic) {
    candidates.add(normalizedCnic);
  }

  return Array.from(candidates).filter(Boolean);
};

const getMissingRegistrationSteps = (user) => {
  const missing = [];
  if (!user?.registrationProgress?.otpVerified) missing.push('otp');
  if (!user?.registrationProgress?.fingerprintCaptured) missing.push('fingerprint');
  if (!user?.registrationProgress?.faceCaptured) missing.push('face');
  if (!user?.registrationProgress?.securityQuestionsSet) missing.push('securityQuestions');
  return missing;
};

const normalizeCredentialId = (id) => {
  if (!id) return '';
  const raw = String(id).trim();

  // Legacy fallback: credential id accidentally saved as comma-separated bytes
  // (e.g. "12,34,255,..."). Convert bytes -> base64url.
  if (/^\d+(,\d+)+$/.test(raw)) {
    const byteValues = raw.split(',').map(n => Number(n.trim())).filter(n => Number.isInteger(n) && n >= 0 && n <= 255);
    if (byteValues.length > 0) {
      const b64 = Buffer.from(byteValues).toString('base64');
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }
  }

  // Legacy fallback: credential id saved as JSON byte array string.
  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) {
        const b64 = Buffer.from(arr).toString('base64');
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      }
    } catch (e) {
      // Ignore parse errors and continue with string normalization.
    }
  }

  return raw
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const toCredentialPublicKeyBuffer = (publicKey) => {
  if (!publicKey) return null;
  if (Buffer.isBuffer(publicKey)) return publicKey;
  if (publicKey.type === 'Buffer' && Array.isArray(publicKey.data)) {
    return Buffer.from(publicKey.data);
  }
  if (Array.isArray(publicKey)) {
    return Buffer.from(publicKey);
  }
  if (publicKey instanceof Uint8Array) {
    return Buffer.from(publicKey);
  }
  if (typeof publicKey === 'string') {
    const raw = publicKey.trim();
    if (!raw) return null;

    if (/^\d+(,\d+)+$/.test(raw)) {
      return Buffer.from(
        raw
          .split(',')
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isInteger(value) && value >= 0 && value <= 255)
      );
    }

    if (/^[A-Fa-f0-9]+$/.test(raw) && raw.length % 2 === 0) {
      return Buffer.from(raw, 'hex');
    }

    const normalizedBase64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalizedBase64.length % 4 === 0 ? '' : '='.repeat(4 - (normalizedBase64.length % 4));
    return Buffer.from(`${normalizedBase64}${padding}`, 'base64');
  }

  return Buffer.from(publicKey);
};

const looksLikeCosePublicKey = (publicKeyBuffer) => {
  if (!Buffer.isBuffer(publicKeyBuffer) || publicKeyBuffer.length < 16) {
    return false;
  }

  const firstByte = publicKeyBuffer[0];
  // COSE keys are CBOR maps and usually start with major type 5 (0xA0-0xBF).
  return firstByte >= 0xA0 && firstByte <= 0xBF;
};

const credentialQualityScore = (credential) => {
  const publicKey = toCredentialPublicKeyBuffer(credential?.publicKey);
  if (!publicKey || publicKey.length === 0) return 0;

  let score = publicKey.length;
  if (looksLikeCosePublicKey(publicKey)) {
    score += 1000;
  }

  return score;
};

const getStoredCredentialByType = (user, type) => {
  const field = getCredentialFieldByType(type);
  const directCredential = user?.[field];
  if (directCredential?.credentialId) {
    directCredential.credentialId = normalizeCredentialId(directCredential.credentialId);
    directCredential.publicKey = toCredentialPublicKeyBuffer(directCredential.publicKey);
    return directCredential;
  }

  const legacyCredential = (user?.webAuthnCredentials || []).find(c => c.type === type);
  if (legacyCredential?.credentialId) {
    legacyCredential.credentialId = normalizeCredentialId(legacyCredential.credentialId);
    legacyCredential.publicKey = toCredentialPublicKeyBuffer(legacyCredential.publicKey);
    return legacyCredential;
  }

  const deprecatedCredential = (user?.biometricCredentials || []).find(c => c.type === type);
  if (deprecatedCredential?.credentialId) {
    deprecatedCredential.credentialId = normalizeCredentialId(deprecatedCredential.credentialId);
    deprecatedCredential.publicKey = toCredentialPublicKeyBuffer(deprecatedCredential.publicKey);
    return deprecatedCredential;
  }

  return null;
};

const getStoredCredentialsByType = (user, type) => {
  if (type === 'biometric') {
    const fp = getStoredCredentialsByType(user, 'fingerprint');
    const face = getStoredCredentialsByType(user, 'face');
    const all = [...fp, ...face];
    console.log(`[Biometric] Found ${fp.length} fingerprint and ${face.length} face credentials (total: ${all.length})`);
    return all;
  }

  const credentials = [];
  const field = getCredentialFieldByType(type);
  const directCredential = field ? user?.[field] : null;
  const setupCredential = type === 'fingerprint'
    ? user?.biometricSetup?.fingerprint
    : (type === 'face' ? user?.biometricSetup?.face : null);
  
  console.log(`[Credential] Checking type=${type}, field=${field}, has direct=${!!directCredential?.credentialId}`);
  
  if (directCredential?.credentialId && directCredential?.publicKey) {
    const norm = typeof directCredential.toObject === 'function' ? directCredential.toObject() : directCredential;
    const publicKey = toCredentialPublicKeyBuffer(norm.publicKey);
    if (publicKey) {
    credentials.push({
      ...norm,
      credentialId: normalizeCredentialId(norm.credentialId),
      publicKey,
      type
    });
    }
    console.log(`[Credential] Added direct ${type} credential`);
  }

  if (setupCredential?.credentialId) {
    const setupPublicKey = toCredentialPublicKeyBuffer(setupCredential.webAuthnPublicKey || setupCredential.publicKey);
    if (setupPublicKey) {
      credentials.push({
        credentialId: normalizeCredentialId(setupCredential.credentialId),
        publicKey: setupPublicKey,
        counter: Number.isFinite(setupCredential.counter) ? setupCredential.counter : 0,
        transports: Array.isArray(setupCredential.transports) ? setupCredential.transports : ['internal'],
        credentialDeviceType: setupCredential.credentialDeviceType || 'singleDevice',
        type
      });
      console.log(`[Credential] Added setup fallback ${type} credential`);
    }
  }

  const webAuthCredsForType = (user?.webAuthnCredentials || []).filter(c => c.type === type);
  console.log(`[Credential] WebAuthn credentials for type '${type}': ${webAuthCredsForType.length}`);
  
  if (webAuthCredsForType.length > 0) {
    console.log(`[Credential] WebAuthn credential details:`, webAuthCredsForType.map((c, idx) => ({
      index: idx,
      type: c.type,
      hasCredentialId: !!c.credentialId,
      credentialIdLength: c.credentialId ? String(c.credentialId).length : 0,
      hasPublicKey: !!c.publicKey,
      publicKeyLength: c.publicKey ? String(c.publicKey).length : 0
    })));
  }

  const legacyCredentials = (user?.webAuthnCredentials || [])
    .filter(c => c.type === type)
    .map(c => {
      const normalized = typeof c.toObject === 'function' ? c.toObject() : c;
      const publicKey = toCredentialPublicKeyBuffer(normalized.publicKey);
      return {
        ...normalized,
        credentialId: normalizeCredentialId(c.credentialId),
        publicKey,
        type
      };
    });

  const deprecatedCredentials = (user?.biometricCredentials || [])
    .filter(c => c.type === type)
    .map(c => {
      const normalized = typeof c.toObject === 'function' ? c.toObject() : c;
      const publicKey = toCredentialPublicKeyBuffer(normalized.publicKey);
      return {
        ...normalized,
        credentialId: normalizeCredentialId(c.credentialId),
        publicKey,
        type
      };
    });

  for (const cred of [...legacyCredentials, ...deprecatedCredentials]) {
    if (
      !credentials.some(existing => existing.credentialId === cred.credentialId) ||
      (cred.publicKey && credentials.some(existing => existing.credentialId === cred.credentialId && !existing.publicKey))
    ) {
      const withoutIncomplete = credentials.filter(existing => !(existing.credentialId === cred.credentialId && !existing.publicKey));
      credentials.splice(0, credentials.length, ...withoutIncomplete);
      credentials.push(cred);
    }
  }

  return credentials.reduce((acc, cred) => {
    const existingIndex = acc.findIndex((item) => item.credentialId === cred.credentialId);
    if (existingIndex === -1) {
      acc.push(cred);
      return acc;
    }

    const existingScore = credentialQualityScore(acc[existingIndex]);
    const incomingScore = credentialQualityScore(cred);
    if (incomingScore > existingScore) {
      acc[existingIndex] = cred;
    }

    return acc;
  }, []);
};

const getCredentialCandidatesByType = (user, type) => {
  const field = getCredentialFieldByType(type);
  const setupCredential = type === 'fingerprint'
    ? user?.biometricSetup?.fingerprint
    : (type === 'face' ? user?.biometricSetup?.face : null);

  const rawCandidates = [
    field && user?.[field]
      ? {
        ...user[field],
        candidateSource: field
      }
      : null,
    setupCredential
      ? {
        credentialId: setupCredential.credentialId,
        publicKey: setupCredential.webAuthnPublicKey || setupCredential.publicKey,
        counter: setupCredential.counter,
        transports: setupCredential.transports,
        credentialDeviceType: setupCredential.credentialDeviceType,
        candidateSource: 'biometricSetup'
      }
      : null,
    ...(user?.webAuthnCredentials || [])
      .filter((entry) => entry?.type === type)
      .map((entry) => ({
        ...(typeof entry?.toObject === 'function' ? entry.toObject() : entry),
        candidateSource: 'webAuthnCredentials'
      })),
    ...(user?.biometricCredentials || [])
      .filter((entry) => entry?.type === type)
      .map((entry) => ({
        ...(typeof entry?.toObject === 'function' ? entry.toObject() : entry),
        candidateSource: 'biometricCredentials'
      }))
  ];

  return rawCandidates
    .map((candidate) => {
      if (!candidate?.credentialId) return null;
      const normalizedId = normalizeCredentialId(candidate.credentialId);
      const publicKey = toCredentialPublicKeyBuffer(candidate.publicKey);
      if (!normalizedId || !publicKey) return null;

      return {
        ...candidate,
        type,
        credentialId: normalizedId,
        publicKey,
        counter: Number.isFinite(candidate.counter) ? candidate.counter : 0,
        transports: Array.isArray(candidate.transports) ? candidate.transports : [],
        candidateSource: candidate.candidateSource || 'unknown'
      };
    })
    .filter(Boolean)
    .sort((a, b) => credentialQualityScore(b) - credentialQualityScore(a));
};

const saveCredentialForBiometricLogin = (user, credentialData, requestedTypes = ['fingerprint', 'face']) => {
  const sharedPayload = {
    credentialId: credentialData.credentialId,
    publicKey: credentialData.publicKey,
    counter: credentialData.counter,
    transports: credentialData.transports,
    credentialDeviceType: credentialData.credentialDeviceType
  };

  const typedCredentials = requestedTypes.map((type) => ({
    ...sharedPayload,
    type
  }));

  user.webAuthnCredentials = (user.webAuthnCredentials || []).filter(
    (entry) => !typedCredentials.some((typed) => typed.type === entry.type)
  );
  user.webAuthnCredentials.push(...typedCredentials);

  user.biometricCredentials = (user.biometricCredentials || []).filter(
    (entry) => !typedCredentials.some((typed) => typed.type === entry.type)
  );
  user.biometricCredentials.push(...typedCredentials);

  if (!user.biometricSetup) user.biometricSetup = {};
  if (!user.biometricSetup.fingerprint) user.biometricSetup.fingerprint = { isSetup: false };
  if (!user.biometricSetup.face) user.biometricSetup.face = { isSetup: false };
  if (!user.registrationProgress) user.registrationProgress = {};

  if (requestedTypes.includes('fingerprint')) {
    user.fingerprintCredential = { ...sharedPayload };
    user.biometricSetup.fingerprint.isSetup = true;
    user.biometricSetup.fingerprint.credentialId = sharedPayload.credentialId;
    user.biometricSetup.fingerprint.webAuthnPublicKey = sharedPayload.publicKey;
    user.registrationProgress.fingerprintCaptured = true;
  }

  if (requestedTypes.includes('face')) {
    user.faceCredential = { ...sharedPayload };
    user.biometricSetup.face.isSetup = true;
    user.biometricSetup.face.credentialId = sharedPayload.credentialId;
    user.biometricSetup.face.webAuthnPublicKey = sharedPayload.publicKey;
    user.registrationProgress.faceCaptured = true;
  }

  user.registrationProgress.biometricsCompleted = Boolean(
    user.registrationProgress.fingerprintCaptured && user.registrationProgress.faceCaptured
  );
};

const updateRegistrationCompletion = (user) => {
  syncRegistrationProgress(user);
};

// Re-check completion from DB fields (prevents stale/inconsistent progress flags)
const isRegistrationCompleteByDb = (user) => {
  return isRegistrationComplete(user);
};

const normalizeFaceEmbedding = (value) => {
  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isFinite);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(Number).filter(Number.isFinite);
      }
    } catch (error) {
      if (/^[01]+$/.test(value)) {
        return value.split('').map((bit) => Number(bit));
      }
    }
  }

  return [];
};

const isValidFaceEmbedding = (value) => normalizeFaceEmbedding(value).length === 128;

const normalizeIncomingFaceSamples = ({ faceData, faceFeatures, faceSamples }) => {
  faceDebug('normalizeIncoming:start', {
    hasFaceData: Boolean(faceData),
    hasFaceFeatures: Boolean(faceFeatures),
    faceSamplesCount: Array.isArray(faceSamples) ? faceSamples.length : 0
  });

  // Handle face samples array (from frontend captureFaceSamples)
  if (Array.isArray(faceSamples) && faceSamples.length) {
    const validSamples = [];
    for (const sample of faceSamples) {
      if (Array.isArray(sample)) {
        const normalized = normalizeEmbedding(sample);
        if (isValidFaceEmbedding(normalized)) validSamples.push(normalized);
      } else if (sample && typeof sample === 'object' && Array.isArray(sample.embedding)) {
        // Legacy shape: { embedding, frame }
        const normalized = normalizeEmbedding(sample.embedding);
        if (isValidFaceEmbedding(normalized)) validSamples.push(normalized);
      } else if (typeof sample === 'string') {
        // Try to parse JSON
        try {
          const parsed = JSON.parse(sample);
          if (Array.isArray(parsed)) {
            const normalized = normalizeEmbedding(parsed);
            if (isValidFaceEmbedding(normalized)) validSamples.push(normalized);
          } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.embedding)) {
            const normalized = normalizeEmbedding(parsed.embedding);
            if (isValidFaceEmbedding(normalized)) validSamples.push(normalized);
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }
    
    if (validSamples.length > 0) {
      console.log(`Processing ${validSamples.length} face samples`);
      faceDebug('normalizeIncoming:fromSamples', {
        validSamples: validSamples.length,
        dimensions: validSamples.map((sample) => sample.length)
      });
      return validSamples;
    }
  }

  // Handle single faceFeatures (can be array or JSON string)
  if (faceFeatures) {
    if (Array.isArray(faceFeatures)) {
      const normalized = normalizeEmbedding(faceFeatures);
      if (isValidFaceEmbedding(normalized)) {
        faceDebug('normalizeIncoming:fromFaceFeaturesArray', { dimension: normalized.length });
        return [normalized];
      }
    }
    if (typeof faceFeatures === 'string') {
      try {
        const parsed = JSON.parse(faceFeatures);
        if (Array.isArray(parsed)) {
          const normalized = normalizeEmbedding(parsed);
          if (isValidFaceEmbedding(normalized)) {
            faceDebug('normalizeIncoming:fromFaceFeaturesJsonArray', { dimension: normalized.length });
            return [normalized];
          }
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.embedding)) {
          const normalized = normalizeEmbedding(parsed.embedding);
          if (isValidFaceEmbedding(normalized)) {
            faceDebug('normalizeIncoming:fromFaceFeaturesJsonObject', { dimension: normalized.length });
            return [normalized];
          }
        }
      } catch (e) {
        // Not JSON, check if it's a simple number array string
        if (/^[\d.,-]+$/.test(faceFeatures)) {
          const nums = faceFeatures.split(/[,\s]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
          const normalized = normalizeEmbedding(nums);
          if (isValidFaceEmbedding(normalized)) {
            faceDebug('normalizeIncoming:fromFaceFeaturesNumericString', { dimension: normalized.length });
            return [normalized];
          }
        }
      }
    }
  }

  // Raw image uploads are intentionally rejected.
  if (faceData) {
    throw new Error('Raw face images are not accepted. Submit only face encodings (128-d vectors).');
  }

  throw new Error('No face data provided');
};

const getStoredFaceSamples = (user) => {
  const storedSamples = [];
  const encryptedSamples = user?.biometricSetup?.faceRecognition?.faceSamples;

  faceDebug('storedSamples:start', {
    userId: String(user?._id || ''),
    encryptedSamplesCount: Array.isArray(encryptedSamples) ? encryptedSamples.length : 0,
    hasLegacyFaceData: Boolean(user?.biometricSetup?.faceRecognition?.faceData)
  });

  if (Array.isArray(encryptedSamples)) {
    encryptedSamples.forEach((sample) => {
      try {
        // Handle both encrypted objects and plain strings
        let decrypted;
        if (typeof sample === 'string') {
          decrypted = decrypt(sample);
        } else if (sample.encrypted) {
          decrypted = decrypt(sample.encrypted);
        } else {
          // Plain feature array or string
          decrypted = sample;
        }
        
        // Parse if JSON string
        if (typeof decrypted === 'string' && !decrypted.startsWith('data:image/')) {
          try {
            decrypted = JSON.parse(decrypted);
          } catch (e) {
            // Not JSON, continue with string
          }
        }
        
        // Normalize the embedding
        const normalized = normalizeEmbedding(decrypted);
        if (normalized && normalized.length > 0) {
          // Validate template integrity
          const integrity = validateTemplateIntegrity(normalized);
          if (integrity.valid) {
            storedSamples.push(normalized);
          }
        } else if (typeof decrypted === 'string' && decrypted.startsWith('data:image/')) {
          storedSamples.push(extractFaceFeatures(decrypted));
        }
      } catch (error) {
        console.warn('Failed to decrypt stored face sample:', error.message);

        // Fallback: older data may already be plaintext JSON/string embedding.
        try {
          let fallback = sample;
          if (typeof fallback === 'string') {
            try {
              fallback = JSON.parse(fallback);
            } catch (e) {
              // Keep raw string; normalizeEmbedding can handle numeric strings.
            }
          }

          const normalized = normalizeEmbedding(
            fallback && typeof fallback === 'object' && Array.isArray(fallback.embedding)
              ? fallback.embedding
              : fallback
          );

          if (isValidFaceEmbedding(normalized)) {
            storedSamples.push(normalized);
          }
        } catch (fallbackError) {
          console.warn('Fallback parse failed for stored face sample:', fallbackError.message);
        }
      }
    });
  }

  const legacySample = user?.biometricSetup?.faceRecognition?.faceData;
  if (legacySample) {
    try {
      let decrypted;
      if (typeof legacySample === 'string') {
        decrypted = decrypt(legacySample);
      } else if (legacySample.encrypted) {
        decrypted = decrypt(legacySample.encrypted);
      } else {
        decrypted = legacySample;
      }
      
      // Parse if JSON string
      if (typeof decrypted === 'string' && !decrypted.startsWith('data:image/')) {
        try {
          decrypted = JSON.parse(decrypted);
        } catch (e) {
          // Not JSON, continue with string
        }
      }
      
      const normalized = normalizeEmbedding(decrypted);
      if (normalized && normalized.length > 0) {
        const integrity = validateTemplateIntegrity(normalized);
        if (integrity.valid) {
          storedSamples.push(normalized);
        }
      } else if (typeof decrypted === 'string' && decrypted.startsWith('data:image/')) {
        storedSamples.push(extractFaceFeatures(decrypted));
      }
    } catch (error) {
      console.warn('Failed to decrypt legacy face sample:', error.message);

      // Fallback for legacy plaintext payloads.
      try {
        let fallback = legacySample;
        if (typeof fallback === 'string') {
          try {
            fallback = JSON.parse(fallback);
          } catch (e) {
            // Keep raw string.
          }
        }

        const normalized = normalizeEmbedding(
          fallback && typeof fallback === 'object' && Array.isArray(fallback.embedding)
            ? fallback.embedding
            : fallback
        );

        if (isValidFaceEmbedding(normalized)) {
          storedSamples.push(normalized);
        }
      } catch (fallbackError) {
        console.warn('Fallback parse failed for legacy face sample:', fallbackError.message);
      }
    }
  }

  faceDebug('storedSamples:complete', {
    usableSamples: storedSamples.length,
    dimensions: storedSamples.map((sample) => sample.length)
  });

  return storedSamples;
};

// @desc    Register user & send OTP
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const cnic = normalizeCnic(req.body.cnic);
    const email = normalizeEmail(req.body.email);
    const phone = normalizeIdentifierValue(req.body.phone);
    const password = req.body.password;
    const name = normalizeIdentifierValue(req.body.name);
    const selectedHalqaId = normalizeHalqaId(req.body.halqaId || req.body.constituency);
    const detectedDistrict = detectDistrictFromCnic(cnic);

    if (!detectedDistrict) {
      return res.status(400).json({
        success: false,
        message: 'CNIC district could not be detected. Please enter a valid CNIC prefix supported by the halqa list.'
      });
    }

    // During initial registration we do NOT require the user to select a halqa.
    // Admin will later approve the account and assign the correct halqa.
    if (selectedHalqaId && !isValidHalqaForDistrict(detectedDistrict.code, selectedHalqaId)) {
      return res.status(400).json({
        success: false,
        message: `Selected halqa does not belong to ${detectedDistrict.name}. Please choose a halqa from your detected district.`
      });
    }

    // Suspicious pattern: same email attempted with a different CNIC.
    // In production, block and flag. In development, log and allow for local test cycles.
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail && existingByEmail.cnic !== cnic) {
      const FraudLog = require('../models/FraudLog');
      await FraudLog.create({
        userId: existingByEmail._id,
        ...buildFraudUserSnapshot(existingByEmail),
        fraudType: 'other',
        severity: 'high',
        riskScore: 90,
        description: `Suspicious registration attempt: same email "${email}" used with different CNICs (${existingByEmail.cnic} vs ${cnic}).${ENFORCE_REGISTRATION_FRAUD_BLOCK && existingByEmail.role !== 'admin' ? ' Existing account blocked.' : ' Flagged for review.'}`,
        status: 'detected',
        actionTaken: ENFORCE_REGISTRATION_FRAUD_BLOCK && existingByEmail.role !== 'admin' ? 'account_suspended' : 'flagged'
      });

      if (ENFORCE_REGISTRATION_FRAUD_BLOCK) {
        if (existingByEmail.role !== 'admin') {
          existingByEmail.isActive = false;
          await existingByEmail.save();
        }

        // Send alert to admin
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
          await sendEmail({
            email: admin.email,
            subject: 'Fraud Alert: Duplicate Email Registration Attempt',
            message: `
              <h2>Fraud Alert</h2>
              <p>A suspicious registration attempt was detected:</p>
              <ul>
                <li>Email: ${email}</li>
                <li>Existing CNIC: ${existingByEmail.cnic}</li>
                <li>Attempted CNIC: ${cnic}</li>
                <li>Action: ${existingByEmail.role !== 'admin' ? 'Account suspended' : 'Flagged for admin review'}</li>
              </ul>
              <p>Please review the fraud logs for more details.</p>
            `
          });
        }

        return res.status(403).json({
          success: false,
          message: 'Suspicious activity detected. Registration blocked for review.'
        });
      }

      console.warn(`[Register][DEV_BYPASS] Duplicate email with different CNIC allowed for local testing: ${email} (${existingByEmail.cnic} -> ${cnic})`);
    }

    const existingByCnic = await User.findOne({ cnic });
    if (existingByCnic && String(existingByCnic.email).toLowerCase() !== String(email).toLowerCase()) {
      const FraudLog = require('../models/FraudLog');
      await FraudLog.create({
        userId: existingByCnic._id,
        ...buildFraudUserSnapshot(existingByCnic),
        fraudType: 'other',
        severity: 'critical',
        riskScore: 100,
        description: `Duplicate CNIC Detected: ${cnic} used with a different email.`,
        status: 'detected',
        actionTaken: 'flagged'
      });

      const admin = await User.findOne({ role: 'admin', isActive: true });
      if (admin) {
        await sendEmail({
          email: admin.email,
          subject: 'Fraud Alert: Duplicate CNIC Detected',
          message: `<p><strong>Duplicate CNIC Detected:</strong> ${cnic} used with a different email.</p>`
        });
      }

      return res.status(409).json({
        success: false,
        message: `Duplicate CNIC Detected: ${cnic} used with a different email.`
      });
    }

    let user = await User.findOne({ $or: [{ email }, { cnic }] });
    if (user && isRegistrationCompleteByDb(user)) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this CNIC or email'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const saltOTP = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, saltOTP);

    const otpExpires = Date.now() + 5 * 60 * 1000;

    if (user) {
      if (!user.isActive && ALLOW_DEV_ACCOUNT_REACTIVATION) {
        user.isActive = true;
      }

      user.cnic = cnic;
      user.name = name;
      user.phone = phone;
      user.districtCode = detectedDistrict.code;
      user.district = detectedDistrict.name;
      // Do not require halqa at registration; keep empty until admin approval.
      user.halqaId = selectedHalqaId || undefined;
      user.status = 'pending';
      user.email = email;
      user.password = hashedPassword;
      user.otp = hashedOTP;
      user.otpExpires = otpExpires;
      user.attempts = 0;
      user.isVerified = false;
      user.registrationProgress = {
        otpVerified: false,
        fingerprintCaptured: false,
        faceCaptured: false,
        securityQuestionsSet: false,
        isRegistrationComplete: false,
        completedAt: undefined
      };
      user.securityQuestions = [];
      user.biometricSetup.face = {
        isSetup: false,
        webAuthnPublicKey: undefined
      };
      user.biometricSetup.faceRecognition = {
        isSetup: false,
        faceData: undefined,
        faceHash: undefined
      };
      user.biometricSetup.fingerprint = {
        isSetup: false,
        webAuthnPublicKey: undefined
      };
      user.biometricCredentials = [];
      user.webAuthnCredentials = [];
      await user.save();
    } else {
      user = await User.create({
        cnic,
        email,
        phone,
        name,
        districtCode: detectedDistrict.code,
        district: detectedDistrict.name,
        // halqa is assigned by admin during approval
        halqaId: selectedHalqaId || undefined,
        status: 'pending',
        password: hashedPassword,
        otp: hashedOTP,
        otpExpires,
        biometricSetup: {
          face: {
            isSetup: false,
            webAuthnPublicKey: undefined
          },
          faceRecognition: {
            isSetup: false,
            faceData: undefined,
            faceHash: undefined
          },
          fingerprint: {
            isSetup: false,
            webAuthnPublicKey: undefined
          }
        },
        biometricCredentials: [],
        webAuthnCredentials: [],
        registrationProgress: {
          otpVerified: false,
          fingerprintCaptured: false,
          faceCaptured: false,
          securityQuestionsSet: false,
          isRegistrationComplete: false
        }
      });
    }

    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #00563B;">iVotePK - Email Verification</h1>
          <p>Dear ${name || 'Voter'},</p>
          <p>Thank you for registering with iVotePK. Your One-Time Password (OTP) for email verification is:</p>
          <div style="background-color: #00563B; color: white; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p><strong>This OTP will expire in 5 minutes.</strong></p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from iVotePK - Secure Digital Elections for Pakistan</p>
        </div>
      </div>
    `;

    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'iVotePK - Email Verification OTP',
        message,
      });

      if (!emailResult.success) {
        console.error('Email delivery error:', emailResult.error || emailResult.message);

        await manualLog(user._id, 'registration', `Registration successful but email could not be delivered: ${email}`, req, {
          email,
          status: 'success',
          emailFailed: true,
          emailMethod: emailResult.method
        });

        return res.status(500).json({
          success: false,
          message: 'Registration successful but OTP email could not be sent. Please check backend email configuration and try again.',
          emailMethod: emailResult.method
        });
      }

      await manualLog(user._id, 'registration', `New user registered: ${email}`, req, {
        email,
        cnic,
        district: detectedDistrict.name,
        halqaId: selectedHalqaId,
        status: 'success',
        emailMethod: emailResult.method
      });

      res.status(200).json({
        success: true,
        message: 'Registration successful. OTP sent to your email',
        email: user.email,
        userId: user._id,
        district: user.district,
        districtCode: user.districtCode,
        halqaId: user.halqaId
      });
    } catch (err) {
      console.error('Email send error:', err);

      await manualLog(user._id, 'registration', `Registration successful but email failed: ${email}`, req, {
        email,
        status: 'success',
        emailFailed: true
      });

      res.status(500).json({
        success: false,
        message: 'Registration successful but email could not be sent. Please contact support.'
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // Local testing convenience: auto-reactivate previously suspended test users.
    if (!user.isActive && ALLOW_DEV_ACCOUNT_REACTIVATION) {
      user.isActive = true;
    }

    if (user.isVerified) {
      const token = generateToken(user._id, user.role);
      return res.status(200).json({
        success: true,
        message: user.registrationProgress?.isRegistrationComplete
          ? 'User already verified and registration completed.'
          : 'User already verified. Please complete remaining registration steps.',
        token,
        registrationProgress: user.registrationProgress
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (user.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) {
      user.attempts += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - user.attempts} attempts remaining.`
      });
    }

    user.isVerified = true;
    user.registrationProgress.otpVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.attempts = 0;
    updateRegistrationCompletion(user);
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Email verified. Please complete fingerprint, face, and security questions to finish registration.',
      token,
      registrationProgress: user.registrationProgress,
      user: {
        id: user._id,
        email: user.email,
        cnic: user.cnic,
        name: user.name,
        role: user.role,
        districtCode: user.districtCode,
        district: user.district,
        halqaId: user.halqaId
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User already verified' });
    }

    const otp = generateOTP();
    const saltOTP = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, saltOTP);

    user.otp = hashedOTP;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.attempts = 0;
    await user.save();

    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #00563B;">iVotePK - Resend OTP</h1>
          <p>Your new OTP for email verification is:</p>
          <div style="background-color: #00563B; color: white; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p><strong>This OTP will expire in 5 minutes.</strong></p>
        </div>
      </div>
    `;

    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'iVotePK - Resend OTP Verification',
        message,
      });

      if (!emailResult.success) {
        console.error('Email delivery error:', emailResult.error || emailResult.message);
        return res.status(500).json({ success: false, message: 'Email could not be sent. Please check backend email configuration.' });
      }

      res.status(200).json({ success: true, message: 'New OTP sent to your email' });
    } catch (err) {
      console.error('Email send error:', err);
      res.status(500).json({ success: false, message: 'Email could not be sent' });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Set security questions
// @route   POST /api/auth/security-questions
// @access  Private
exports.setSecurityQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || questions.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide exactly 3 security questions and answers'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    syncRegistrationProgress(user);

    if (!user.registrationProgress?.otpVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify OTP before setting security questions'
      });
    }

    if (!user.registrationProgress?.fingerprintCaptured || !user.registrationProgress?.faceCaptured) {
      return res.status(400).json({
        success: false,
        message: 'Fingerprint and face registration must both be completed before security questions can be saved.'
      });
    }

    const securityQuestions = await Promise.all(
      questions.map(async (q) => {
        const salt = await bcrypt.genSalt(10);
        const hashedAnswer = await bcrypt.hash(q.answer.toLowerCase().trim(), salt);
        return {
          question: q.question,
          answer: hashedAnswer
        };
      })
    );

    user.securityQuestions = securityQuestions;
    user.registrationProgress.securityQuestionsSet = true;
    updateRegistrationCompletion(user);
    await user.save();

    res.status(200).json({
      success: true,
      message: user.registrationProgress.isRegistrationComplete
        ? 'Security questions saved. Registration completed successfully.'
        : 'Security questions saved. Please complete biometric setup to finish registration.',
      registrationProgress: user.registrationProgress
    });

  } catch (error) {
    console.error('Security questions error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get available security questions
// @route   GET /api/auth/security-questions/list
// @access  Public
exports.getSecurityQuestions = async (req, res) => {
  try {
    let questions = await SecurityQuestion.find({ isActive: true }).sort({ displayOrder: 1 });

    if (questions.length === 0) {
      const defaultQuestions = SecurityQuestion.schema.statics.getDefaultQuestions();
      questions = await SecurityQuestion.insertMany(defaultQuestions);
    }

    res.status(200).json({
      success: true,
      questions: questions.map(q => ({ id: q._id, question: q.question, category: q.category }))
    });

  } catch (error) {
    console.error('Get security questions error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Generate WebAuthn registration options
// @route   POST /api/auth/biometric/register-options
// @access  Private
exports.generateBiometricRegistration = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { type } = req.body;
    if (!['face', 'fingerprint'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be face or fingerprint' });
    }

    if (!user.registrationProgress?.otpVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify OTP before biometric registration'
      });
    }

    const options = await createRegistrationOptions({ user });
    user.webAuthnChallenge = options.challenge;
    user.webAuthnChallengeType = type;
    await user.save();

    res.status(200).json({ success: true, options });

  } catch (error) {
    console.error('Biometric registration options error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Verify and save WebAuthn credential
// @route   POST /api/auth/biometric/register-verify
// @access  Private
exports.verifyBiometricRegistration = async (req, res) => {
  try {
    const { credential } = req.body;
    const { type } = req.body;

    if (!['face', 'fingerprint'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type must be face or fingerprint'
      });
    }

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Please provide WebAuthn credential'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    syncRegistrationProgress(user);

    if (!user.registrationProgress?.otpVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify OTP before biometric registration'
      });
    }

    if (
      !user.webAuthnChallenge ||
      (user.webAuthnChallengeType !== type && user.webAuthnChallengeType !== 'biometric')
    ) {
      return res.status(400).json({
        success: false,
        message: 'No matching WebAuthn registration challenge found. Please restart this biometric step.'
      });
    }

    const verification = await verifyRegistration({
      credential,
      expectedChallenge: user.webAuthnChallenge
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Biometric verification failed'
      });
    }
    // Explicitly reject when authenticator reports user verification not satisfied.
    if (
      verification?.registrationInfo?.userVerified === false ||
      verification?.registrationInfo?.credential?.userVerified === false
    ) {
      return res.status(400).json({
        success: false,
        message: 'Biometric user verification is required.'
      });
    }

    const registrationInfo = verification.registrationInfo;
    const registrationCredential = registrationInfo.credential;
    // Prefer browser-returned credential.id (base64url) for reliable auth options.
    const credentialId = normalizeCredentialId(credential?.id || registrationCredential.id);
    const publicKey = registrationCredential.publicKey;
    const counter = registrationCredential.counter;
    const transports = Array.isArray(registrationCredential.transports)
      ? registrationCredential.transports
      : [];
    const credentialDeviceType = registrationInfo?.credentialDeviceType || 'singleDevice';

    // Strict platform-only policy for this project:
    // accept only credentials created by internal authenticators.
    if (!transports.includes('internal')) {
      return res.status(400).json({
        success: false,
        message: 'Only internal device biometrics are allowed. Please use this device fingerprint/face sensor.'
      });
    }
    // Allow both singleDevice and multiDevice for now (multiDevice = Google Password Manager, iCloud Keychain)
    console.log(`[BioReg] Credential device type: ${credentialDeviceType} (accepted - both single and multi-device allowed)`);
    if (credentialDeviceType !== 'singleDevice' && credentialDeviceType !== 'multiDevice') {
      return res.status(400).json({
        success: false,
        message: 'Unknown credential device type. Please try again on this device.'
      });
    }

    // Mongoose needs real Buffer for SimpleWebAuthn public key bytes.
    const publicKeyBuf = Buffer.isBuffer(publicKey) ? publicKey : Buffer.from(publicKey);
    const counterNum = Number(counter);

    if (!Array.isArray(user.webAuthnCredentials)) {
      user.webAuthnCredentials = [];
    }
    if (!Array.isArray(user.biometricCredentials)) {
      user.biometricCredentials = [];
    }

    const typesToStore = type === 'biometric' ? ['fingerprint', 'face'] : [type];

    saveCredentialForBiometricLogin(user, {
      credentialId,
      publicKey: publicKeyBuf,
      counter: counterNum,
      transports,
      credentialDeviceType
    }, typesToStore);

    user.webAuthnChallenge = undefined;
    user.webAuthnChallengeType = undefined;
    updateRegistrationCompletion(user);

    await user.save();

    res.status(200).json({
      success: true,
      message: `${type === 'fingerprint' ? 'Fingerprint' : 'Face biometric'} registered successfully.`,
      registrationProgress: user.registrationProgress,
      registeredType: type,
      registeredTypes: typesToStore
    });

  } catch (error) {
    console.error('Biometric verification error:', error);
    return res.status(400).json({
      success: false,
      message: error?.message || 'Biometric registration failed (server error)'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { identifier, cnic, email, password } = req.body;
    const loginIdentifier = identifier || cnic || email;
    const normalizedCandidates = getNormalizedLoginCandidates(loginIdentifier);

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide CNIC/Email and password'
      });
    }

    const user = await User.findOne({
      $or: [
        { email: { $in: normalizedCandidates } },
        { cnic: { $in: normalizedCandidates } }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    syncRegistrationProgress(user);

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked/deactivated. Please contact support.'
      });
    }

    if (user.loginAttempts.count >= 5 && user.loginAttempts.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed attempts. Try again in 10 seconds.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts.count += 1;
      user.loginAttempts.lastAttempt = Date.now();
      if (user.loginAttempts.count >= 5) {
        user.loginAttempts.lockUntil = Date.now() + LOGIN_LOCK_MS;
      }
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsRemaining: Math.max(0, 5 - user.loginAttempts.count)
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified. Please verify your email.'
      });
    }

    if (!isRegistrationCompleteByDb(user)) {
      const token = generateToken(user._id, user.role);
      await user.save();
      return res.status(200).json({
        success: true,
        requiresRegistrationCompletion: true,
        message: 'Registration is incomplete. Please finish the remaining setup steps.',
        token,
        registrationProgress: user.registrationProgress,
        missingRegistrationSteps: getMissingRegistrationSteps(user),
        user: {
          id: user._id,
          email: user.email,
          cnic: user.cnic,
          name: user.name,
          role: user.role,
          districtCode: user.districtCode,
          district: user.district,
          halqaId: user.halqaId
        }
      });
    }

    user.loginAttempts.count = 0;
    user.loginAttempts.lockUntil = undefined;
    user.lastLogin = Date.now();

    const hasSavedBiometrics = hasAnyUsableBiometricLogin(user);

    if (hasSavedBiometrics) {
      // Require explicit biometric verification in this login flow.
      user.lastFingerprintVerifiedAt = undefined;
      user.lastFaceVerifiedAt = undefined;
      user.lastMfaVerifiedAt = undefined;
      user.lastLoginMethod = undefined;
      user.activeMfaSessionStartedAt = Date.now();
    } else {
      // For users without biometric setup, allow immediate access on password login.
      user.lastMfaVerifiedAt = Date.now();
      user.lastLoginMethod = 'password';
      user.activeMfaSessionStartedAt = undefined;
    }

    if (req.ip) {
      user.ipAddresses.push({ ip: req.ip, timestamp: Date.now() });
      if (user.ipAddresses.length > 10) {
        user.ipAddresses = user.ipAddresses.slice(-10);
      }

      const uniqueRecentIps = [...new Set((user.ipAddresses || []).map(entry => entry.ip).filter(Boolean))];
      if (uniqueRecentIps.length >= 3) {
        const FraudLog = require('../models/FraudLog');
        await FraudLog.create({
          userId: user._id,
          ...buildFraudUserSnapshot(user),
          fraudType: 'duplicate_device',
          severity: 'medium',
          riskScore: 65,
          description: `Multiple device access detected for ${user.email}`,
          evidence: {
            ipAddress: req.ip,
            timestamp: new Date(),
            additionalData: { uniqueRecentIps }
          },
          ipAddress: req.ip,
          status: 'detected',
          actionTaken: 'flagged'
        });
      }
    }

    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: hasSavedBiometrics
        ? 'Login successful. Please complete biometric verification.'
        : 'Login successful. If this device does not have a usable biometric passkey yet, you can register it again from account security settings.',
      token,
      requiresBiometric: Boolean(hasSavedBiometrics),
      registrationProgress: user.registrationProgress,
      biometricSetup: user.biometricSetup,
      user: {
        id: user._id,
        email: user.email,
        cnic: user.cnic,
        name: user.name,
        role: user.role,
        districtCode: user.districtCode,
        district: user.district,
        halqaId: user.halqaId
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get admin registration status
// @route   GET /api/auth/admin/status
// @access  Public
exports.getAdminRegistrationStatus = async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' }).select('_id name email isActive');
    res.status(200).json({
      success: true,
      adminExists: Boolean(existingAdmin),
      admin: existingAdmin
        ? {
          id: existingAdmin._id,
          name: existingAdmin.name,
          email: existingAdmin.email,
          isActive: existingAdmin.isActive
        }
        : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Register the single admin account (first-time only)
// @route   POST /api/auth/admin/register
// @access  Public
exports.registerSingleAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin account already exists. Additional admin registration is not allowed.'
      });
    }

    // Generate OTP for email verification
    const otp = generateOTP();
    const saltOTP = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, saltOTP);
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const adminCnic = `9${String(Date.now()).slice(-12)}`.slice(0, 13);

    const admin = await User.create({
      cnic: adminCnic,
      email: String(email).toLowerCase().trim(),
      phone: '+920000000000',
      password: hashedPassword,
      name: String(name).trim(),
      role: 'admin',
      isVerified: false, // Will be verified after OTP
      isActive: false, // Will be activated after OTP verification
      otp: hashedOTP,
      otpExpires,
      attempts: 0,
      registrationProgress: {
        otpVerified: false,
        fingerprintCaptured: false,
        faceCaptured: false,
        securityQuestionsSet: false,
        isRegistrationComplete: false
      }
    });

    // Send OTP email
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #00563B;">iVotePK - Admin Registration OTP</h1>
          <p>Welcome to iVotePK! Your OTP for admin account verification is:</p>
          <div style="background-color: #00563B; color: white; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p><strong>This OTP will expire in 5 minutes.</strong></p>
          <p>Please verify your email to complete the admin registration process.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: admin.email,
        subject: 'iVotePK - Admin Registration OTP',
        message,
      });

      return res.status(200).json({
        success: true,
        message: 'Admin registration initiated. Please check your email for OTP verification.'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Delete the created admin if email fails
      await User.findByIdAndDelete(admin._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Admin registration error:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Verify admin registration OTP
// @route   POST /api/auth/admin/verify-otp
// @access  Public
exports.verifyAdminRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const admin = await User.findOne({ role: 'admin', email: String(email).toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin account not found' });
    }

    if (admin.isActive) {
      return res.status(400).json({ success: false, message: 'Admin account already verified and active' });
    }

    if (!admin.otp || !admin.otpExpires || Date.now() > admin.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (admin.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    const isMatch = await bcrypt.compare(otp, admin.otp);
    if (!isMatch) {
      admin.attempts += 1;
      await admin.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - admin.attempts} attempts remaining.`
      });
    }

    // Verify and activate admin account
    admin.isVerified = true;
    admin.isActive = true;
    admin.registrationProgress.otpVerified = true;
    admin.registrationProgress.isRegistrationComplete = true;
    admin.registrationProgress.completedAt = new Date();
    admin.otp = undefined;
    admin.otpExpires = undefined;
    admin.attempts = 0;
    admin.lastMfaVerifiedAt = new Date();
    admin.lastLoginMethod = 'otp';
    await admin.save();

    const token = generateToken(admin._id, admin.role);
    return res.status(200).json({
      success: true,
      message: 'Admin account verified successfully. You can now login.',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin OTP verification error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Resend admin registration OTP
// @route   POST /api/auth/admin/resend-otp
// @access  Public
exports.resendAdminRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const admin = await User.findOne({ role: 'admin', email: String(email).toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin account not found' });
    }

    if (admin.isActive) {
      return res.status(400).json({ success: false, message: 'Admin account already verified and active' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const saltOTP = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, saltOTP);
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    admin.otp = hashedOTP;
    admin.otpExpires = otpExpires;
    admin.attempts = 0;
    await admin.save();

    // Send OTP email
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #00563B;">iVotePK - Admin Registration OTP</h1>
          <p>Your new OTP for admin account verification is:</p>
          <div style="background-color: #00563B; color: white; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p><strong>This OTP will expire in 5 minutes.</strong></p>
          <p>Please verify your email to complete the admin registration process.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: admin.email,
        subject: 'iVotePK - Resend Admin Registration OTP',
        message,
      });

      return res.status(200).json({
        success: true,
        message: 'OTP resent successfully. Please check your email.'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Resend admin OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Admin login (separate from voter login)
// @route   POST /api/auth/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await User.findOne({ role: 'admin', email: String(email).toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Recover from accidental admin deactivation caused by prior bad data/rules.
    if (!admin.isActive) {
      admin.isActive = true;
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    admin.adminOtp = await bcrypt.hash(otp, salt);
    admin.adminOtpExpires = Date.now() + 10 * 60 * 1000;
    await admin.save();

    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #00563B;">iVotePK - Admin Login OTP</h1>
          <p>Your OTP for admin login is:</p>
          <div style="background-color: #00563B; color: white; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p><strong>This OTP expires in 10 minutes.</strong></p>
        </div>
      </div>
    `;
    await sendEmail({
      email: admin.email,
      subject: 'iVotePK Admin Login OTP',
      message
    });

    return res.status(200).json({
      success: true,
      otpRequired: true,
      message: 'OTP sent to admin email. Verify OTP to continue.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Verify admin OTP and complete login
// @route   POST /api/auth/admin/verify-otp
// @access  Public
exports.verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const admin = await User.findOne({ role: 'admin', email: String(email).toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin account' });
    }
    if (!admin.adminOtp || !admin.adminOtpExpires || Date.now() > new Date(admin.adminOtpExpires).getTime()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const ok = await bcrypt.compare(String(otp).trim(), admin.adminOtp);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    admin.adminOtp = undefined;
    admin.adminOtpExpires = undefined;
    admin.lastMfaVerifiedAt = Date.now();
    admin.lastLoginMethod = 'mfa';
    await admin.save();

    const token = generateToken(admin._id, admin.role);
    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Generate biometric authentication options for login
// @route   POST /api/auth/biometric/auth-options
// @access  Private
exports.generateBiometricAuthentication = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const requestedType = req.body.type;
    if (!['face', 'fingerprint'].includes(requestedType)) {
      return res.status(400).json({ success: false, message: 'type must be face or fingerprint' });
    }

    const storedCredentials = getStoredCredentialsByType(user, requestedType);
    if (!storedCredentials.length) {
      const biometricLabel = requestedType === 'face' ? 'face' : 'fingerprint';
      return res.status(400).json({
        success: false,
        message: `No ${biometricLabel} credential found for this account. Please re-register ${biometricLabel} from biometric setup.`
      });
    }
    const allowCredentials = storedCredentials.map((cred) => ({
      id: normalizeCredentialId(cred.credentialId),
      type: 'public-key',
      transports: Array.isArray(cred.transports) && cred.transports.length
        ? cred.transports
        : undefined
    }));

    const options = await createAuthenticationOptions({ allowCredentials });
    user.webAuthnChallenge = options.challenge;
    user.webAuthnChallengeType = requestedType;
    await user.save();

    res.status(200).json({ success: true, options, requestedType });

  } catch (error) {
    console.error('Biometric auth options error:', error);
    return res.status(400).json({
      success: false,
      message: error?.message || 'Failed to generate biometric authentication options'
    });
  }
};

// @desc    Verify biometric authentication for login
// @route   POST /api/auth/biometric/auth-verify
// @access  Private
exports.verifyBiometricAuthentication = async (req, res) => {
  try {
    const { credential } = req.body;
    const requestedType = req.body.type;
    const requestedMode = ['face', 'fingerprint'].includes(requestedType)
      ? requestedType
      : null;

    if (!requestedMode) {
      return res.status(400).json({
        success: false,
        message: 'type must be face or fingerprint'
      });
    }

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Please provide credential'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (
      !user.webAuthnChallenge ||
      user.webAuthnChallengeType !== requestedMode
    ) {
      return res.status(400).json({
        success: false,
        message: 'No matching WebAuthn authentication challenge found. Please restart this biometric step.'
      });
    }

    const storedCredentials = getStoredCredentialsByType(user, requestedMode);
    console.log(`\n[Auth Verify] User: ${user.email}`);
    console.log(`[Auth Verify] Requested type: ${requestedMode}`);
    console.log(`[Auth Verify] Stored credentials found: ${storedCredentials.length}`);
    console.log(`[Auth Verify] webAuthnCredentials in DB: ${user.webAuthnCredentials?.length || 0}`);
    console.log(`[Auth Verify] webAuthnCredentials types: ${(user.webAuthnCredentials || []).map(c => c.type).join(', ')}`);
    console.log(`[Auth Verify] fingerprintCredential exists: ${!!user.fingerprintCredential?.credentialId}`);
    console.log(`[Auth Verify] faceCredential exists: ${!!user.faceCredential?.credentialId}`);
    
    if (!storedCredentials.length) {
      console.log(`[Auth Verify] ❌ NO CREDENTIALS FOUND - Cannot proceed with verification`);
      return res.status(400).json({
        success: false,
        message: 'No biometric data available. Please complete biometric registration or use password login.'
      });
    }
    console.log(`[Auth Verify] ✅ Found ${storedCredentials.length} stored credential(s) to check`);

    const incomingCredentialId = normalizeCredentialId(credential.id);
    const storedIds = storedCredentials.map(c => normalizeCredentialId(c.credentialId));
    
    console.log(`[Auth Verify] Incoming credential.id (raw): ${credential.id}`);
    console.log(`[Auth Verify] Incoming credential.id (normalized): ${incomingCredentialId}`);
    console.log(`[Auth Verify] Stored credential IDs: ${JSON.stringify(storedIds)}`);
    
    const matchingStoredCredential = storedCredentials.find(
      (c) => normalizeCredentialId(c.credentialId) === incomingCredentialId
    );

    if (!matchingStoredCredential) {
      console.log(`[Auth Verify] ❌ NO MATCH FOUND`);
      console.log(`[Auth Verify] Searching: "${incomingCredentialId}" in [${storedIds.join(', ')}]`);
      return res.status(400).json({
        success: false,
        message: 'Credential not recognized. Different device? Re-register biometrics or use password login.'
      });
    }
    console.log(`[Auth Verify] ✅ MATCH FOUND`);

    const fallbackCandidates = getCredentialCandidatesByType(user, requestedMode)
      .filter((candidate) => candidate.credentialId === incomingCredentialId);

    const verificationCandidates = [matchingStoredCredential, ...fallbackCandidates]
      .map((candidate) => ({
        ...candidate,
        credentialId: normalizeCredentialId(candidate.credentialId),
        publicKey: toCredentialPublicKeyBuffer(candidate.publicKey)
      }))
      .filter((candidate, index, arr) => {
        if (!candidate.publicKey) return false;
        if (!looksLikeCosePublicKey(candidate.publicKey)) return false;
        return arr.findIndex((item) => (
          item.credentialId === candidate.credentialId &&
          Buffer.compare(item.publicKey, candidate.publicKey) === 0
        )) === index;
      });

    console.log(
      `[Auth Verify] Candidate sources for ${requestedMode}: ` +
      verificationCandidates
        .map((candidate) => `${candidate.candidateSource || 'unknown'}:${candidate.publicKey?.length || 0}b`)
        .join(', ')
    );

    if (!verificationCandidates.length) {
      const label = requestedMode === 'fingerprint' ? 'fingerprint' : 'face';
      return res.status(400).json({
        success: false,
        message: `Stored ${label} credential is invalid or outdated. Please re-register ${label} on this device.`
      });
    }

    let verification = null;
    let verifiedCredential = null;
    let sawNoDataError = false;
    let lastVerifyError = null;

    for (const candidate of verificationCandidates) {
      try {
        const candidateVerification = await verifyAuthentication({
          credential,
          expectedChallenge: user.webAuthnChallenge,
          storedCredential: {
            ...candidate,
            publicKey: candidate.publicKey
          }
        });

        if (candidateVerification?.verified) {
          verification = candidateVerification;
          verifiedCredential = candidate;
          console.log(`[Auth Verify] ✅ Verified using candidate source: ${candidate.candidateSource || 'unknown'}`);
          break;
        }
      } catch (verifyError) {
        const verifyMessage = String(verifyError?.message || '').trim();
        console.log(
          `[Auth Verify] Candidate source ${candidate.candidateSource || 'unknown'} failed: ${verifyMessage || 'unknown error'}`
        );
        if (/^no\s*data$/i.test(verifyMessage)) {
          sawNoDataError = true;
        }
        lastVerifyError = verifyError;
      }
    }

    if (!verification && sawNoDataError) {
      const label = requestedMode === 'fingerprint' ? 'fingerprint' : 'face';
      return res.status(400).json({
        success: false,
        message: `Stored ${label} credential is corrupted for this account. Please re-register ${label} and try again.`
      });
    }

    if (!verification && lastVerifyError) {
      throw lastVerifyError;
    }

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Biometric authentication failed'
      });
    }
    if (verification?.authenticationInfo?.userVerified === false) {
      return res.status(400).json({
        success: false,
        message: 'Biometric user verification is required.'
      });
    }

    const newCounter = verification.authenticationInfo?.newCounter;
    if (typeof newCounter === 'number') {
      const verifiedCredentialId = normalizeCredentialId(verifiedCredential?.credentialId || incomingCredentialId);
      user.webAuthnCredentials = (user.webAuthnCredentials || []).map((entry) => (
        normalizeCredentialId(entry.credentialId) === verifiedCredentialId
          ? { ...entry.toObject?.(), ...entry, counter: newCounter }
          : entry
      ));
      user.biometricCredentials = (user.biometricCredentials || []).map((entry) => (
        normalizeCredentialId(entry.credentialId) === verifiedCredentialId
          ? { ...entry.toObject?.(), ...entry, counter: newCounter }
          : entry
      ));
      if (requestedMode === 'fingerprint') {
        user.fingerprintCredential = {
          ...user.fingerprintCredential,
          counter: newCounter
        };
      }
      if (requestedMode === 'face') {
        user.faceCredential = {
          ...user.faceCredential,
          counter: newCounter
        };
      }
    }

    if (requestedMode === 'fingerprint') {
      user.lastFingerprintVerifiedAt = Date.now();
    }
    if (requestedMode === 'face') {
      user.lastFaceVerifiedAt = Date.now();
    }

    const mfaVerified = updateMfaCompletionState(user);
    const requiresFace = !isRecentVerification(user.lastFaceVerifiedAt);
    const requiresFingerprint = !isRecentVerification(user.lastFingerprintVerifiedAt);

    user.webAuthnChallenge = undefined;
    user.webAuthnChallengeType = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Biometric authentication successful.',
      verifiedType: requestedMode,
      usedLegacyFallback: false,
      mfaVerified,
      requiresFace,
      requiresFingerprint,
      nextStep: mfaVerified
        ? null
        : (requiresFingerprint ? 'fingerprint' : 'face')
    });

  } catch (error) {
    console.error('Biometric auth verification error:', error);

    const rawMessage = String(error?.message || '').trim();
    let friendlyMessage = rawMessage || 'Biometric authentication failed (server error)';

    // Some WebAuthn stacks throw vague errors like "No data".
    // Normalize them so the UI can show a meaningful action.
    if (/^no\s*data$/i.test(rawMessage)) {
      friendlyMessage = 'No biometric data found for this credential on this device. Please re-register your fingerprint/face and try again.';
    }

    return res.status(400).json({
      success: false,
      message: friendlyMessage
    });
  }
};

// @desc    Generate biometric re-registration options (device update)
// @route   GET /api/auth/re-register-options?type=fingerprint|face
// @access  Private
exports.generateReregisterOptions = async (req, res) => {
  req.body = { type: req.query.type };
  return exports.generateBiometricRegistration(req, res);
};

// @desc    Verify biometric re-registration and replace existing credential
// @route   POST /api/auth/update-biometrics
// @access  Private
exports.updateBiometrics = async (req, res) => {
  return exports.verifyBiometricRegistration(req, res);
};

// @desc    Send recovery OTP and return one saved security question
// @route   POST /api/auth/recovery/send-otp
// @access  Public
exports.sendRecoveryOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!Array.isArray(user.securityQuestions) || user.securityQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No security questions configured for this account.'
      });
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    user.recoveryOtp = await bcrypt.hash(otp, salt);
    user.recoveryOtpExpires = Date.now() + 10 * 60 * 1000;
    user.recoveryQuestionIndex = Math.floor(Math.random() * user.securityQuestions.length);
    await user.save();

    const selectedQuestion = user.securityQuestions[user.recoveryQuestionIndex]?.question || '';
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #00563B;">iVotePK - Device Recovery OTP</h1>
          <p>Your recovery OTP is:</p>
          <div style="background-color: #00563B; color: white; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p><strong>This OTP expires in 10 minutes.</strong></p>
          <p>If this was not you, please secure your account immediately.</p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'iVotePK - Recovery OTP',
      message
    });

    return res.status(200).json({
      success: true,
      message: 'Recovery OTP sent to your email.',
      question: selectedQuestion
    });
  } catch (error) {
    console.error('Recovery OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send recovery OTP' });
  }
};

// @desc    Verify recovery OTP + security answer and issue temporary session
// @route   POST /api/auth/recovery/verify
// @access  Public
exports.verifyRecoveryLogin = async (req, res) => {
  try {
    const { email, otp, answer } = req.body;
    if (!email || !otp || !answer) {
      return res.status(400).json({ success: false, message: 'Email, OTP and answer are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.recoveryOtp || !user.recoveryOtpExpires || Date.now() > new Date(user.recoveryOtpExpires).getTime()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const otpOk = await bcrypt.compare(String(otp).trim(), user.recoveryOtp);
    if (!otpOk) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const idx = Number.isInteger(user.recoveryQuestionIndex) ? user.recoveryQuestionIndex : -1;
    const questionEntry = idx >= 0 ? user.securityQuestions[idx] : null;
    if (!questionEntry?.answer) {
      return res.status(400).json({ success: false, message: 'Recovery question not found. Request OTP again.' });
    }

    const answerOk = await bcrypt.compare(String(answer).toLowerCase().trim(), questionEntry.answer);
    if (!answerOk) {
      return res.status(400).json({ success: false, message: 'Incorrect security answer' });
    }

    user.recoveryOtp = undefined;
    user.recoveryOtpExpires = undefined;
    user.recoveryQuestionIndex = undefined;
    user.lastMfaVerifiedAt = Date.now();
    user.lastLoginMethod = 'recovery';
    user.activeMfaSessionStartedAt = undefined;
    await user.save();

    const token = generateRecoveryToken(user._id, user.role);
    return res.status(200).json({
      success: true,
      token,
      recoveryLogin: true,
      message: 'Logged in via account recovery. You can vote now.',
      user: {
        id: user._id,
        email: user.email,
        cnic: user.cnic,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Recovery verify error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify recovery login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -securityQuestions.answer');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    syncRegistrationProgress(user);
    await user.save();

    res.status(200).json({ success: true, user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Request halqa assignment for the current voter
// @route   POST /api/auth/halqa-request
// @access  Private
exports.requestHalqaAssignment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'voter') {
      return res.status(403).json({ success: false, message: 'Only voters can request halqa assignment' });
    }

    if (user.halqaId) {
      return res.status(400).json({ success: false, message: 'Your halqa is already assigned' });
    }

    if (user.halqaRequestedAt) {
      return res.status(200).json({ success: true, message: 'You already requested halqa assignment', halqaRequestedAt: user.halqaRequestedAt });
    }

    user.halqaRequestedAt = Date.now();
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'request_halqa_assignment',
      message: `Voter ${user.name || user.cnic} requested halqa assignment`,
      meta: { voterId: user._id }
    });

    res.status(200).json({ success: true, message: 'Halqa assignment request sent successfully', halqaRequestedAt: user.halqaRequestedAt });
  } catch (error) {
    console.error('Request halqa assignment error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete current user account
// @route   DELETE /api/auth/delete-account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.user.id);
    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};

// @desc    Get registration progress without requiring MFA
// @route   GET /api/auth/registration-status
// @access  Private
exports.getRegistrationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -securityQuestions.answer');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    syncRegistrationProgress(user);
    await user.save();

    return res.status(200).json({
      success: true,
      registrationProgress: user.registrationProgress,
      biometricSetup: user.biometricSetup,
      hasWebAuthnCredentials: Array.isArray(user.webAuthnCredentials) && user.webAuthnCredentials.length > 0,
      missingRegistrationSteps: getMissingRegistrationSteps(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cnic: user.cnic,
        role: user.role,
        districtCode: user.districtCode,
        district: user.district,
        halqaId: user.halqaId
      }
    });
  } catch (error) {
    console.error('Get registration status error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user activity logs
// @route   GET /api/auth/activity
// @access  Private
exports.getUserActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = await ActivityLog.getUserActivity(req.user.id, limit);

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Capture and store face data
// @route   POST /api/auth/face/capture
// @access  Private
exports.captureFaceData = async (req, res) => {
  try {
    const { faceData, faceFeatures, faceSamples } = req.body;

    if (faceData) {
      return res.status(400).json({
        success: false,
        message: 'Raw face images are not accepted. Please submit only encoded face vectors.'
      });
    }

    if (!faceData && !faceFeatures && !(Array.isArray(faceSamples) && faceSamples.length)) {
      return res.status(400).json({
        success: false,
        message: 'Face data is required'
      });
    }

    const normalizedSamples = normalizeIncomingFaceSamples({ faceData, faceFeatures, faceSamples });
    const storedFeatures = normalizedSamples[0];

    faceDebug('captureFaceData:normalized', {
      userId: String(req.user?.id || ''),
      samplesCount: normalizedSamples.length,
      sampleDimensions: normalizedSamples.map((sample) => sample.length)
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.registrationProgress?.otpVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify OTP before face setup'
      });
    }

    // Calculate quality score for the registered template
    const templateQuality = calculateTemplateQuality(storedFeatures);
    console.log(`Face registration - Template quality: ${templateQuality}%`);

    // Encrypt and store the templates securely
    const encryptedFeatures = encrypt(JSON.stringify(storedFeatures));
    const encryptedSamples = normalizedSamples.map((sample) => encrypt(JSON.stringify(sample)));

    // Calculate hash for integrity verification
    const combinedHash = generateFaceHash(normalizedSamples);

    if (!user.biometricSetup) user.biometricSetup = {};
    if (!user.biometricSetup.faceRecognition) {
      user.biometricSetup.faceRecognition = { isSetup: false };
    }
    if (!user.biometricSetup.face) {
      user.biometricSetup.face = { isSetup: false };
    }

    // Store encrypted templates with metadata
    user.biometricSetup.faceRecognition.faceData = encryptedFeatures;
    user.biometricSetup.faceRecognition.faceSamples = encryptedSamples;
    user.biometricSetup.faceRecognition.faceHash = combinedHash;
    user.biometricSetup.faceRecognition.isSetup = true;
    user.biometricSetup.faceRecognition.templateQuality = templateQuality;
    user.biometricSetup.faceRecognition.registeredAt = new Date();
    user.biometricSetup.face.isSetup = true;
    user.registrationProgress.faceCaptured = true;
    updateRegistrationCompletion(user);

    await user.save();

    faceDebug('captureFaceData:saved', {
      userId: String(user._id),
      isSetup: Boolean(user.biometricSetup?.faceRecognition?.isSetup),
      encryptedSamplesCount: Array.isArray(user.biometricSetup?.faceRecognition?.faceSamples)
        ? user.biometricSetup.faceRecognition.faceSamples.length
        : 0
    });

    res.status(200).json({
      success: true,
      message: 'Face registered successfully. Your encrypted face profile is stored securely.',
      registrationProgress: user.registrationProgress,
      biometricSetup: user.biometricSetup,
      faceSamplesCaptured: normalizedSamples.length,
      templateQuality
    });

  } catch (error) {
    console.error('Face capture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture face data',
      error: error.message
    });
  }
};

// @desc    Verify face data during login
// @route   POST /api/auth/face/verify
// @access  Private
exports.verifyFaceData = async (req, res) => {
  try {
    const { faceData, faceFeatures, faceSamples } = req.body;

    if (faceData) {
      return res.status(400).json({
        success: false,
        message: 'Raw face images are not accepted. Please submit only encoded face vectors.'
      });
    }

    if (!faceData && !faceFeatures && !(Array.isArray(faceSamples) && faceSamples.length)) {
      return res.status(400).json({
        success: false,
        message: 'Face data is required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account is not verified. Please verify email before biometric login.'
      });
    }

    syncRegistrationProgress(user);

    if (!isRegistrationCompleteByDb(user)) {
      return res.status(403).json({
        success: false,
        message: 'Registration is incomplete. Complete all mandatory setup steps first.'
      });
    }

    if (!isRecentVerification(user.activeMfaSessionStartedAt)) {
      return res.status(401).json({
        success: false,
        message: 'Biometric session expired. Please login with password again to restart biometric verification.'
      });
    }

    if (!user.biometricSetup?.faceRecognition) {
      user.biometricSetup = {
        ...(user.biometricSetup || {}),
        faceRecognition: { isSetup: false }
      };
    }

    if (user.loginAttempts?.lockUntil && user.loginAttempts.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Face verification is temporarily locked. Please wait 10 seconds and try again.'
      });
    }

    if (!user.biometricSetup.faceRecognition.isSetup) {
      return res.status(400).json({
        success: false,
        message: 'Face recognition not set up for this user'
      });
    }

    const storedSamples = getStoredFaceSamples(user);
    if (!storedSamples.length) {
      faceDebug('verifyFaceData:noStoredSamples', {
        userId: String(user._id),
        isSetup: Boolean(user.biometricSetup?.faceRecognition?.isSetup)
      });
      return res.status(400).json({
        success: false,
        message: 'Stored face profile is incomplete. Please re-register face recognition.'
      });
    }

    const capturedSamples = normalizeIncomingFaceSamples({ faceData, faceFeatures, faceSamples });

    if (capturedSamples.length < MIN_FACE_LOGIN_SAMPLES) {
      return res.status(400).json({
        success: false,
        message: `Face verification requires at least ${MIN_FACE_LOGIN_SAMPLES} live samples. Please try again.`
      });
    }

    if (hasDuplicateCapturedSamples(capturedSamples)) {
      return res.status(400).json({
        success: false,
        message: 'Live face verification failed. Please move slightly and try again.',
        errorCode: 'FACE_LIVENESS_FAILED'
      });
    }

    const normalizedStoredSamples = storedSamples
      .map((sample) => l2NormalizeEmbedding(sample))
      .filter((sample) => sample.length === 128);

    const normalizedCapturedSamples = capturedSamples
      .map((sample) => l2NormalizeEmbedding(sample))
      .filter((sample) => sample.length === 128);

    if (!normalizedStoredSamples.length || normalizedCapturedSamples.length < MIN_FACE_LOGIN_SAMPLES) {
      return res.status(400).json({
        success: false,
        message: 'Face profile data is invalid. Please re-register face recognition.'
      });
    }

    faceDebug('verifyFaceData:comparisonStart', {
      userId: String(user._id),
      storedCount: normalizedStoredSamples.length,
      capturedCount: normalizedCapturedSamples.length,
      threshold: FACE_MATCH_THRESHOLD
    });

    let bestComparison = {
      match: false,
      similarity: 0
    };

    const perSampleBestScores = normalizedCapturedSamples.map((capturedSample) => {
      let bestSimilarityForSample = 0;
      let bestDistanceForSample = Number.POSITIVE_INFINITY;

      normalizedStoredSamples.forEach((storedSample) => {
        const similarity = cosineSimilarity(storedSample, capturedSample);
        const distance = euclideanDistance(storedSample, capturedSample);

        if (similarity > bestSimilarityForSample) {
          bestSimilarityForSample = similarity;
          bestDistanceForSample = distance;
        }

        if (similarity > bestComparison.similarity) {
          bestComparison = {
            match: similarity >= FACE_MATCH_THRESHOLD && distance <= FACE_MAX_EUCLIDEAN_DISTANCE,
            similarity,
            distance
          };
        }
      });

      return {
        similarity: bestSimilarityForSample,
        distance: bestDistanceForSample,
        match: bestSimilarityForSample >= FACE_MATCH_THRESHOLD && bestDistanceForSample <= FACE_MAX_EUCLIDEAN_DISTANCE
      };
    });

    const matchedSampleCount = perSampleBestScores.filter((sample) => sample.match).length;
    const requiredMatchedSamples = Math.max(1, Math.ceil(normalizedCapturedSamples.length * REQUIRED_FACE_MATCH_RATIO));
    const averageSimilarity = perSampleBestScores.length
      ? perSampleBestScores.reduce((sum, sample) => sum + sample.similarity, 0) / perSampleBestScores.length
      : 0;
    const averageDistance = perSampleBestScores.length
      ? perSampleBestScores.reduce((sum, sample) => sum + sample.distance, 0) / perSampleBestScores.length
      : Number.POSITIVE_INFINITY;
    const consistentMatch = matchedSampleCount >= requiredMatchedSamples;
    const aggregateMatch = averageSimilarity >= FACE_AVERAGE_MATCH_THRESHOLD && averageDistance <= FACE_AVERAGE_MAX_EUCLIDEAN_DISTANCE;

    faceDebug('verifyFaceData:bestComparison', {
      userId: String(user._id),
      match: Boolean(bestComparison.match),
      similarity: Number((bestComparison.similarity || 0).toFixed(6)),
      distance: Number((bestComparison.distance || 0).toFixed(6)),
      threshold: FACE_MATCH_THRESHOLD,
      maxDistance: FACE_MAX_EUCLIDEAN_DISTANCE,
      aggregateMatch,
      aggregateThreshold: FACE_AVERAGE_MATCH_THRESHOLD,
      aggregateMaxDistance: FACE_AVERAGE_MAX_EUCLIDEAN_DISTANCE,
      matchedSampleCount,
      requiredMatchedSamples,
      averageSimilarity: Number(averageSimilarity.toFixed(6)),
      averageDistance: Number(averageDistance.toFixed(6))
    });

    if (!bestComparison.match || !consistentMatch || !aggregateMatch) {
      user.loginAttempts.count += 1;
      user.loginAttempts.lastAttempt = Date.now();

      if (user.loginAttempts.count >= 3) {
        user.loginAttempts.lockUntil = Date.now() + LOGIN_LOCK_MS;
        await user.save();

        return res.status(401).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 10 seconds.',
          locked: true
        });
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Unregistered face detected. This face does not match your registered profile.',
        errorCode: 'UNREGISTERED_FACE',
        attemptsLeft: 3 - user.loginAttempts.count
      });
    }

    user.loginAttempts.count = 0;
    user.loginAttempts.lastAttempt = null;
    user.loginAttempts.lockUntil = null;
    user.lastFaceVerifiedAt = Date.now();

    const mfaVerified = updateMfaCompletionState(user);
    const requiresFingerprint = !isRecentVerification(user.lastFingerprintVerifiedAt);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Identity verified successfully.',
      userId: user._id,
      userName: user.name,
      welcomeMessage: `Welcome, ${user.name || 'Voter'}.`,
      mfaVerified,
      requiresFingerprint,
      nextStep: mfaVerified ? null : 'fingerprint'
    });

  } catch (error) {
    console.error('Face verification error:', error);
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to verify face data',
      error: error.message
    });
  }
};

// @desc    Capture and store fingerprint key
// @route   POST /api/auth/fingerprint/capture
// @access  Private
exports.captureFingerprintData = async (req, res) => {
  try {
    const { fingerprintKey } = req.body;

    if (!fingerprintKey) {
      return res.status(400).json({
        success: false,
        message: 'Fingerprint key is required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.registrationProgress?.otpVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify OTP before fingerprint setup'
      });
    }

    const encryptedKey = encrypt(fingerprintKey);
    if (!user.biometricSetup) user.biometricSetup = {};
    if (!user.biometricSetup.fingerprint) {
      user.biometricSetup.fingerprint = { isSetup: false };
    }
    user.biometricSetup.fingerprint.fingerprintKey = encryptedKey;
    user.biometricSetup.fingerprint.isSetup = true;
    user.registrationProgress.fingerprintCaptured = true;
    updateRegistrationCompletion(user);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Fingerprint captured and stored securely',
      registrationProgress: user.registrationProgress
    });

  } catch (error) {
    console.error('Fingerprint capture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture fingerprint',
      error: error.message
    });
  }
};

// @desc    Verify fingerprint during login
// @route   POST /api/auth/fingerprint/verify
// @access  Private
exports.verifyFingerprintData = async (req, res) => {
  try {
    const { fingerprintKey } = req.body;

    if (!fingerprintKey) {
      return res.status(400).json({
        success: false,
        message: 'Fingerprint key is required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!isRegistrationCompleteByDb(user)) {
      return res.status(403).json({
        success: false,
        message: 'Registration is incomplete. Complete all mandatory setup steps first.'
      });
    }

    if (!user.biometricSetup?.fingerprint) {
      user.biometricSetup = {
        ...(user.biometricSetup || {}),
        fingerprint: { isSetup: false }
      };
    }

    if (!user.biometricSetup.fingerprint.isSetup) {
      return res.status(400).json({
        success: false,
        message: 'Fingerprint not set up for this user'
      });
    }

    const storedKey = decrypt(user.biometricSetup.fingerprint.fingerprintKey);

    if (storedKey !== fingerprintKey) {
      user.loginAttempts.count += 1;
      user.loginAttempts.lastAttempt = Date.now();

      if (user.loginAttempts.count >= 3) {
        user.loginAttempts.lockUntil = Date.now() + LOGIN_LOCK_MS;
        await user.save();

        return res.status(401).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 10 seconds.',
          locked: true
        });
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Fingerprint verification failed',
        attemptsLeft: 3 - user.loginAttempts.count
      });
    }

    user.loginAttempts.count = 0;
    user.loginAttempts.lastAttempt = null;
    user.loginAttempts.lockUntil = null;
    user.lastFingerprintVerifiedAt = Date.now();

    const mfaVerified = updateMfaCompletionState(user);
    const requiresFace = !isRecentVerification(user.lastFaceVerifiedAt);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Fingerprint verified successfully',
      userId: user._id,
      mfaVerified,
      requiresFace,
      nextStep: mfaVerified ? null : 'face'
    });

  } catch (error) {
    console.error('Fingerprint verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify fingerprint',
      error: error.message
    });
  }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email not found'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    user.otp = hashedOTP;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const message = `
      <h2>Password Reset Request</h2>
      <p>You have requested to reset your password for iVotePK.</p>
      <p>Your OTP code is: <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP - iVotePK',
      message
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email for password reset'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No password reset request found'
      });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// @desc    Admin Forgot Password - Send OTP
// @route   POST /api/auth/admin/forgot-password
// @access  Public
exports.forgotPasswordAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Admin email is required'
      });
    }

    const admin = await User.findOne({ role: 'admin', email: String(email).toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    admin.otp = hashedOTP;
    admin.otpExpires = Date.now() + 10 * 60 * 1000;
    await admin.save();

    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #00563B;">iVotePK - Admin Password Reset</h1>
          <p>You have requested to reset your admin password for iVotePK.</p>
          <p>Your OTP code is: <strong style="font-size: 24px; color: #00563B;">${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email and contact your system administrator.</p>
        </div>
      </div>
    `;

    await sendEmail({
      email: admin.email,
      subject: 'iVotePK - Admin Password Reset OTP',
      message
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your admin email for password reset'
    });

  } catch (error) {
    console.error('Admin forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

// @desc    Admin Reset Password with OTP
// @route   POST /api/auth/admin/reset-password
// @access  Public
exports.resetPasswordAdmin = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    const admin = await User.findOne({ role: 'admin', email: String(email).toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    if (!admin.otp || !admin.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No password reset request found'
      });
    }

    if (Date.now() > admin.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    const isMatch = await bcrypt.compare(otp, admin.otp);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.otp = undefined;
    admin.otpExpires = undefined;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// @desc    Verify biometric login with email and credential
// @route   POST /api/auth/login/verify
// @access  Public
exports.verifyBiometricLogin = async (req, res) => {
  try {
    const { email, cnic, identifier, credential } = req.body;
    // Allow frontend to send identifier in email field, cnic field, or identifier field
    const loginIdentifier = identifier || cnic || email;
    const normalizedCandidates = getNormalizedLoginCandidates(loginIdentifier);

    console.log('[BiometricLogin] Starting verification for:', loginIdentifier);
    console.log('[BiometricLogin] Incoming credential.id:', credential?.id);

    if (!loginIdentifier || !credential || !credential.id) {
      return res.status(400).json({
        success: false,
        message: 'Identifier (CNIC/Email) and credential.id are required'
      });
    }

    // Find user by either email OR cnic (robust lookup)
    const user = await User.findOne({
      $or: [
        { email: { $in: normalizedCandidates } },
        { cnic: { $in: normalizedCandidates } }
      ]
    });

    if (!user) {
      console.error('[BiometricLogin] User not found for:', loginIdentifier);
      return res.status(404).json({
        success: false,
        message: `User not found for the provided identifier (${loginIdentifier}).`
      });
    }

    console.log('[BiometricLogin] User found:', user._id, 'Name:', user.name);
    console.log('[BiometricLogin] User webAuthnCredentials count:', user.webAuthnCredentials?.length || 0);
    console.log('[BiometricLogin] User fingerprintCredential exists:', !!user.fingerprintCredential?.credentialId);
    console.log('[BiometricLogin] User faceCredential exists:', !!user.faceCredential?.credentialId);

    const storedCredentials = getStoredCredentialsByType(user, 'biometric');
    console.log('[BiometricLogin] Stored credentials found:', storedCredentials.length);
    
    if (storedCredentials.length > 0) {
      console.log('[BiometricLogin] Stored credential IDs:', storedCredentials.map(c => `${c.type}:${c.credentialId?.substring(0, 20)}...`));
    }

    if (!storedCredentials.length) {
      console.error('[BiometricLogin] No biometric credentials found. User data:', {
        hasWebAuthCredentials: !!user.webAuthnCredentials?.length,
        webAuthLength: user.webAuthnCredentials?.length,
        hasFingerprintCred: !!user.fingerprintCredential?.credentialId,
        hasFaceCred: !!user.faceCredential?.credentialId
      });
      return res.status(400).json({
        success: false,
        message: 'No biometric registration found. Please complete biometric setup again.'
      });
    }

    const incomingCredentialId = normalizeCredentialId(credential.id);
    console.log('[BiometricLogin] Normalized incoming credential ID:', incomingCredentialId?.substring(0, 20) + '...');
    
    const matchedCredential = storedCredentials.find((stored) =>
      normalizeCredentialId(stored.credentialId) === incomingCredentialId
    );

    if (!matchedCredential) {
      console.error('[BiometricLogin] Credential ID mismatch');
      console.log('[BiometricLogin] Incoming:', incomingCredentialId?.substring(0, 20) + '...');
      console.log('[BiometricLogin] Available stored IDs:', storedCredentials.map(c => normalizeCredentialId(c.credentialId)?.substring(0, 20) + '...'));
      return res.status(400).json({
        success: false,
        message: 'Biometric credential mismatch. Please use the registered device credential or re-register biometrics.'
      });
    }

    console.log('[BiometricLogin] Credential matched successfully:', matchedCredential.type);

    const token = generateToken(user._id, user.role);

    user.lastLogin = Date.now();
    user.lastLoginMethod = 'biometric';
    user.lastMfaVerifiedAt = Date.now();
    user.activeMfaSessionStartedAt = undefined;

    if (matchedCredential.type === 'fingerprint') {
      user.lastFingerprintVerifiedAt = Date.now();
    } else if (matchedCredential.type === 'face') {
      user.lastFaceVerifiedAt = Date.now();
    }

    user.webAuthnChallenge = undefined;
    user.webAuthnChallengeType = undefined;
    await user.save();

    await manualLog(user._id, 'biometric_login', `Biometric login successful for ${user.email}`, req);

    res.status(200).json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        cnic: user.cnic,
        role: user.role,
        districtCode: user.districtCode,
        district: user.district,
        halqaId: user.halqaId
      }
    });
  } catch (err) {
    console.error('Biometric login verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
