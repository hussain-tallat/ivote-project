/**
 * Enhanced Face Scanner with face-api.js
 * Real-time face detection, quality assessment, and embedding extraction
 * Provides smartphone-like Face ID experience with guided multi-angle capture
 */

import * as faceapi from 'face-api.js';

// Model loading state
let modelsLoaded = false;
let modelLoadingPromise = null;

/**
 * Load face-api.js models
 */
export const loadFaceApiModels = async () => {
  if (modelsLoaded) return true;
  
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  modelLoadingPromise = (async () => {
    try {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      
      modelsLoaded = true;
      console.log('[FaceAPI] Models loaded successfully');
      return true;
    } catch (error) {
      console.error('[FaceAPI] Failed to load models:', error);
      modelLoadingPromise = null;
      throw new Error('Failed to load face detection models. Please refresh the page.');
    }
  })();

  return modelLoadingPromise;
};

/**
 * Check if models are loaded
 */
export const areModelsLoaded = () => modelsLoaded;

/**
 * Detect face in video element with landmarks and descriptor
 */
export const detectFace = async (video) => {
  if (!video || !video.videoWidth || !modelsLoaded) {
    return null;
  }

  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.debug('[FaceAPI] No face detected in frame');
      return null;
    }

    const result = {
      detection: detection.detection,
      landmarks: detection.landmarks,
      descriptor: Array.from(detection.descriptor),
      box: detection.detection.box,
      confidence: detection.detection.score
    };
    
    console.debug('[FaceAPI] Face detected | Confidence:', result.confidence.toFixed(2));
    return result;
  } catch (error) {
    console.error('[FaceAPI] Detection error:', error);
    return null;
  }
};

/**
 * Assess face quality based on multiple factors
 */
export const assessFaceQuality = (faceData, video) => {
  if (!faceData || !video) {
    return { quality: 0, issues: ['No face detected'] };
  }

  const issues = [];
  let quality = 100;

  const box = faceData.box;
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  // Check face size (should be at least 20% of frame)
  const faceArea = box.width * box.height;
  const frameArea = videoWidth * videoHeight;
  const faceRatio = faceArea / frameArea;

  if (faceRatio < 0.05) {
    issues.push('Face too small - move closer');
    quality -= 30;
  } else if (faceRatio > 0.6) {
    issues.push('Face too large - move back');
    quality -= 20;
  }

  // Check face position (should be centered)
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const frameCenterX = videoWidth / 2;
  const frameCenterY = videoHeight / 2;

  const offsetX = Math.abs(centerX - frameCenterX) / videoWidth;
  const offsetY = Math.abs(centerY - frameCenterY) / videoHeight;

  if (offsetX > 0.2) {
    issues.push('Center your face horizontally');
    quality -= 15;
  }

  if (offsetY > 0.2) {
    issues.push('Center your face vertically');
    quality -= 15;
  }

  // Check confidence
  if (faceData.confidence < 0.7) {
    issues.push('Low detection confidence - improve lighting');
    quality -= 20;
  }

  // Check landmarks for face orientation
  if (faceData.landmarks) {
    const leftEye = faceData.landmarks.getLeftEye();
    const rightEye = faceData.landmarks.getRightEye();
    
    // Check if eyes are roughly level
    const leftEyeCenter = leftEye.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    leftEyeCenter.x /= leftEye.length;
    leftEyeCenter.y /= leftEye.length;
    
    const rightEyeCenter = rightEye.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    rightEyeCenter.x /= rightEye.length;
    rightEyeCenter.y /= rightEye.length;
    
    const eyeLevelDiff = Math.abs(leftEyeCenter.y - rightEyeCenter.y);
    if (eyeLevelDiff > 20) {
      issues.push('Keep your head level');
      quality -= 10;
    }
  }

  return {
    quality: Math.max(0, quality),
    issues,
    details: {
      faceArea: faceArea.toFixed(4),
      frameArea: frameArea,
      faceRatio: faceRatio.toFixed(4),
      confidence: faceData.confidence.toFixed(2),
      offsetX: offsetX.toFixed(4),
      offsetY: offsetY.toFixed(4)
    }
  };
};

/**
 * Get user guidance based on face detection state
 * Provides smartphone-like Face ID guidance
 */
export const getFaceGuidance = (faceData, video, step = 0) => {
  if (!video) {
    return { message: 'Initializing camera...', icon: 'INIT', instruction: 'Please wait while we start the camera' };
  }

  if (!faceData) {
    return { 
      message: 'Position your face in the frame', 
      icon: '👤',
      instruction: 'Look straight at the camera and center your face'
    };
  }

  const quality = assessFaceQuality(faceData, video);
  
  if (quality.issues.length > 0) {
    return {
      message: quality.issues[0],
      icon: '⚠️',
      instruction: quality.issues[0],
      quality: quality.quality
    };
  }

  // Step-based guidance for registration (smartphone-like experience)
  const steps = [
    { message: 'Look straight ahead', icon: '👁️', instruction: 'Keep your face centered and look directly at the camera' },
    { message: 'Turn slightly left', icon: '👈', instruction: 'Slowly turn your head about 15 degrees to the left' },
    { message: 'Turn slightly right', icon: '👉', instruction: 'Slowly turn your head about 15 degrees to the right' },
    { message: 'Tilt slightly up', icon: '👆', instruction: 'Slowly tilt your head slightly upward' },
    { message: 'Tilt slightly down', icon: '👇', instruction: 'Slowly tilt your head slightly downward' }
  ];

  const currentStep = steps[step % steps.length];
  
  return {
    message: currentStep.message,
    icon: currentStep.icon,
    instruction: currentStep.instruction,
    quality: quality.quality
  };
};

/**
 * Capture frame from video element
 */
export const captureFrame = (video) => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.95);
};

/**
 * Extract face embedding from video
 */
export const extractFaceEmbedding = async (video) => {
  if (!modelsLoaded) {
    throw new Error('Face detection models not loaded');
  }

  const faceData = await detectFace(video);
  
  if (!faceData) {
    throw new Error('No face detected. Please position your face in the frame.');
  }

  const quality = assessFaceQuality(faceData, video);
  
  if (quality.quality < 50) {
    throw new Error(`Face quality too low: ${quality.issues.join(', ')}`);
  }

  return {
    embedding: faceData.descriptor,
    quality: quality.quality,
    confidence: faceData.confidence,
    box: faceData.box
  };
};

/**
 * Compare two face embeddings using cosine similarity
 */
export const compareFaceEmbeddings = (embedding1, embedding2, threshold = 0.6) => {
  if (!embedding1 || !embedding2) {
    return { match: false, similarity: 0, error: 'Invalid embeddings' };
  }

  if (embedding1.length !== embedding2.length) {
    return { match: false, similarity: 0, error: 'Embedding dimension mismatch' };
  }

  // Calculate cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

  return {
    match: similarity >= threshold,
    similarity: similarity,
    threshold: threshold
  };
};

/**
 * Create face embedding from image data URL
 */
export const createEmbeddingFromImage = async (imageDataUrl) => {
  if (!modelsLoaded) {
    throw new Error('Face detection models not loaded');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          reject(new Error('No face detected in image'));
          return;
        }

        resolve({
          embedding: Array.from(detection.descriptor),
          confidence: detection.detection.score,
          box: detection.detection.box
        });
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
};

/**
 * Start continuous face scanning with guidance
 * Provides smartphone-like Face ID experience
 */
export const startFaceScanning = (video, onDetection, onGuidance, options = {}) => {
  const {
    interval = 200,
    requiredDetections = 5,
    qualityThreshold = 60
  } = options;

  let detectionCount = 0;
  let consecutiveDetections = 0;
  let currentStep = 0;
  let isRunning = true;

  const scan = async () => {
    if (!isRunning || !video) return;

    try {
      const faceData = await detectFace(video);
      
      if (faceData) {
        const quality = assessFaceQuality(faceData, video);
        
        if (quality.quality >= qualityThreshold) {
          consecutiveDetections++;
          detectionCount++;
          
          if (onDetection) {
            onDetection({
              faceData,
              quality,
              consecutiveDetections,
              detectionCount,
              step: currentStep
            });
          }
          
          // Move to next step after required detections
          if (consecutiveDetections >= requiredDetections) {
            currentStep++;
            consecutiveDetections = 0;
          }
        } else {
          consecutiveDetections = 0;
        }
      } else {
        consecutiveDetections = 0;
      }

      // Provide guidance
      if (onGuidance) {
        const guidance = getFaceGuidance(faceData, video, currentStep);
        onGuidance(guidance);
      }

      if (isRunning) {
        setTimeout(scan, interval);
      }
    } catch (error) {
      console.error('[FaceScanner] Scan error:', error);
      if (isRunning) {
        setTimeout(scan, interval);
      }
    }
  };

  // Start scanning
  scan();

  // Return stop function
  return () => {
    isRunning = false;
  };
};

/**
 * Capture face samples from video (legacy function for compatibility)
 * @param {HTMLVideoElement} video - Video element
 * @param {number} sampleCount - Number of samples to capture (default: 5)
 * @returns {Promise<Object>} Object with primaryDataUrl and featureSamples
 */
export const captureFaceSamples = async (video, sampleCount = 5) => {
  if (!modelsLoaded) {
    throw new Error('Face detection models not loaded');
  }

  const samples = [];
  let primaryDataUrl = null;

  for (let i = 0; i < sampleCount; i++) {
    try {
      const faceData = await detectFace(video);
      
      if (faceData) {
        const quality = assessFaceQuality(faceData, video);
        
        if (quality.quality >= 60) {
          const frame = captureFrame(video);
          const embedding = faceData.descriptor;
          
          samples.push(embedding);
          
          if (!primaryDataUrl) {
            primaryDataUrl = frame;
          }
          
          // Wait before next capture
          if (i < sampleCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    } catch (error) {
      console.error(`[FaceCapture] Sample ${i + 1} error:`, error);
    }
  }

  if (samples.length === 0) {
    throw new Error('Failed to capture any face samples');
  }

  return {
    primaryDataUrl,
    featureSamples: samples
  };
};

const faceCaptureUtils = {
  loadFaceApiModels,
  areModelsLoaded,
  detectFace,
  assessFaceQuality,
  getFaceGuidance,
  captureFrame,
  extractFaceEmbedding,
  compareFaceEmbeddings,
  createEmbeddingFromImage,
  startFaceScanning,
  captureFaceSamples
};

export default faceCaptureUtils;
