/**
 * Utility to properly convert base64 credential IDs to Uint8Array
 * Fixes "No Passkey Available" error by ensuring proper buffer format
 */

export const base64ToUint8Array = (base64String) => {
  if (!base64String) {
    throw new Error('Credential ID is empty');
  }

  // Normalize base64url to standard base64
  // Replace URL-safe characters
  let normalized = base64String.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (normalized.length % 4) {
    normalized += '=';
  }

  try {
    // Decode base64 to binary string
    const binary = atob(normalized);
    
    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    return bytes;
  } catch (error) {
    console.error('Failed to parse credential ID:', error);
    throw new Error('Invalid credential format. Credential ID must be valid base64.');
  }
};

export const uint8ArrayToBase64 = (uint8Array) => {
  let binary = '';
  const bytes = new Uint8Array(uint8Array);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Use standard base64, not base64url
  return btoa(binary);
};

/**
 * Check if credential format is valid
 */
export const isValidCredentialFormat = (credentialId) => {
  try {
    base64ToUint8Array(credentialId);
    return true;
  } catch {
    return false;
  }
};
