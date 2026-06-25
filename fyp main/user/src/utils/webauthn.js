// WebAuthn Utility Functions for Biometric Authentication

/**
 * Check if WebAuthn is supported in the browser
 */
export const isWebAuthnSupported = () => {
  return !!(navigator.credentials && navigator.credentials.create);
};

/**
 * Register a new biometric credential (fingerprint or face)
 * @param {string} userId - User's unique identifier (CNIC)
 * @param {string} userName - User's display name
 * @param {string} type - 'fingerprint' or 'face'
 * @returns {Promise<Object>} Credential creation result
 */
export const registerBiometric = async (userId, userName, type = 'fingerprint') => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser. Please use a modern browser with biometric support.');
  }

  try {
    // Generate a random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Prepare public key credential creation options
    const publicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: 'iVotePK',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: type === 'fingerprint' ? 'platform' : 'cross-platform',
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'direct',
    };

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    // Convert ArrayBuffer to Base64 for storage
    const credentialId = arrayBufferToBase64(credential.rawId);
    const publicKey = arrayBufferToBase64(credential.response.getPublicKey());
    const attestationObject = arrayBufferToBase64(credential.response.attestationObject);
    const clientDataJSON = arrayBufferToBase64(credential.response.clientDataJSON);

    return {
      success: true,
      credentialId,
      publicKey,
      attestationObject,
      clientDataJSON,
      type,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    
    // Handle specific error types
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric authentication was cancelled or not available.');
    } else if (error.name === 'InvalidStateError') {
      throw new Error('A credential already exists for this user.');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('Biometric authentication is not supported on this device.');
    } else if (error.name === 'SecurityError') {
      throw new Error('Security error occurred. Please ensure you are using HTTPS.');
    } else {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
};

/**
 * Verify a biometric credential (fingerprint or face)
 * @param {string} credentialId - The credential ID to verify
 * @param {string} userId - User's unique identifier
 * @returns {Promise<Object>} Verification result
 */
export const verifyBiometric = async (credentialId, userId) => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  try {
    // Get stored credentials for the user
    const storedCredentials = JSON.parse(localStorage.getItem('webauthn_credentials') || '[]');
    const userCredential = storedCredentials.find(
      cred => cred.credentialId === credentialId && cred.userId === userId
    );

    if (!userCredential) {
      throw new Error('Credential not found. Please register your biometric first.');
    }

    // Generate a random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Prepare public key credential request options
    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      allowCredentials: [
        {
          id: base64ToArrayBuffer(credentialId),
          type: 'public-key',
          transports: ['usb', 'nfc', 'ble', 'internal'],
        },
      ],
      timeout: 60000,
      userVerification: 'required',
      rpId: window.location.hostname,
    };

    // Get assertion
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    // Verify the assertion (in a real app, this would be done on the server)
    const clientDataJSON = arrayBufferToBase64(assertion.response.clientDataJSON);
    const authenticatorData = arrayBufferToBase64(assertion.response.authenticatorData);
    const signature = arrayBufferToBase64(assertion.response.signature);
    const userHandle = arrayBufferToBase64(assertion.response.userHandle);

    return {
      success: true,
      credentialId: arrayBufferToBase64(assertion.rawId),
      clientDataJSON,
      authenticatorData,
      signature,
      userHandle,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('WebAuthn verification error:', error);
    
    // Handle specific error types
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric authentication was cancelled or failed.');
    } else if (error.name === 'InvalidStateError') {
      throw new Error('No matching credential found.');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('Biometric authentication is not supported on this device.');
    } else {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }
};

/**
 * Store credential in localStorage (for frontend-only demo)
 * In production, this should be stored on the server
 */
export const storeCredential = (userId, credentialData) => {
  try {
    const credentials = JSON.parse(localStorage.getItem('webauthn_credentials') || '[]');
    
    // Check if credential already exists
    const existingIndex = credentials.findIndex(
      cred => cred.credentialId === credentialData.credentialId && cred.userId === userId
    );

    if (existingIndex >= 0) {
      credentials[existingIndex] = { ...credentialData, userId };
    } else {
      credentials.push({ ...credentialData, userId });
    }

    localStorage.setItem('webauthn_credentials', JSON.stringify(credentials));
    return true;
  } catch (error) {
    console.error('Error storing credential:', error);
    return false;
  }
};

/**
 * Get stored credentials for a user
 */
export const getStoredCredentials = (userId) => {
  try {
    const credentials = JSON.parse(localStorage.getItem('webauthn_credentials') || '[]');
    return credentials.filter(cred => cred.userId === userId);
  } catch (error) {
    console.error('Error getting stored credentials:', error);
    return [];
  }
};

/**
 * Convert ArrayBuffer to Base64
 */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Convert Base64 to ArrayBuffer
 */
const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Check if HTTPS is being used (required for WebAuthn in production)
 */
export const isSecureContext = () => {
  return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
};


