const hasTypedCredential = (credentials, type) => (
  Array.isArray(credentials) &&
  credentials.some((credential) => credential?.credentialId && (!type || credential.type === type))
);

const hasAnyUsableBiometricLogin = (user) => Boolean(
  user?.fingerprintCredential?.credentialId ||
  user?.faceCredential?.credentialId ||
  hasTypedCredential(user?.webAuthnCredentials) ||
  hasTypedCredential(user?.biometricCredentials)
);

const hasRegisteredFingerprint = (user) => Boolean(
  user?.fingerprintCredential?.credentialId ||
  user?.biometricSetup?.fingerprint?.isSetup ||
  user?.biometricSetup?.fingerprint?.fingerprintKey ||
  hasTypedCredential(user?.webAuthnCredentials, 'fingerprint') ||
  hasTypedCredential(user?.biometricCredentials, 'fingerprint')
);

const hasRegisteredFace = (user) => Boolean(
  user?.faceCredential?.credentialId ||
  user?.biometricSetup?.face?.isSetup ||
  user?.biometricSetup?.faceRecognition?.isSetup ||
  hasTypedCredential(user?.webAuthnCredentials, 'face') ||
  hasTypedCredential(user?.biometricCredentials, 'face')
);

const hasAnyBiometricRegistration = (user) => Boolean(
  hasRegisteredFingerprint(user) || hasRegisteredFace(user)
);

const isTimestampWithinSession = (timestamp, sessionStart) => {
  if (!timestamp) return false;

  const verifiedAt = new Date(timestamp).getTime();
  if (!Number.isFinite(verifiedAt)) return false;

  if (!sessionStart) return true;
  const sessionStartAt = new Date(sessionStart).getTime();
  if (!Number.isFinite(sessionStartAt)) return true;

  return verifiedAt >= sessionStartAt;
};

const hasCompletedTwoFactorBiometricMfa = (user, windowMs = 15 * 60 * 1000) => {
  if (!user) return false;

  const fingerprintAt = user.lastFingerprintVerifiedAt ? new Date(user.lastFingerprintVerifiedAt).getTime() : 0;
  const faceAt = user.lastFaceVerifiedAt ? new Date(user.lastFaceVerifiedAt).getTime() : 0;
  if (!fingerprintAt || !faceAt) return false;

  const now = Date.now();
  const withinWindow = (now - fingerprintAt) <= windowMs && (now - faceAt) <= windowMs;
  if (!withinWindow) return false;

  // Require both factors to belong to the current login session when present.
  return (
    isTimestampWithinSession(user.lastFingerprintVerifiedAt, user.activeMfaSessionStartedAt) &&
    isTimestampWithinSession(user.lastFaceVerifiedAt, user.activeMfaSessionStartedAt)
  );
};

const isRegistrationComplete = (user) => Boolean(
  user?.registrationProgress?.otpVerified &&
  hasRegisteredFingerprint(user) &&
  hasRegisteredFace(user) &&
  Array.isArray(user?.securityQuestions) &&
  user.securityQuestions.length >= 3
);

const syncRegistrationProgress = (user) => {
  if (!user) return user;
  if (!user.registrationProgress) user.registrationProgress = {};

  const hasFingerprint = hasRegisteredFingerprint(user);
  const hasFace = hasRegisteredFace(user);
  const hasSecurityQuestions = Array.isArray(user.securityQuestions) && user.securityQuestions.length >= 3;
  const isComplete = Boolean(
    user.registrationProgress.otpVerified &&
    hasFingerprint &&
    hasFace &&
    hasSecurityQuestions
  );

  user.registrationProgress.fingerprintCaptured = hasFingerprint;
  user.registrationProgress.faceCaptured = hasFace;
  user.registrationProgress.biometricsCompleted = hasFingerprint && hasFace;
  user.registrationProgress.securityQuestionsSet = hasSecurityQuestions;
  user.registrationProgress.isRegistrationComplete = isComplete;
  user.registrationProgress.completedAt = isComplete
    ? (user.registrationProgress.completedAt || new Date())
    : undefined;

  return user;
};

module.exports = {
  hasRegisteredFingerprint,
  hasRegisteredFace,
  hasAnyBiometricRegistration,
  hasAnyUsableBiometricLogin,
  hasCompletedTwoFactorBiometricMfa,
  isRegistrationComplete,
  syncRegistrationProgress
};
