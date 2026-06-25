/**
 * Enhanced Face Embedding Utility
 * Provides face detection, feature extraction, and quality assessment
 */

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Failed to load captured face image.'));
  image.src = src;
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Detect face bounds in canvas using browser FaceDetector API or fallback
 * @param {HTMLCanvasElement} canvas - Canvas containing face image
 * @returns {object} Face bounding box with coordinates and detection method
 */
const detectFaceBoundsFromCanvas = async (canvas) => {
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      const detector = new window.FaceDetector({
        fastMode: true,
        maxDetectedFaces: 2
      });
      const faces = await detector.detect(canvas);

      if (faces.length > 1) {
        throw new Error('Only one face should be visible during scanning.');
      }

      if (faces.length === 1) {
        const box = faces[0].boundingBox;
        return {
          x: clamp(Math.round(box.x), 0, canvas.width - 1),
          y: clamp(Math.round(box.y), 0, canvas.height - 1),
          width: clamp(Math.round(box.width), 1, canvas.width),
          height: clamp(Math.round(box.height), 1, canvas.height),
          detected: true,
          confidence: faces[0].confidence || 0.9
        };
      }
    } catch (error) {
      if (error?.message?.includes('Only one face')) {
        throw error;
      }
      // FaceDetector not supported or failed, use fallback
    }
  }

  // Fallback: Use center-weighted detection
  const width = Math.round(canvas.width * 0.62);
  const height = Math.round(canvas.height * 0.78);
  return {
    x: Math.round((canvas.width - width) / 2),
    y: Math.round((canvas.height - height) / 2),
    width,
    height,
    detected: false,
    confidence: 0.5
  };
};

/**
 * Compute a compact face embedding from canvas region
 * @param {HTMLCanvasElement} canvas - Source canvas
 * @param {object} bounds - Face bounding box
 * @param {number} embeddingSize - Size of embedding vector (default: 128)
 * @returns {array} Normalized face embedding
 */
const computeEmbedding = (canvas, bounds, embeddingSize = 128) => {
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 16;
  sampleCanvas.height = 8;
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });

  // Draw face region with some padding
  const padding = Math.round(Math.min(bounds.width, bounds.height) * 0.1);
  sampleContext.drawImage(
    canvas,
    Math.max(0, bounds.x - padding),
    Math.max(0, bounds.y - padding),
    bounds.width + (padding * 2),
    bounds.height + (padding * 2),
    0,
    0,
    sampleCanvas.width,
    sampleCanvas.height
  );

  const { data } = sampleContext.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
  const grayscale = [];

  // Convert to grayscale using luminance formula
  for (let index = 0; index < data.length; index += 4) {
    grayscale.push(
      data[index] * 0.299 +
      data[index + 1] * 0.587 +
      data[index + 2] * 0.114
    );
  }

  // Calculate mean and normalize
  const mean = grayscale.reduce((sum, value) => sum + value, 0) / grayscale.length;
  const centered = grayscale.map((value) => value - mean);
  const norm = Math.sqrt(centered.reduce((sum, value) => sum + (value ** 2), 0)) || 1;

  // Generate embedding with variance preservation
  const embedding = centered.map((value) => Number((value / norm).toFixed(6)));

  // Enhance embedding with additional features
  const enhancedEmbedding = enhanceEmbedding(embedding, embeddingSize);

  return enhancedEmbedding;
};

/**
 * Enhance embedding with additional statistical features
 * @param {array} baseEmbedding - Base embedding from PCA
 * @param {number} targetSize - Target size for the embedding
 * @returns {array} Enhanced embedding
 */
const enhanceEmbedding = (baseEmbedding, targetSize = 128) => {
  // Ensure base embedding has consistent size
  const normalizedBase = [];
  for (let i = 0; i < targetSize; i++) {
    const idx = Math.floor((i / targetSize) * baseEmbedding.length);
    normalizedBase.push(baseEmbedding[idx] || 0);
  }

  // Calculate additional features from the embedding
  const mean = normalizedBase.reduce((a, b) => a + b, 0) / normalizedBase.length;
  const variance = normalizedBase.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / normalizedBase.length;
  const stdDev = Math.sqrt(variance);

  // Add statistical features
  const statisticalFeatures = [
    mean,
    stdDev,
    Math.min(...normalizedBase),
    Math.max(...normalizedBase),
    (Math.max(...normalizedBase) + Math.min(...normalizedBase)) / 2 // range center
  ];

  // Combine base embedding with statistical features
  const enhanced = [...normalizedBase.slice(0, targetSize - 5), ...statisticalFeatures];

  // Re-normalize
  const enhancedNorm = Math.sqrt(enhanced.reduce((sum, v) => sum + v * v, 0)) || 1;
  return enhanced.map(v => Number((v / enhancedNorm).toFixed(6)));
};

/**
 * Assess face quality based on positioning and image characteristics
 * @param {HTMLCanvasElement} canvas - Canvas with face image
 * @param {object} bounds - Face bounding box
 * @returns {object} Quality assessment
 */
const assessFaceQuality = (canvas, bounds) => {
  const quality = {
    score: 0,
    issues: [],
    faceCoverage: 0,
    brightness: 0,
    contrast: 0,
    sharpness: 0
  };

  // Calculate face coverage
  const faceArea = bounds.width * bounds.height;
  const totalArea = canvas.width * canvas.height;
  quality.faceCoverage = faceArea / totalArea;

  // Optimal coverage is 15-40%
  if (quality.faceCoverage < 0.10) {
    quality.issues.push('Face too small - move closer');
  } else if (quality.faceCoverage > 0.50) {
    quality.issues.push('Face too close - move back');
  }

  // Calculate brightness
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 16;
  sampleCanvas.height = 16;
  const ctx = sampleCanvas.getContext('2d');
  ctx.drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, 16, 16);
  const imageData = ctx.getImageData(0, 0, 16, 16);
  const pixels = imageData.data;

  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const brightness = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
    totalBrightness += brightness;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
  }

  quality.brightness = totalBrightness / (pixels.length / 4);

  // Check lighting conditions
  if (quality.brightness < 60) {
    quality.issues.push('Lighting too dark - add more light');
    quality.score -= 20;
  } else if (quality.brightness > 220) {
    quality.issues.push('Lighting too bright - reduce glare');
    quality.score -= 15;
  }

  // Calculate contrast
  quality.contrast = maxBrightness - minBrightness;
  if (quality.contrast < 50) {
    quality.issues.push('Low contrast - improve lighting');
    quality.score -= 15;
  }

  // Calculate base score from face coverage
  if (quality.faceCoverage >= 0.15 && quality.faceCoverage <= 0.40) {
    quality.score += 40;
  } else if (quality.faceCoverage >= 0.10 && quality.faceCoverage <= 0.50) {
    quality.score += 25;
  } else {
    quality.score += 10;
  }

  // Add score for good lighting
  if (quality.brightness >= 80 && quality.brightness <= 180) {
    quality.score += 20;
  }

  // Add score for good contrast
  if (quality.contrast >= 80) {
    quality.score += 15;
  } else if (quality.contrast >= 50) {
    quality.score += 10;
  }

  return {
    ...quality,
    score: Math.max(0, Math.min(100, quality.score))
  };
};

/**
 * Create face embedding from a data URL
 * @param {string} dataUrl - Base64 encoded image data URL
 * @returns {object} Embedding with metadata
 */
export const createFaceEmbeddingFromDataUrl = async (dataUrl) => {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  // Detect face bounds
  const bounds = await detectFaceBoundsFromCanvas(canvas);

  // Compute embedding
  const embedding = computeEmbedding(canvas, bounds);

  // Assess quality
  const quality = assessFaceQuality(canvas, bounds);
  const coverage = (bounds.width * bounds.height) / (canvas.width * canvas.height);

  return {
    embedding,
    metadata: {
      detectedByApi: bounds.detected,
      faceCoverage: Number(coverage.toFixed(4)),
      confidence: bounds.confidence,
      frameSize: { width: canvas.width, height: canvas.height },
      faceBox: bounds,
      quality
    }
  };
};

/**
 * Validate if a data URL contains a valid face image
 * @param {string} dataUrl - Base64 encoded image data URL
 * @returns {Promise<object>} Validation result
 */
export const validateFaceImage = async (dataUrl) => {
  try {
    const { metadata } = await createFaceEmbeddingFromDataUrl(dataUrl);
    
    return {
      valid: true,
      message: 'Face image is valid',
      quality: metadata.quality?.score || 0,
      faceCoverage: metadata.faceCoverage,
      detected: metadata.detectedByApi
    };
  } catch (error) {
    return {
      valid: false,
      message: error.message || 'Invalid face image',
      quality: 0,
      faceCoverage: 0,
      detected: false
    };
  }
};
