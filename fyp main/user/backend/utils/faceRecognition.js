const crypto = require('crypto');
const { hashData, createHmac } = require('./encryption');

/**
 * Generate a unique hash for face data
 * @param {array|string} faceData - Face features or data
 * @returns {string} SHA-256 hash of the face data
 */
const generateFaceHash = (faceData) => {
  return hashData(
    typeof faceData === 'string' ? faceData : JSON.stringify(faceData)
  );
};

/**
 * Validate face data format and size
 * @param {string} faceDataBase64 - Base64 encoded face data
 * @returns {object} Validation result with valid flag and error message
 */
const validateFaceData = (faceDataBase64) => {
  if (!faceDataBase64 || typeof faceDataBase64 !== 'string') {
    return { valid: false, error: 'Face data is required' };
  }

  if (!faceDataBase64.startsWith('data:image/')) {
    return { valid: false, error: 'Invalid image format' };
  }

  try {
    const base64Data = faceDataBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length < 1000) {
      return { valid: false, error: 'Image too small or invalid' };
    }

    if (buffer.length > 5 * 1024 * 1024) {
      return { valid: false, error: 'Image too large (max 5MB)' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid base64 encoding' };
  }
};

/**
 * Normalize face embedding to a standard format
 * @param {any} value - Face embedding in various formats
 * @returns {array} Normalized embedding array
 */
const normalizeEmbedding = (value) => {
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
      if (/^[01.,-]+$/.test(value)) {
        // Handle comma/period/dash separated values
        const numbers = value.split(/[,\s-]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
        if (numbers.length > 0) {
          return numbers;
        }
      }
    }
  }

  return [];
};

/**
 * Compare two face embeddings using cosine similarity
 * @param {array|string} storedFaceFeatures - Stored face features
 * @param {array|string} capturedFaceFeatures - Captured face features
 * @param {number} threshold - Similarity threshold (0-1, default: 0.6)
 * @returns {object} Comparison result with match flag and similarity score
 */
const compareFaces = (storedFaceFeatures, capturedFaceFeatures, threshold = 0.6) => {
  try {
    const stored = normalizeEmbedding(storedFaceFeatures);
    const captured = normalizeEmbedding(capturedFaceFeatures);

    if (!stored.length || !captured.length) {
      return { match: false, similarity: 0, error: 'Invalid embedding format' };
    }

    // Use the minimum length for comparison
    const length = Math.min(stored.length, captured.length);
    
    let dot = 0;
    let storedNorm = 0;
    let capturedNorm = 0;

    for (let index = 0; index < length; index += 1) {
      dot += stored[index] * captured[index];
      storedNorm += stored[index] * stored[index];
      capturedNorm += captured[index] * captured[index];
    }

    const similarity = dot / (Math.sqrt(storedNorm) * Math.sqrt(capturedNorm));

    return {
      match: similarity >= threshold,
      similarity: similarity,
      threshold: threshold
    };
  } catch (error) {
    return { match: false, similarity: 0, error: error.message };
  }
};

/**
 * Extract face features from image data
 * @param {string} imageData - Base64 encoded image data
 * @returns {object} Extracted features and quality metrics
 */
const extractFaceFeatures = (imageData) => {
  // This is a placeholder - in production, use a proper face recognition library
  // For now, we'll return a mock embedding
  try {
    if (!imageData || typeof imageData !== 'string') {
      throw new Error('Invalid image data');
    }

    // Generate a deterministic embedding based on image hash
    const hash = crypto.createHash('sha256').update(imageData).digest('hex');
    const embedding = [];
    
    // Convert hash to 128-dimensional embedding
    for (let i = 0; i < 128; i++) {
      const byte = parseInt(hash.substr((i % 32) * 2, 2), 16);
      embedding.push((byte / 255) * 2 - 1); // Normalize to [-1, 1]
    }

    return {
      success: true,
      embedding: embedding,
      quality: 0.85,
      confidence: 0.9
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Validate template integrity
 * @param {array} template - Face template to validate
 * @returns {object} Validation result
 */
const validateTemplateIntegrity = (template) => {
  if (!Array.isArray(template)) {
    return { valid: false, error: 'Template must be an array' };
  }

  if (template.length !== 128) {
    return { valid: false, error: `Template must have 128 dimensions, got ${template.length}` };
  }

  const hasInvalidValues = template.some(val => !Number.isFinite(val));
  if (hasInvalidValues) {
    return { valid: false, error: 'Template contains invalid values' };
  }

  return { valid: true };
};

/**
 * Calculate template quality
 * @param {array} template - Face template
 * @returns {number} Quality score (0-1)
 */
const calculateTemplateQuality = (template) => {
  if (!Array.isArray(template) || template.length === 0) {
    return 0;
  }

  // Calculate variance as a quality metric
  const mean = template.reduce((sum, val) => sum + val, 0) / template.length;
  const variance = template.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / template.length;
  
  // Higher variance generally indicates better quality
  const quality = Math.min(1, Math.sqrt(variance) * 2);
  return quality;
};

/**
 * Merge multiple face samples into a single template
 * @param {array} samples - Array of face templates
 * @returns {object} Merged template and quality metrics
 */
const mergeFaceSamples = (samples) => {
  if (!Array.isArray(samples) || samples.length === 0) {
    return { success: false, error: 'No samples provided' };
  }

  try {
    // Normalize all samples
    const normalizedSamples = samples.map(sample => normalizeEmbedding(sample));
    
    // Check if all samples have the same dimension
    const dimensions = normalizedSamples.map(s => s.length);
    const uniqueDimensions = [...new Set(dimensions)];
    
    if (uniqueDimensions.length > 1) {
      return { success: false, error: 'Samples have different dimensions' };
    }

    const dimension = uniqueDimensions[0];
    
    // Calculate average embedding
    const mergedEmbedding = [];
    for (let i = 0; i < dimension; i++) {
      const sum = normalizedSamples.reduce((acc, sample) => acc + sample[i], 0);
      mergedEmbedding.push(sum / normalizedSamples.length);
    }

    // Calculate quality based on consistency across samples
    let totalVariance = 0;
    for (let i = 0; i < dimension; i++) {
      const values = normalizedSamples.map(s => s[i]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      totalVariance += variance;
    }
    
    const consistency = 1 - Math.min(1, totalVariance / dimension);
    const quality = calculateTemplateQuality(mergedEmbedding) * consistency;

    return {
      success: true,
      embedding: mergedEmbedding,
      quality: quality,
      samplesUsed: normalizedSamples.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Verify liveness (basic implementation)
 * @param {array} samples - Array of face samples
 * @returns {object} Liveness verification result
 */
const verifyLiveness = (samples) => {
  if (!Array.isArray(samples) || samples.length < 2) {
    return { isLive: false, confidence: 0, error: 'Insufficient samples for liveness detection' };
  }

  try {
    // Basic liveness check: verify samples are different (not static image)
    const normalizedSamples = samples.map(sample => normalizeEmbedding(sample));
    
    // Calculate differences between consecutive samples
    let totalDifference = 0;
    for (let i = 1; i < normalizedSamples.length; i++) {
      const diff = normalizedSamples[i].reduce((acc, val, idx) => {
        return acc + Math.abs(val - normalizedSamples[i-1][idx]);
      }, 0);
      totalDifference += diff / normalizedSamples[i].length;
    }
    
    const avgDifference = totalDifference / (normalizedSamples.length - 1);
    
    // If samples are too similar, it might be a static image
    const isLive = avgDifference > 0.01;
    const confidence = Math.min(1, avgDifference * 10);

    return {
      isLive: isLive,
      confidence: confidence,
      avgDifference: avgDifference
    };
  } catch (error) {
    return { isLive: false, confidence: 0, error: error.message };
  }
};

module.exports = {
  generateFaceHash,
  validateFaceData,
  normalizeEmbedding,
  compareFaces,
  extractFaceFeatures,
  validateTemplateIntegrity,
  calculateTemplateQuality,
  mergeFaceSamples,
  verifyLiveness
};
