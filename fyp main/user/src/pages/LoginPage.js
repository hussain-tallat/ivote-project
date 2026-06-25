import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { startAuthentication } from '@simplewebauthn/browser';
import { API_BASE } from '../config/api';
import '../styles/LoginPage.css';
import {
  loadFaceApiModels,
  startFaceScanning
} from '../utils/faceCapture';

const LoginPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stopScanningRef = useRef(null);

  const [step, setStep] = useState(1);
  const [infoMessage, setInfoMessage] = useState('');
  const [biometricChecks, setBiometricChecks] = useState({ fingerprintVerified: false, faceVerified: false });
  const [formData, setFormData] = useState({ identifier: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceMismatchWarning, setFaceMismatchWarning] = useState('');
  const [scanStatus, setScanStatus] = useState({ 
    status: 'idle', 
    message: '',
    faceDetected: false,
    progress: 0,
    quality: 0,
    guidance: null
  });

  // Load face-api.js models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        await loadFaceApiModels();
        setModelsLoaded(true);
        console.log('[LoginPage] Face detection models loaded');
      } catch (error) {
        console.error('[LoginPage] Failed to load models:', error);
      }
    };
    loadModels();
  }, []);

  const stopCamera = () => {
    if (stopScanningRef.current) {
      stopScanningRef.current();
      stopScanningRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setScanStatus({ status: 'idle', message: '', faceDetected: false, progress: 0, quality: 0, guidance: null });
  };

  useEffect(() => () => stopCamera(), []);

  const completeBiometricLogin = useCallback(async (token, welcomeMsg = '') => {
    try {
      const userResponse = await fetch(`${API_BASE}/api/auth/me`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(userData.user));
      sessionStorage.setItem('loginSuccessMessage', welcomeMsg || `Welcome, ${userData.user?.name || 'Voter'}! 👋`);

      if (userData.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/user-dashboard');
    } catch (error) {
      console.error('[Login] Error completing biometric login:', error);
      setErrors({ general: 'Failed to complete login. Please try again.' });
    }
  }, [navigate]);

  const verifyFingerprint = async () => {
    setIsLoggingIn(true);
    setErrors({});
    setInfoMessage('Please use your fingerprint sensor...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Session expired. Please login again.');

      // Get authentication options from backend
      const optionsRes = await fetch(`${API_BASE}/api/auth/biometric/auth-options`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ type: 'fingerprint' })
      });
      
      if (!optionsRes.ok) {
        const errorData = await optionsRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get authentication options');
      }
      
      const optionsData = await optionsRes.json();
      if (!optionsData.success || !optionsData.options) {
        throw new Error(optionsData.message || 'Invalid authentication options');
      }

      // Start WebAuthn authentication - triggers native OS biometric prompt
      const assertion = await startAuthentication({ optionsJSON: optionsData.options });
      
      if (!assertion) {
        throw new Error('Fingerprint authentication cancelled');
      }

      // Verify with backend
      const verifyResponse = await fetch(`${API_BASE}/api/auth/biometric/auth-verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          credential: assertion, 
          type: 'fingerprint' 
        })
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Fingerprint verification failed');
      }
      
      const verifyData = await verifyResponse.json();
      if (!verifyData.success) {
        throw new Error(verifyData.message || 'Fingerprint verification failed');
      }

      setBiometricChecks((prev) => ({ ...prev, fingerprintVerified: true }));

      if (verifyData.mfaVerified) {
        const welcomeMsg = `Welcome, ${verifyData.userName || 'Voter'}! 👋`;
        setInfoMessage('Fingerprint and face verified successfully.');
        await completeBiometricLogin(token, welcomeMsg);
      } else {
        setInfoMessage('Fingerprint verified. Please complete face verification to finish login.');
      }
    } catch (error) {
      console.error('[Fingerprint] Verification error:', error);
      setErrors({ general: error.message || 'Fingerprint verification failed' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const startFaceCamera = async () => {
    if (!modelsLoaded) {
      setErrors({ general: 'Face detection models are still loading. Please wait...' });
      return;
    }

    setErrors({});
    setFaceMismatchWarning('');
    setScanStatus({ 
      status: 'starting', 
      message: 'Initializing camera...', 
      faceDetected: false, 
      progress: 0,
      quality: 0,
      guidance: null
    });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      streamRef.current = stream;

      // Trigger render of the video element first; stream will be attached in effect.
      setCameraActive(true);

      // Ensure the video area is scrolled into view smoothly on smaller screens
      setTimeout(() => {
        try {
          if (videoRef.current && typeof videoRef.current.scrollIntoView === 'function') {
            videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } catch (e) {
          // ignore
        }
      }, 100);
    } catch (error) {
      console.error('[Face] Camera error:', error);
      setErrors({ general: 'Cannot access camera: ' + error.message });
    }
  };

  const handleRetryFaceScan = async () => {
    setFaceMismatchWarning('');
    setErrors({});
    await startFaceCamera();
  };

  const verifyFaceWithBackend = useCallback(async (embeddingOrSamples) => {
    const samples = Array.isArray(embeddingOrSamples?.[0])
      ? embeddingOrSamples
      : [embeddingOrSamples];
    const primaryEmbedding = samples[0];

    setScanStatus((prev) => ({ 
      ...prev,
      status: 'capturing', 
      message: 'Verifying face...', 
      faceDetected: true, 
      progress: 100,
      guidance: null
    }));
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Session expired. Please login again.');
      }
      
      const response = await fetch(`${API_BASE}/api/auth/face/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          faceFeatures: primaryEmbedding,
          faceSamples: samples
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiError = new Error(data.message || 'Face verification failed');
        apiError.code = data.errorCode;
        throw apiError;
      }

      if (data.success) {
        setBiometricChecks((prev) => ({ ...prev, faceVerified: true }));
        setFaceMismatchWarning('');
        stopCamera();

        if (data.mfaVerified) {
          const welcomeMsg = `Welcome, ${data.userName || 'Voter'}! 👤`;
          setInfoMessage('Fingerprint and face verified successfully.');
          await completeBiometricLogin(token, welcomeMsg);
        } else {
          setInfoMessage('Face verified. Please verify fingerprint to finish login.');
        }
      } else {
        throw new Error(data.message || 'Face verification failed');
      }
    } catch (error) {
      console.error('[Face] Verification error:', error);
      setErrors({ general: error.message || 'Face verification failed' });

      const isUnregisteredFace = error?.code === 'UNREGISTERED_FACE';
      setScanStatus({ 
        status: 'error', 
        message: isUnregisteredFace
          ? 'No face match found. Please use your registered face.'
          : (error.message || 'Face verification failed'), 
        faceDetected: false, 
        progress: 0,
        quality: 0,
        guidance: null
      });

      if (isUnregisteredFace) {
        stopCamera();
        setFaceMismatchWarning('No match found for this face. Please try again with your registered face.');
      } else {
        setFaceMismatchWarning('');
        // Keep scan alive for recoverable issues (pose, blur, transient camera/network issues).
        if (stopScanningRef.current) {
          stopScanningRef.current();
          stopScanningRef.current = null;
        }
      }
    }
  }, [completeBiometricLogin]);

  const startAutomaticFaceDetection = useCallback(() => {
    let consecutiveDetections = 0;
    let capturedEmbedding = null;
    const capturedEmbeddings = [];
    
    // Start continuous face scanning
    const stopScanning = startFaceScanning(
      videoRef.current,
      // On detection callback
      async (detectionData) => {
        const { faceData, quality, consecutiveDetections: count } = detectionData;
        
        consecutiveDetections = count;
        capturedEmbedding = faceData.descriptor;
        capturedEmbeddings.push(faceData.descriptor);
        if (capturedEmbeddings.length > 6) {
          capturedEmbeddings.shift();
        }
        
        setScanStatus(prev => ({ 
          ...prev, 
          status: 'detected',
          faceDetected: true,
          message: 'Face detected! Hold still...',
          progress: Math.min(consecutiveDetections * 20, 100),
          quality: quality.quality
        }));
        
        // Auto-capture after 5 consecutive detections
        if (consecutiveDetections >= 5 && capturedEmbedding) {
          if (capturedEmbeddings.length < 4) {
            return;
          }

          if (stopScanningRef.current) {
            stopScanningRef.current();
            stopScanningRef.current = null;
          }

          await verifyFaceWithBackend(capturedEmbeddings.slice(-4));
        }
      },
      // On guidance callback
      (guidance) => {
        setScanStatus(prev => ({
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
  }, [verifyFaceWithBackend]);

  const attachStreamToVideo = useCallback(async () => {
    const videoEl = videoRef.current;
    const stream = streamRef.current;

    if (!videoEl || !stream) return;

    videoEl.srcObject = stream;

    try {
      await videoEl.play();
    } catch (error) {
      console.warn('[Face] Video play() was interrupted, retrying on metadata...', error?.message || error);
    }

    setScanStatus({
      status: 'ready',
      message: 'Position your face in the frame',
      faceDetected: false,
      progress: 0,
      quality: 0,
      guidance: null
    });

    startAutomaticFaceDetection();
  }, [startAutomaticFaceDetection]);

  useEffect(() => {
    if (!cameraActive || !streamRef.current) return;

    // Wait for conditional render to mount <video>, then attach stream.
    const timer = setTimeout(() => {
      attachStreamToVideo();
    }, 0);

    return () => clearTimeout(timer);
  }, [cameraActive, attachStreamToVideo]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('tempToken', data.token);
        
        if (data.requiresBiometric) {
          setBiometricChecks({ fingerprintVerified: false, faceVerified: false });
          setStep(2);
          setInfoMessage('Please verify both fingerprint and face to continue.');
        } else {
          await completeBiometricLogin(data.token, `Welcome, ${data.user?.name || 'Voter'}! 👋`);
        }
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      setErrors({ general: error.message || 'Login failed. Please try again.' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        {errors.general && <div className="alert alert-error">{errors.general}</div>}
        {infoMessage && <div className="alert alert-info">{infoMessage}</div>}

        {step === 1 && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="identifier">Email or CNIC</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                placeholder="Enter your email or CNIC"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                />
                Remember me
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="login-links">
              <Link to="/forgot-password">Forgot Password?</Link>
              <Link to="/register">Don't have an account? Register</Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="biometric-verification">
            <h2>Biometric Verification</h2>
            <p>Both fingerprint and face verification are required to continue.</p>

            {faceMismatchWarning && (
              <div className="face-mismatch-banner" role="alert">
                <div className="face-mismatch-text">{faceMismatchWarning}</div>
                <button
                  type="button"
                  className="btn btn-warning face-mismatch-retry"
                  onClick={handleRetryFaceScan}
                  disabled={isLoggingIn || !modelsLoaded || cameraActive}
                >
                  Start Face Scan Again
                </button>
              </div>
            )}

            <div className="biometric-options">
              {/* Fingerprint Option */}
              <div className="biometric-option">
                <div className="option-icon fingerprint-icon">
                  <div className="icon-inner"></div>
                  <img src="/assets/finger.png" alt="Fingerprint logo" className="biometric-logo" />
                </div>
                <div className="option-content">
                  <h3>Fingerprint</h3>
                  <p>Use your device's fingerprint sensor</p>
                  {biometricChecks.fingerprintVerified ? (
                    <div className="alert alert-success">Fingerprint verified</div>
                  ) : null}
                  <button 
                    className="btn btn-primary"
                    onClick={verifyFingerprint}
                    disabled={isLoggingIn || biometricChecks.fingerprintVerified}
                  >
                    {isLoggingIn ? 'Verifying...' : 'Use Fingerprint'}
                  </button>
                </div>
              </div>

              {/* Face Option */}
              <div className="biometric-option">
                <div className="option-icon face-icon">
                  <div className="icon-inner"></div>
                  <img src="/assets/face.webp" alt="Face logo" className="biometric-logo" />
                </div>
                <div className="option-content">
                  <h3>Face Recognition</h3>
                  <p>Use your camera for face verification</p>
                  {biometricChecks.faceVerified ? (
                    <div className="alert alert-success">Face verified</div>
                  ) : null}
                  {!cameraActive ? (
                    <button 
                      className="btn btn-primary"
                      onClick={startFaceCamera}
                      disabled={isLoggingIn || !modelsLoaded || biometricChecks.faceVerified}
                    >
                      {!modelsLoaded ? 'Loading Models...' : 'Start Face Scan'}
                    </button>
                  ) : (
                    <button 
                      className="btn btn-secondary"
                      onClick={stopCamera}
                    >
                      Cancel Scan
                    </button>
                  )}
                </div>
              </div>
            </div>

            {cameraActive && (
              <div className="face-scan-container">
                <div className="video-wrapper">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="face-video"
                  />
                  <div className={`face-overlay ${scanStatus.faceDetected ? 'detected' : ''}`}>
                    <div className="face-guide"></div>
                  </div>
                </div>
                
                <div className="scan-status">
                  {scanStatus.guidance && (
                    <div className="guidance-message">
                      <span className="guidance-icon">{scanStatus.guidance.icon}</span>
                      <span className="guidance-text">{scanStatus.guidance.message}</span>
                    </div>
                  )}
                  
                  {scanStatus.guidance?.instruction && (
                    <div className="guidance-instruction">
                      <p>{scanStatus.guidance.instruction}</p>
                    </div>
                  )}
                  
                  <div className="quality-indicator">
                    <div className="quality-bar">
                      <div 
                        className="quality-fill" 
                        style={{ width: `${scanStatus.quality}%` }}
                      ></div>
                    </div>
                    <span className="quality-text">Quality: {scanStatus.quality}%</span>
                  </div>
                  
                  <div className="progress-indicator">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${scanStatus.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {scanStatus.status === 'detected' ? 'Hold still...' : 'Scanning...'}
                    </span>
                  </div>
                </div>
                
                <div className="face-instructions">
                  <p>📱 Position your face in the oval frame</p>
                  <p>💡 Ensure good lighting on your face</p>
                  <p>👀 Look directly at the camera</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
