import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startRegistration } from '@simplewebauthn/browser';
import { API_BASE } from '../config/api';

const FaceRecognitionPage = () => {
  const navigate = useNavigate();

  const [isCapturing, setIsCapturing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('⚠️ Please complete OTP verification first.');
      return;
    }

    if (!window.PublicKeyCredential || !navigator.credentials) {
      setErrorMessage('WebAuthn is not supported on this browser/device.');
    }
  }, []);

  const handleCaptureFace = async () => {
    const proceed = window.confirm(
      'Face step: use only face verification. If Fingerprint or PIN appears, press Cancel and try again.'
    );
    if (!proceed) return;

    setIsCapturing(true);
    setIsFailed(false);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Session expired. Please verify OTP again.');
      const optionsRes = await fetch(`${API_BASE}/api/auth/biometric/register-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'face' })
      });

      const optionsData = await optionsRes.json();
      if (!optionsRes.ok || !optionsData.success) {
        const msg = String(optionsData.message || '').toLowerCase();
        if (msg.includes('fingerprint registration is required')) {
          navigate('/register/fingerprint');
          throw new Error('Fingerprint required now. Do not use face/PIN.');
        }
        throw new Error(optionsData.message || 'Failed to start face enrollment');
      }
      const opts = optionsData.options;
      if (!opts || typeof opts.challenge !== 'string') {
        throw new Error('Invalid WebAuthn registration options from server');
      }

      const attResp = await startRegistration({ optionsJSON: opts });

      const verifyRes = await fetch(`${API_BASE}/api/auth/biometric/register-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ credential: attResp, type: 'face' })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.message || 'Face enrollment failed');
      if (verifyData.registeredType && verifyData.registeredType !== 'face') {
        throw new Error('Face required now. Do not use fingerprint/PIN.');
      }

      setIsSuccess(true);
      setTimeout(() => navigate('/security-questions'), 1500);
    } catch (error) {
      console.error('Face enrollment error:', error);
      setIsFailed(true);
      if (error?.name === 'NotAllowedError') {
        setErrorMessage('Prompt cancelled/denied. Use face only. If fingerprint or PIN appears, cancel and retry.');
      } else if (error?.name === 'TimeoutError') {
        setErrorMessage('Biometric prompt timed out. Try again and complete verification quickly.');
      } else {
        setErrorMessage(error?.message || 'Failed to enroll face. Please try again.');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetry = () => {
    setIsFailed(false);
    setIsSuccess(false);
    setErrorMessage('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 0'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center',
          padding: '2rem'
        }}
      >
        <h1 style={{ color: '#00563B', fontSize: '2rem', marginBottom: '0.5rem' }}>
          Face Recognition Setup
        </h1>
        <p style={{ color: '#666', fontSize: '1rem', marginBottom: '2rem' }}>
          Use device biometric face verification (Windows Hello/Face ID).
        </p>
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#7a5b00',
          padding: '10px 12px',
          borderRadius: '8px',
          marginBottom: '1.2rem',
          border: '1px solid #ffe69c'
        }}>
          Allowed now: <strong>Face only</strong>
        </div>
        <div style={{
          color: '#b42318',
          fontSize: '0.92rem',
          marginBottom: '1.2rem',
          fontWeight: 600
        }}>
          🔒 Blocked methods: Fingerprint/PIN not allowed in this step.
        </div>

        <div style={{ padding: '2rem', border: '2px dashed #e9ecef', borderRadius: '12px', marginBottom: '1.5rem', background: 'white' }}>
          <p style={{ color: '#666' }}>
            Click below and complete the system biometric prompt.
          </p>
          {isCapturing && <p>Starting biometric prompt...</p>}

          {isSuccess && (
            <div>
              <div style={{ fontSize: '4rem', color: '#28a745', marginBottom: '1rem' }}>✓</div>
              <p style={{ color: '#28a745', fontWeight: 'bold' }}>Face registered successfully!</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Redirecting to security questions…</p>
            </div>
          )}

          {isFailed && (
            <div>
              <div style={{ fontSize: '4rem', color: '#dc3545', marginBottom: '1rem' }}>✗</div>
              <p style={{ color: '#dc3545', fontWeight: 600 }}>{errorMessage || 'Face capture failed'}</p>
            </div>
          )}
        </div>

        {!isSuccess && (
          <button
            onClick={handleCaptureFace}
            disabled={isCapturing}
            style={{
              backgroundColor: '#00563B',
              color: 'white',
              padding: '14px 28px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              cursor: isCapturing ? 'not-allowed' : 'pointer',
              opacity: isCapturing ? 0.6 : 1,
              width: '100%'
            }}
          >
            {isCapturing ? 'Starting...' : 'Enroll Face'}
          </button>
        )}

        {isFailed && (
          <button
            onClick={handleRetry}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '14px 28px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              width: '100%',
              marginTop: '10px'
            }}
          >
            Try Again
          </button>
        )}

        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#555', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <p>
            <span style={{ fontSize: '1.2rem' }}>🔒</span> WebAuthn stores cryptographic credentials only. Raw biometric image is not stored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognitionPage;
