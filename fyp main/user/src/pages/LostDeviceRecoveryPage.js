import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const LostDeviceRecoveryPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/recovery/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      setQuestion(data.question || '');
      setMessage('OTP sent. Please enter OTP and security answer.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/recovery/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          answer: answer.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Recovery verification failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.setItem('recoveryLogin', 'true');

      navigate(data.user?.role === 'admin' ? '/admin/dashboard' : '/user-dashboard');
    } catch (err) {
      setError(err.message || 'Recovery verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#00563B', marginBottom: '0.5rem' }}>Account Recovery</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Lost your registered device? Recover access using Email OTP + Security Question.
        </p>

        {error && <div style={{ background: '#f8d7da', color: '#842029', padding: '10px', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        {message && <div style={{ background: '#d1e7dd', color: '#0f5132', padding: '10px', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
              placeholder="Enter your registered email"
            />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', background: '#00563B', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Sending...' : 'Send Recovery OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Security Question</label>
            <div style={{ background: '#eef6ff', border: '1px solid #dbeafe', padding: '10px', borderRadius: '8px', marginBottom: '1rem' }}>
              {question || 'Please answer your saved security question.'}
            </div>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
              placeholder="Enter your answer"
            />

            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
              placeholder="Enter 6-digit OTP"
            />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', background: '#00563B', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#00563B', textDecoration: 'none' }}>Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default LostDeviceRecoveryPage;
