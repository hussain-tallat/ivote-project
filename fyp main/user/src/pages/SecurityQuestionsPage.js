import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const pageShell = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(15, 118, 110, 0.14), transparent 28%), radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.12), transparent 24%), linear-gradient(180deg, #f8fbfa 0%, #edf5f4 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 0'
};

const panelSurface = {
  background: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.10)',
  borderRadius: 28
};

const SecurityQuestionsPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    question1: "What is your mother's maiden name?",
    answer1: '',
    question2: 'What was the name of your first pet?',
    answer2: '',
    question3: 'What is the name of the city you were born in?',
    answer3: ''
  });
  const [status, setStatus] = useState({
    loading: true,
    fingerprintReady: false,
    faceReady: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/otp-verification');
          return;
        }

        const response = await fetch(`${API_BASE}/api/auth/registration-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to confirm registration status.');
        }

        const fingerprintReady = Boolean(
          data.registrationProgress?.fingerprintCaptured ||
          data.biometricSetup?.fingerprint?.isSetup
        );
        const faceReady = Boolean(
          data.registrationProgress?.faceCaptured ||
          data.biometricSetup?.faceRecognition?.isSetup ||
          data.biometricSetup?.face?.isSetup
        );

        setStatus({
          loading: false,
          fingerprintReady,
          faceReady
        });
      } catch (err) {
        setStatus((prev) => ({ ...prev, loading: false }));
        setError(err?.message || 'Unable to confirm biometric setup status.');
      }
    };

    loadStatus();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!status.fingerprintReady || !status.faceReady) {
      setError('Fingerprint and face registration must both be completed before security questions can be saved.');
      return;
    }

    if (!formData.answer1.trim() || !formData.answer2.trim() || !formData.answer3.trim()) {
      setError('Please answer all security questions.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please verify OTP again.');
        navigate('/otp-verification');
        return;
      }

      const payload = {
        questions: [
          { question: formData.question1, answer: formData.answer1.trim() },
          { question: formData.question2, answer: formData.answer2.trim() },
          { question: formData.question3, answer: formData.answer3.trim() }
        ]
      };

      const response = await fetch(`${API_BASE}/api/auth/security-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save security questions');
      }

      alert('Registration completed successfully. Please login to continue.');
      localStorage.removeItem('pendingEmail');
      localStorage.removeItem('pendingCnic');
      localStorage.removeItem('userRegistrationData');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to save security questions. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageShell}>
      <div style={{ maxWidth: 980, width: '100%', margin: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <section
          style={{
            ...panelSurface,
            background:
              'linear-gradient(135deg, rgba(15, 77, 58, 0.98) 0%, rgba(21, 111, 99, 0.96) 58%, rgba(30, 64, 175, 0.94) 100%)',
            color: 'white',
            padding: '32px 28px'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', fontWeight: 700, marginBottom: 18 }}>
            Final Registration Step
          </div>
          <h1 style={{ color: 'white', fontSize: '2.2rem', marginBottom: '0.8rem' }}>Secure your account recovery</h1>
          <p style={{ color: 'rgba(255,255,255,0.88)', lineHeight: 1.7, marginBottom: 22 }}>
            Security questions are the final step after biometric registration. They help protect recovery, vote verification, and suspicious device checks.
          </p>

          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Fingerprint registration', ready: status.fingerprintReady },
              { label: 'Face recognition registration', ready: status.faceReady },
              { label: 'Security questions', ready: false }
            ].map((item, index) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.10)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                    {index + 1}
                  </div>
                  <div>{item.label}</div>
                </div>
                <strong style={{ color: item.ready ? '#bbf7d0' : '#fef3c7' }}>
                  {item.ready ? 'Ready' : index === 2 ? 'Current' : 'Required'}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...panelSurface, padding: '28px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#0f4d3a', fontSize: '2rem', marginBottom: '0.5rem' }}>Security Questions</h2>
            <p style={{ color: '#64748b', margin: 0 }}>
              Answer all three questions to complete registration.
            </p>
          </div>

          {!status.loading && (!status.fingerprintReady || !status.faceReady) && (
            <div style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74', borderRadius: 16, padding: '14px 16px', marginBottom: '1rem' }}>
              Fingerprint and face registration are required before this step. Please return to biometric setup first.
            </div>
          )}

          {error && (
            <div style={{ background: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3', borderRadius: 16, padding: '14px 16px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[1, 2, 3].map((questionNum) => (
              <div key={questionNum} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>
                  Security Question {questionNum}
                </label>
                <select
                  name={`question${questionNum}`}
                  value={formData[`question${questionNum}`]}
                  onChange={handleChange}
                  disabled={!status.fingerprintReady || !status.faceReady}
                  style={{ width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: 'white', marginBottom: 8 }}
                >
                  {questionNum === 1 && (
                    <>
                      <option>What is your mother's maiden name?</option>
                      <option>What is your father's middle name?</option>
                      <option>What was your favorite school teacher's name?</option>
                    </>
                  )}
                  {questionNum === 2 && (
                    <>
                      <option>What was the name of your first pet?</option>
                      <option>What was your first car?</option>
                      <option>What is your favorite movie?</option>
                    </>
                  )}
                  {questionNum === 3 && (
                    <>
                      <option>What is the name of the city you were born in?</option>
                      <option>What is your favorite food?</option>
                      <option>Where did you go for your first vacation?</option>
                    </>
                  )}
                </select>
                <input
                  type="text"
                  name={`answer${questionNum}`}
                  value={formData[`answer${questionNum}`]}
                  onChange={handleChange}
                  disabled={!status.fingerprintReady || !status.faceReady}
                  placeholder="Enter your answer"
                  style={{ width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: 'white' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: '1.25rem' }}>
              <button
                type="submit"
                disabled={isSubmitting || status.loading || !status.fingerprintReady || !status.faceReady}
                style={{
                  flex: 1,
                  minWidth: 180,
                  background: 'linear-gradient(135deg, #0f766e, #065f46)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 16,
                  padding: '15px 18px',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save & Complete Registration'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/biometric-setup')}
                style={{
                  flex: 1,
                  minWidth: 180,
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: 16,
                  padding: '15px 18px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Back to Biometrics
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default SecurityQuestionsPage;
