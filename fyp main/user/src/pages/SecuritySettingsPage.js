import React, { useEffect, useRef, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { API_BASE } from '../config/api';
import { captureFaceSamples } from '../utils/faceCapture';

const panelSurface = {
  background: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 28,
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.10)'
};

const SecuritySettingsPage = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyType, setBusyType] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    const attachStream = async () => {
      if (cameraActive && videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }
    };
    attachStream();
  }, [cameraActive]);

  const startFaceCamera = async () => {
    setError('');
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      setError('Cannot access camera: ' + err.message);
    }
  };

  const updateFingerprint = async () => {
    setMessage('');
    setError('');
    setBusyType('fingerprint');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login first.');

      // Get registration challenge from backend
      const challengeRes = await fetch(`${API_BASE}/api/auth/biometric/register-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!challengeRes.ok) {
        const errorData = await challengeRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get registration challenge');
      }

      const challengeData = await challengeRes.json();
      if (!challengeData.success || !challengeData.options) {
        throw new Error('Invalid challenge data');
      }

      // Start WebAuthn registration - triggers native OS biometric prompt
      const credential = await startRegistration({ optionsJSON: challengeData.options });

      if (!credential) {
        throw new Error('Registration cancelled');
      }

      // Verify registration with backend
      const verifyRes = await fetch(`${API_BASE}/api/auth/biometric/register-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          credential: credential,
          type: 'fingerprint'
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || 'Fingerprint registration failed');
      }

      localStorage.removeItem('recoveryLogin');
      setMessage('✅ Fingerprint credential updated successfully. Your device is now registered for biometric login.');
    } catch (err) {
      setError(err.message || 'Fingerprint update failed');
    } finally {
      setBusyType('');
    }
  };

  const updateFace = async () => {
    setMessage('');
    setError('');
    setBusyType('face');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login first.');
      if (!videoRef.current) throw new Error('Camera is not ready.');

      const { primaryDataUrl, featureSamples } = await captureFaceSamples(videoRef.current);

      const res = await fetch(`${API_BASE}/api/auth/face/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          faceData: primaryDataUrl,
          faceFeatures: featureSamples[0],
          faceSamples: featureSamples
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update face scan.');
      }

      stopCamera();
      localStorage.removeItem('recoveryLogin');
      setMessage(`✅ Face profile updated successfully. ${data.faceSamplesCaptured || featureSamples.length} encrypted face samples were saved securely.`);
    } catch (err) {
      setError(err.message || 'Face update failed');
    } finally {
      setBusyType('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '40px 20px' }}>
      <div className="container" style={{ maxWidth: 1080 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: 12 }}>🔐 Security Settings</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
            Update your fingerprint credential and re-scan your face profile with guided capture. The system stores encrypted representations only, never raw fingerprint images.
          </p>
        </div>

        {message && (
          <div style={{ background: '#dcfce7', color: '#166534', padding: 16, borderRadius: 12, marginBottom: 24, textAlign: 'center', fontWeight: 600 }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 16, borderRadius: 12, marginBottom: 24, textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Fingerprint Section */}
          <div style={{ ...panelSurface, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, color: '#0f172a' }}>👆 Fingerprint</h2>
              <span style={{ color: '#0f766e', fontWeight: 800 }}>Device Credential</span>
            </div>
            <p style={{ color: '#64748b', marginBottom: 18, lineHeight: 1.7 }}>
              Use the laptop sensor or Windows Hello prompt. This refreshes the cryptographic credential tied to your fingerprint-capable device.
            </p>

            <div
              style={{
                marginBottom: 18,
                borderRadius: 24,
                minHeight: 230,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(180deg, #ecfeff 0%, #f8fafc 100%)',
                border: '1px solid #cbd5e1',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ textAlign: 'center', padding: 24 }}>
                <div style={{ width: 108, height: 108, borderRadius: '50%', margin: '0 auto 16px', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle, rgba(15,118,110,0.16), rgba(15,118,110,0.04) 60%, transparent 72%)' }}>
                  <span style={{ fontSize: 44 }}>🔐</span>
                </div>
                <div style={{ color: '#475569', maxWidth: 300 }}>
                  Click the button below to trigger your device's native biometric prompt (Windows Hello, Touch ID, etc.)
                </div>
              </div>
            </div>

            <button
              onClick={updateFingerprint}
              disabled={Boolean(busyType)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0f766e, #065f46)',
                color: 'white',
                border: 'none',
                borderRadius: 16,
                padding: '15px 18px',
                fontWeight: 800,
                cursor: busyType ? 'not-allowed' : 'pointer'
              }}
            >
              {busyType === 'fingerprint' ? 'Updating Fingerprint...' : 'Update Fingerprint'}
            </button>
          </div>

          {/* Face Recognition Section */}
          <div style={{ ...panelSurface, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, color: '#0f172a' }}>👤 Face Recognition</h2>
              <span style={{ color: '#1d4ed8', fontWeight: 800 }}>Encrypted Embeddings</span>
            </div>
            <p style={{ color: '#64748b', marginBottom: 14, lineHeight: 1.7 }}>
              Rebuild the secure face profile using guided webcam capture. Keep your face centered with clear lighting and follow the scan positions.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {['Straight', 'Slight Left', 'Slight Right', 'Clear Lighting'].map((tip) => (
                <span
                  key={tip}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontWeight: 700,
                    fontSize: 12
                  }}
                >
                  {tip}
                </span>
              ))}
            </div>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: 24,
                minHeight: 260,
                display: 'grid',
                placeItems: 'center',
                border: '1px solid #cbd5e1',
                marginBottom: 14,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {cameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 24, borderRadius: 28, border: '2px solid rgba(255,255,255,0.88)', boxShadow: '0 0 0 999px rgba(15,23,42,0.18)' }} />
                  <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, textAlign: 'center', color: 'white', fontWeight: 700, textShadow: '0 2px 12px rgba(15,23,42,0.7)' }}>
                    Keep one face inside the frame while the scanner captures your face.
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ width: 108, height: 108, borderRadius: '50%', margin: '0 auto 16px', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle, rgba(59,130,246,0.16), rgba(59,130,246,0.04) 60%, transparent 72%)' }}>
                    <span style={{ fontSize: 44 }}>👤</span>
                  </div>
                  <div style={{ color: '#475569', maxWidth: 300 }}>
                    Camera preview will appear here. Start the scan and keep your head aligned inside the guide frame.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {!cameraActive ? (
                <button
                  onClick={startFaceCamera}
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    padding: '14px 16px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 14,
                    cursor: 'pointer',
                    flex: 1,
                    fontWeight: 700
                  }}
                >
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={updateFace}
                  disabled={busyType === 'face'}
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                    color: 'white',
                    padding: '14px 16px',
                    border: 'none',
                    borderRadius: 14,
                    cursor: busyType === 'face' ? 'not-allowed' : 'pointer',
                    flex: 1,
                    fontWeight: 700
                  }}
                >
                  {busyType === 'face' ? 'Capturing Face...' : 'Capture Face'}
                </button>
              )}
              {cameraActive && (
                <button
                  onClick={stopCamera}
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    padding: '14px 16px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 14,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
