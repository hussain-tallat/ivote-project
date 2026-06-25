import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { startRegistration } from '@simplewebauthn/browser';
import { API_BASE } from '../config/api';
import '../styles/BiometricSetup.css';
import {
  loadFaceApiModels,
  startFaceScanning,
  captureFrame
} from '../utils/faceCapture';

const BiometricSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [faceEnabled, setFaceEnabled] = useState(false);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [isProcessingFingerprint, setIsProcessingFingerprint] = useState(false);
  const [isProcessingFace, setIsProcessingFace] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  // Face capture state
  const [faceCapture, setFaceCapture] = useState({
    samples: [],
    currentAngle: 0,
    isCapturing: false,
    faceDetected: false,
    progress: 0,
    quality: 0,
    guidance: null,
    consecutiveDetections: 0
  });
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stopScanningRef = useRef(null);
  const isCapturingSampleRef = useRef(false);
  const isSubmittingFaceRef = useRef(false);

  // Load face-api.js models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        await loadFaceApiModels();
        setModelsLoaded(true);
        console.log('[BiometricSetup] Face detection models loaded');
      } catch (error) {
        console.error('[BiometricSetup] Failed to load models:', error);
        setError('Failed to load face detection models. Please refresh the page.');
      }
    };
    loadModels();
  }, []);

  // Get email from registration flow
  useEffect(() => {
    const storedEmail = localStorage.getItem('tempRegistrationEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (stopScanningRef.current) {
        stopScanningRef.current();
      }
    };
  }, []);

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // ========== FINGERPRINT REGISTRATION ==========
  const startFingerprintRegistration = async () => {
    setIsProcessingFingerprint(true);
    setError('');
    
    try {
      const token = localStorage.getItem('tempToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No temporary token found. Please complete registration first.');
      }

      // Get registration challenge from backend
      const challengeResponse = await fetch(`${API_BASE}/api/auth/biometric/register-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'fingerprint' })
      });

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get registration challenge');
      }

      const challengeData = await challengeResponse.json();
      if (!challengeData.success || !challengeData.options) {
        throw new Error('Invalid challenge data');
      }

      // Start WebAuthn registration - triggers native OS biometric prompt
      const credential = await startRegistration({ optionsJSON: challengeData.options });

      if (!credential) {
        throw new Error('Failed to create credentials');
      }

      // Verify registration with backend
      const verifyResponse = await fetch(`${API_BASE}/api/auth/biometric/register-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          credential: credential,
          type: 'fingerprint'
        })
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        setFingerprintEnabled(true);
        setStep(2);
        showMessage('✅ Fingerprint registered successfully!');
        
        // Check if both biometrics are complete
        if (faceEnabled) {
          showMessage('✅ Both biometrics registered! You can now proceed to security questions.');
          setTimeout(() => navigate('/security-questions', { state: { email } }), 1500);
        }
      } else {
        throw new Error(verifyData.message || 'Fingerprint registration failed');
      }
    } catch (err) {
      console.error('[Fingerprint] Registration error:', err);
      showMessage(err.message || 'Fingerprint registration failed', true);
    } finally {
      setIsProcessingFingerprint(false);
    }
  };

  const handleFingerprintRegister = () => {
    setShowFingerprintModal(true);
  };

  const handleConfirmFingerprint = () => {
    setShowFingerprintModal(false);
    startFingerprintRegistration();
  };

  // ========== FACE REGISTRATION ==========
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('[Face] Camera error:', err);
      showMessage('Failed to access camera. Please check permissions.', true);
      throw err;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (stopScanningRef.current) {
      stopScanningRef.current();
      stopScanningRef.current = null;
    }
  };

  const handleFaceRegister = async () => {
    if (!modelsLoaded) {
      showMessage('Face detection models are still loading. Please wait...', true);
      return;
    }

    setShowFaceModal(true);
    isCapturingSampleRef.current = false;
    isSubmittingFaceRef.current = false;
    setFaceCapture({
      samples: [],
      currentAngle: 0,
      isCapturing: false,
      faceDetected: false,
      progress: 0,
      quality: 0,
      guidance: null,
      consecutiveDetections: 0
    });
    
    try {
      await startCamera();
      startFaceCapture();
    } catch (error) {
      console.error('[Face] Failed to start camera:', error);
    }
  };

  const startFaceCapture = async () => {
    setIsProcessingFace(true);
    setFaceCapture(prev => ({ ...prev, isCapturing: true }));
    
    try {
      const samples = [];
      const requiredSamples = 5;
      let lastCaptureStep = -1;
      
      // Start continuous face scanning
      const stopScanning = startFaceScanning(
        videoRef.current,
        // On detection callback
        (detectionData) => {
          const { faceData, quality, consecutiveDetections, step, detectionCount } = detectionData;
          
          setFaceCapture(prev => ({
            ...prev,
            faceDetected: true,
            quality: quality.quality,
            consecutiveDetections,
            currentAngle: step
          }));
          
          // Log detection state for debugging
          if (detectionCount % 10 === 0) {
            console.log('[BiometricSetup] Step:', step, '| DetCount:', detectionCount, '| ConsecDet:', consecutiveDetections, '| Quality:', quality.quality, '| Samples:', samples.length);
          }
          
          // Simple trigger: capture once per step when we have good quality detections
          const shouldCapture =
            samples.length < requiredSamples &&
            step !== lastCaptureStep &&  // Haven't captured at this step yet
            consecutiveDetections >= 5 &&  // High quality threshold reached
            quality.quality >= 60 &&  // Overall quality good
            !isCapturingSampleRef.current &&
            !isSubmittingFaceRef.current;
          
          if (shouldCapture) {
            console.log('[BiometricSetup] TRIGGER CAPTURE | Step:', step, '| Sample:', samples.length + 1, '/', requiredSamples);
            lastCaptureStep = step;
            captureFaceSample(faceData, quality, samples, requiredSamples);
          }
        },
        // On guidance callback
        (guidance) => {
          setFaceCapture(prev => ({
            ...prev,
            guidance: guidance
          }));
        },
        {
          interval: 200,
          requiredDetections: 5,
          qualityThreshold: 60
        }
      );
      
      stopScanningRef.current = stopScanning;
      
    } catch (err) {
      console.error('[Face] Capture error:', err);
      showMessage('Failed to capture face. Please try again.', true);
      setIsProcessingFace(false);
      setFaceCapture(prev => ({ ...prev, isCapturing: false }));
    }
  };

  const captureFaceSample = async (faceData, qualityData, samples, requiredSamples) => {
    if (isCapturingSampleRef.current || isSubmittingFaceRef.current) {
      console.warn('[Face] Capture ignored - already processing', { 
        isCapturing: isCapturingSampleRef.current, 
        isSubmitting: isSubmittingFaceRef.current 
      });
      return;
    }

    isCapturingSampleRef.current = true;
    console.log('[Face] Sample capture started', { sampleNum: samples.length + 1, total: requiredSamples });

    try {
      const video = videoRef.current;
      const frame = captureFrame(video);
      const embedding = faceData.descriptor;

      samples.push({ frame, embedding });

      const progress = Math.round((samples.length / requiredSamples) * 100);
      console.log('[Face] Sample captured | Progress:', progress + '%');

      setFaceCapture(prev => ({
        ...prev,
        samples: [...samples],
        progress,
        guidance: progress >= 100
          ? { icon: '⏳', message: 'Submitting face profile...', instruction: 'Please wait while we securely save your face encoding' }
          : prev.guidance
      }));

      if (samples.length >= requiredSamples) {
        console.log('[Face] All samples captured, triggering submission');
        isSubmittingFaceRef.current = true;

        // Stop scanning before submission
        if (stopScanningRef.current) {
          stopScanningRef.current();
          stopScanningRef.current = null;
        }

        await submitFaceData(samples, qualityData?.quality || 0);
      } else {
        // Wait before next capture
        console.log('[Face] Waiting for next sample capture...');
        await new Promise(r => setTimeout(r, 900));
      }
    } catch (error) {
      console.error('[Face] Sample capture error:', error);
    } finally {
      if (!isSubmittingFaceRef.current) {
        isCapturingSampleRef.current = false;
      }
    }
  };

  const submitFaceData = async (samples, qualityScore = 0) => {
    try {
      const token = localStorage.getItem('tempToken') || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('[Face] Submitting face data | Samples:', samples.length, '| Quality:', qualityScore);
      
      // Calculate average embedding from all samples
      const embeddings = samples.map(s => s.embedding);
      const avgEmbedding = embeddings[0].map((_, i) => 
        embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
      );
      
      console.log('[Face] Embeddings calculated | Avg embedding length:', avgEmbedding.length);
      
      const response = await fetch(`${API_BASE}/api/auth/face/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          faceFeatures: avgEmbedding,
          faceSamples: embeddings,
          quality: qualityScore
        })
      });

      const data = await response.json();
      console.log('[Face] Submission response:', { status: response.status, success: data.success, message: data.message });

      if (data.success) {
        console.log('[Face] Face registration successful!');
        setFaceEnabled(true);
        stopCamera();
        setShowFaceModal(false);
        setStep(3);
        showMessage('✅ Face registered successfully!');
        
        // Check if both biometrics are complete
        if (fingerprintEnabled) {
          showMessage('✅ Both biometrics registered! You can now proceed to security questions.');
          setTimeout(() => navigate('/security-questions', { state: { email } }), 1500);
        }
      } else {
        throw new Error(data.message || 'Face registration failed');
      }
    } catch (err) {
      console.error('[Face] Submit error:', err);
      showMessage(err.message || 'Failed to submit face data', true);
    } finally {
      isCapturingSampleRef.current = false;
      isSubmittingFaceRef.current = false;
      setIsProcessingFace(false);
      setFaceCapture(prev => ({ ...prev, isCapturing: false }));
    }
  };

  const handleCloseFaceModal = () => {
    isCapturingSampleRef.current = false;
    isSubmittingFaceRef.current = false;
    stopCamera();
    setShowFaceModal(false);
    setIsProcessingFace(false);
    setFaceCapture({
      samples: [],
      currentAngle: 0,
      isCapturing: false,
      faceDetected: false,
      progress: 0,
      quality: 0,
      guidance: null,
      consecutiveDetections: 0
    });
  };

  // ========== SKIP BIOMETRICS ==========
  // Removed - biometrics are now mandatory

  return (
    <div className="biometric-setup-container">
      <div className="biometric-setup-card">
        <div className="biometric-header">
          <h1>Biometric Setup</h1>
          <p>Secure your account with fingerprint and face recognition</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="biometric-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${fingerprintEnabled ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Fingerprint</span>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${faceEnabled ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Face</span>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Security</span>
          </div>
        </div>

        <div className="biometric-options">
          {/* Fingerprint Option */}
          <div className={`biometric-option ${fingerprintEnabled ? 'completed' : ''}`}>
            <div className="option-icon fingerprint-icon">
              <div className="icon-inner"></div>
              <img src="/assets/finger.png" alt="Fingerprint Logo" className="biometric-logo" />
            </div>
            <div className="option-content">
              <h3>Fingerprint Recognition</h3>
              <p>Use your device's fingerprint sensor for quick and secure login</p>
              {fingerprintEnabled ? (
                <span className="status-badge success">✓ Registered</span>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleFingerprintRegister}
                  disabled={isProcessingFingerprint}
                >
                  {isProcessingFingerprint ? 'Processing...' : 'Register Fingerprint'}
                </button>
              )}
            </div>
          </div>

          {/* Face Option */}
          <div className={`biometric-option ${faceEnabled ? 'completed' : ''}`}>
            <div className="option-icon face-icon">
              <div className="icon-inner"></div>
              <img src="/assets/face.webp" alt="Face Logo" className="biometric-logo" />
            </div>
            <div className="option-content">
              <h3>Face Recognition</h3>
              <p>Use your camera for secure face-based authentication</p>
              {faceEnabled ? (
                <span className="status-badge success">✓ Registered</span>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleFaceRegister}
                  disabled={isProcessingFace || !modelsLoaded}
                >
                  {!modelsLoaded ? 'Loading Models...' : isProcessingFace ? 'Processing...' : 'Register Face'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="biometric-actions">
          {(fingerprintEnabled && faceEnabled) && (
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/security-questions', { state: { email } })}
            >
              Continue to Security Questions
            </button>
          )}
        </div>
      </div>

      {/* Fingerprint Modal */}
      {showFingerprintModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Fingerprint Registration</h2>
              <button className="modal-close" onClick={() => setShowFingerprintModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="fingerprint-instruction">
                <div className="fingerprint-icon">
                  <div className="icon-inner" style={{ width: '80px', height: '80px', margin: '0 auto 24px' }}></div>
                </div>
                <p>Your device will prompt you to use your fingerprint sensor.</p>
                <p className="instruction-sub">This uses Windows Hello or your device's native biometric system.</p>
                <p className="instruction-sub">No fingerprint image is stored - only a secure cryptographic credential.</p>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowFingerprintModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleConfirmFingerprint}>Continue</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Face Modal */}
      {showFaceModal && (
        <div className="modal-overlay">
          <div className="modal-content face-modal">
            <div className="modal-header">
              <h2>Face Registration</h2>
              <button className="modal-close" onClick={handleCloseFaceModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="face-capture-container">
                <div className="video-wrapper">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="face-video"
                  />
                  <div className={`face-overlay ${faceCapture.faceDetected ? 'detected' : ''}`}>
                    <div className="face-guide"></div>
                  </div>
                </div>
                
                <div className="face-status">
                  {faceCapture.guidance && (
                    <div className="guidance-message">
                      <span className="guidance-icon">{faceCapture.guidance.icon}</span>
                      <span className="guidance-text">{faceCapture.guidance.message}</span>
                    </div>
                  )}
                  
                  {faceCapture.guidance?.instruction && (
                    <div className="guidance-instruction">
                      <p>{faceCapture.guidance.instruction}</p>
                    </div>
                  )}
                  
                  <div className="quality-indicator">
                    <div className="quality-bar">
                      <div 
                        className="quality-fill" 
                        style={{ width: `${faceCapture.quality}%` }}
                      ></div>
                    </div>
                    <span className="quality-text">Quality: {faceCapture.quality}%</span>
                  </div>
                  
                  <div className="progress-indicator">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${faceCapture.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {faceCapture.samples.length} / 5 samples captured
                    </span>
                  </div>
                </div>
                
                <div className="face-instructions">
                  <p>📱 Position your face in the oval frame</p>
                  <p>💡 Ensure good lighting on your face</p>
                  <p>👀 Follow the on-screen instructions</p>
                  <p>🔄 Move your head slowly as instructed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiometricSetupPage;
