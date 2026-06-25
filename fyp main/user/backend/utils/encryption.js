const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || 'ivotepk_encryption_key_32_chars_long_secure_key_2024';
const key = crypto.createHash('sha256').update(String(secretKey)).digest();

/**
 * Encrypts text using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} Encrypted text in format "ivHex:cipherHex"
 */
const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

/**
 * Decrypts text that was encrypted with encrypt()
 * @param {string} hash - The encrypted text in format "ivHex:cipherHex"
 * @returns {string} Decrypted text
 */
const decrypt = (hash) => {
  try {
    let ivHex;
    let contentHex;

    if (typeof hash === 'string') {
      const parts = hash.split(':');
      if (parts.length !== 2) throw new Error('Invalid encrypted payload format');
      ivHex = parts[0];
      contentHex = parts[1];
    } else if (hash && typeof hash === 'object' && hash.iv && hash.content) {
      ivHex = hash.iv;
      contentHex = hash.content;
    } else {
      throw new Error('Invalid encrypted payload');
    }

    // Node crypto API requires createDecipheriv(algorithm, key, iv)
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(contentHex, 'hex')),
      decipher.final()
    ]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

/**
 * Generate a secure hash of data using SHA-256
 * @param {string} data - The data to hash
 * @returns {string} Hex-encoded hash
 */
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a cryptographically secure random token
 * @param {number} length - Length of the token in bytes (default: 32)
 * @returns {string} Hex-encoded random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a random salt for password hashing
 * @returns {string} Base64-encoded random salt
 */
const generateSalt = () => {
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Hash data with salt using PBKDF2
 * @param {string} data - The data to hash
 * @param {string} salt - The salt to use
 * @param {number} iterations - Number of iterations (default: 100000)
 * @returns {string} Hex-encoded hash
 */
const hashWithSalt = (data, salt, iterations = 100000) => {
  return crypto.pbkdf2Sync(data, salt, iterations, 64, 'sha512').toString('hex');
};

/**
 * Create a keyed hash (HMAC) of data
 * @param {string} data - The data to hash
 * @param {string} hmacKey - The HMAC key (optional, uses encryption key if not provided)
 * @returns {string} Hex-encoded HMAC
 */
const createHmac = (data, hmacKey = null) => {
  const key = hmacKey || secretKey;
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

/**
 * Verify a keyed hash (HMAC)
 * @param {string} data - The original data
 * @param {string} hmac - The HMAC to verify
 * @param {string} hmacKey - The HMAC key
 * @returns {boolean} True if HMAC is valid
 */
const verifyHmac = (data, hmac, hmacKey = null) => {
  const expectedHmac = createHmac(data, hmacKey);
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
};

/**
 * Encrypt biometric template with additional security measures
 * @param {array|object} template - The biometric template to encrypt
 * @returns {object} Encrypted template with metadata
 */
const encryptBiometricTemplate = (template) => {
  try {
    const templateString = JSON.stringify(template);
    const salt = generateSalt();
    const saltHash = hashWithSalt(templateString, salt);
    const encrypted = encrypt(templateString);
    
    return {
      encrypted,
      saltHash,
      salt,
      algorithm: 'AES-256-CBC',
      timestamp: Date.now(),
      version: 1
    };
  } catch (error) {
    console.error('Biometric template encryption error:', error);
    throw error;
  }
};

/**
 * Decrypt biometric template
 * @param {object} encryptedTemplate - The encrypted template object
 * @returns {array|object} Decrypted template
 */
const decryptBiometricTemplate = (encryptedTemplate) => {
  try {
    if (typeof encryptedTemplate === 'string') {
      // Backward compatibility - treat as simple encrypted string
      return JSON.parse(decrypt(encryptedTemplate));
    }
    
    if (encryptedTemplate.encrypted) {
      const decrypted = decrypt(encryptedTemplate.encrypted);
      return JSON.parse(decrypted);
    }
    
    throw new Error('Invalid encrypted template format');
  } catch (error) {
    console.error('Biometric template decryption error:', error);
    throw error;
  }
};

module.exports = {
  encrypt,
  decrypt,
  hashData,
  generateSecureToken,
  generateSalt,
  hashWithSalt,
  createHmac,
  verifyHmac,
  encryptBiometricTemplate,
  decryptBiometricTemplate
};
