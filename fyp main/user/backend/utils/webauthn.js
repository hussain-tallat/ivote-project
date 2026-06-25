const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const expectedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
const expectedRPID = process.env.RP_ID || 'localhost';

const rpName = 'iVotePK';

/**
 * Generate options for WebAuthn registration.
 * These options can be passed directly to `startRegistration()` from @simplewebauthn/browser.
 */
// @simplewebauthn/server v13: generateRegistrationOptions is async (challenge is generated async).
const createRegistrationOptions = async ({ user, authenticatorSelection = {} }) => {
  return generateRegistrationOptions({
    rpID: expectedRPID,
    rpName,
    // User handle for the authenticator: must be bytes (max 64). ObjectId hex fits.
    userID: Buffer.from(user._id.toString(), 'utf8'),
    userName: user.email,
    // Direct attestation gives stronger authenticator details where available.
    // Browser/OS may still limit what is exposed based on privacy policy.
    attestationType: 'direct',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'required',
      requireResidentKey: true,
      ...authenticatorSelection
    },
    // Hint to expose user verification method data where supported.
    extensions: {
      uvm: true
    },
    timeout: 60_000
  });
};

/**
 * Verify WebAuthn registration ceremony (cryptographic signature verification).
 */
const verifyRegistration = async ({ credential, expectedChallenge }) => {
  // `credential` here is the object returned by @simplewebauthn/browser `startRegistration()`
  return verifyRegistrationResponse({
    response: credential,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    requireUserVerification: true
  });
};

/**
 * Generate options for WebAuthn authentication.
 * Pass a filtered allowCredentials list to enforce face vs fingerprint credential selection in your UI.
 */
// @simplewebauthn/server v13: generateAuthenticationOptions is async.
const createAuthenticationOptions = async ({ allowCredentials }) => {
  return generateAuthenticationOptions({
    rpID: expectedRPID,
    timeout: 60_000,
    userVerification: 'required',
    // allowCredentials is optional; but for our flow we pass a specific credential type.
    allowCredentials: allowCredentials || undefined,
    extensions: {
      uvm: true
    }
  });
};

/**
 * Verify WebAuthn authentication ceremony.
 */
const verifyAuthentication = async ({ credential, expectedChallenge, storedCredential }) => {
  return verifyAuthenticationResponse({
    // `credential` here is the object returned by @simplewebauthn/browser `startAuthentication()`
    response: credential,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    requireUserVerification: true,
    credential: {
      id: storedCredential.credentialId,
      publicKey: storedCredential.publicKey,
      counter: storedCredential.counter
    }
  });
};

module.exports = {
  expectedOrigin,
  expectedRPID,
  createRegistrationOptions,
  verifyRegistration,
  createAuthenticationOptions,
  verifyAuthentication
};
