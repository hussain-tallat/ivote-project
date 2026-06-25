import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startRegistration } from '@simplewebauthn/browser';
import { API_BASE } from '../config/api';

const FingerprintSetupPage = () => {
  const navigate = useNavigate();

  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('⚠️ Please complete OTP verification first.');
    }
    if (!window.PublicKeyCredential || !navigator.credentials) {
      setErrorMessage('WebAuthn is not supported on this browser/device.');
      return;
    }
    if (!window.isSecureContext) {
      setErrorMessage('⚠️ WebAuthn needs a secure context (HTTPS). On localhost it should still work in modern browsers.');
    }
  }, []);

  const handleEnrollFingerprint = async () => {
    const proceed = window.confirm(
      'Fingerprint step: use only fingerprint on this device. If Face or PIN appears, press Cancel and try again.'
    );
    if (!proceed) return;

    setIsEnrolling(true);
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
        body: JSON.stringify({ type: 'fingerprint' })
      });

      let optionsData;
      try {
        optionsData = await optionsRes.json();
      } catch {
        throw new Error(
          `Server did not return JSON (${optionsRes.status}). Is the backend running at ${API_BASE}?`
        );
      }
      if (!optionsRes.ok || !optionsData.success) {
        throw new Error(optionsData.message || `Failed to start fingerprint enrollment (${optionsRes.status})`);
      }
      const opts = optionsData.options;
      if (!opts || typeof opts.challenge !== 'string') {
        throw new Error(
          'Invalid WebAuthn options from server (missing challenge). Restart backend after update.'
        );
      }

      const attResp = await startRegistration({ optionsJSON: opts });

      const verifyRes = await fetch(`${API_BASE}/api/auth/biometric/register-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ credential: attResp, type: 'fingerprint' })
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        const msg = String(verifyData.message || '').toLowerCase();
        if (msg.includes('face')) {
          throw new Error('Fingerprint required now. Do not use face/PIN.');
        }
        throw new Error(verifyData.message || 'Fingerprint enrollment failed');
      }
      if (verifyData.registeredType && verifyData.registeredType !== 'fingerprint') {
        throw new Error('Fingerprint required now. Do not use face/PIN.');
      }

      setIsSuccess(true);
      setTimeout(() => navigate('/register/face'), 1500);
    } catch (err) {
      console.error('Fingerprint enrollment error:', err);
      setIsFailed(true);
      if (err?.name === 'NotAllowedError') {
        setErrorMessage('Prompt cancelled/denied. Use fingerprint only. If Face or PIN appears, cancel and retry.');
      } else if (err?.name === 'TimeoutError') {
        setErrorMessage('WebAuthn enrollment timed out. Try again and complete the biometric prompt.');
      } else if (err?.name === 'TypeError' && String(err?.message || '').includes('fetch')) {
        setErrorMessage(
          `Cannot reach API at ${API_BASE}. Start the backend (port 5000) or set REACT_APP_API_URL in .env.`
        );
      } else {
        setErrorMessage(err?.message || 'Failed to enroll fingerprint. Please try again.');
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ color: '#00563B', fontSize: '2rem', marginBottom: '0.5rem' }}>Fingerprint (WebAuthn) Setup</h1>
        <p style={{ color: '#666', fontSize: '1rem', marginBottom: '2rem' }}>
          Use your device fingerprint biometric (Windows Hello / phone biometrics) if supported.
        </p>
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#7a5b00',
          padding: '10px 12px',
          borderRadius: '8px',
          marginBottom: '1.2rem',
          border: '1px solid #ffe69c'
        }}>
          Allowed now: <strong>Fingerprint only</strong>
        </div>
        <div style={{
          color: '#b42318',
          fontSize: '0.92rem',
          marginBottom: '1.2rem',
          fontWeight: 600
        }}>
          🔒 Blocked methods: Face/PIN not allowed in this step.
        </div>

        <div style={{ padding: '2rem', border: '2px dashed #e9ecef', borderRadius: '12px', marginBottom: '1.5rem', background: 'white', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {isEnrolling && <p style={{ color: '#00563B', fontWeight: 600 }}>Enrolling fingerprint…</p>}

          {!isEnrolling && !isSuccess && !isFailed && <p style={{ color: '#666' }}>Click to start fingerprint enrollment (system biometric prompt will appear).</p>}

          {isSuccess && (
            <div>
              <div style={{ fontSize: '4rem', color: '#28a745', marginBottom: '1rem' }}>✓</div>
              <p style={{ color: '#28a745', fontWeight: 'bold' }}>Fingerprint enrolled successfully!</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Redirecting to face setup…</p>
            </div>
          )}

          {isFailed && (
            <div>
              <div style={{ fontSize: '4rem', color: '#dc3545', marginBottom: '1rem' }}>✗</div>
              <p style={{ color: '#dc3545', fontWeight: 600 }}>{errorMessage}</p>
            </div>
          )}
        </div>

        {!isSuccess && (
          <button
            onClick={handleEnrollFingerprint}
            disabled={isEnrolling}
            style={{
              backgroundColor: '#00563B',
              color: 'white',
              padding: '14px 28px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              cursor: isEnrolling ? 'not-allowed' : 'pointer',
              opacity: isEnrolling ? 0.6 : 1,
              width: '100%'
            }}
          >
            {isEnrolling ? 'Starting…' : 'Enroll Fingerprint'}
          </button>
        )}

        {errorMessage && !isFailed && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', fontSize: '0.9rem', color: '#856404', border: '1px solid #ffeaa7' }}>
            {errorMessage}
          </div>
        )}

        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#555', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <p><span style={{ fontSize: '1.2rem' }}>🔒</span> WebAuthn stores only cryptographic public keys in the database. No raw fingerprint data is stored.</p>
        </div>
      </div>
    </div>
  );
};

export default FingerprintSetupPage;
