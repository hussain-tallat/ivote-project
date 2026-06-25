import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const AdminAuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('register');
  const [adminExists, setAdminExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState('login');
  const [otpInfo, setOtpInfo] = useState('');
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setStatusLoading(true);
        const res = await fetch(`${API_BASE}/api/auth/admin/status`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.message || 'Failed to load admin status');
        }
        setAdminExists(Boolean(data.adminExists));
        setMode(data.adminExists ? 'login' : 'register');
      } catch (e) {
        setError(e?.message || 'Failed to load admin status');
      } finally {
        setStatusLoading(false);
      }
    };

    checkStatus();
  }, []);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'register' ? '/api/auth/admin/register' : '/api/auth/admin/login';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (mode === 'register') {
        setOtpRequired(true);
        setOtpPurpose('register');
        setOtpInfo('We sent a one-time code to the admin email to activate the account.');
        return;
      }

      if (data.otpRequired) {
        setOtpRequired(true);
        setOtpPurpose('login');
        setOtpInfo('We sent a one-time code to the admin email to finish sign in.');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(data.user));
      navigate('/admin/dashboard');
    } catch (e) {
      setError(e?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const verifyEndpoint = otpPurpose === 'register'
        ? '/api/auth/admin/verify-otp'
        : '/api/auth/admin/verify-login-otp';

      const res = await fetch(`${API_BASE}${verifyEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          otp
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'OTP verification failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(data.user));
      navigate('/admin/dashboard');
    } catch (e) {
      setError(e?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-shell">
      <div className="admin-auth-card">
        <aside className="admin-auth-brand">
          <div className="admin-pill" style={{ marginBottom: 18 }}>
            <i className="fa-solid fa-shield-halved" />
            Secure Election Control
          </div>
          <h2 style={{ margin: 0, fontSize: '2.4rem', lineHeight: 1.1 }}>Admin access for the full voting platform</h2>
          <p style={{ marginTop: 16, marginBottom: 0 }}>
            Manage elections, candidates, fraud monitoring, and voter-facing publication from one verified account.
          </p>

          <div className="admin-check-list">
            <div>
              <i className="fa-solid fa-check" />
              <div>
                <strong>One verified admin account</strong>
                <p>The system checks whether the first admin is already created and adjusts the flow automatically.</p>
              </div>
            </div>
            <div>
              <i className="fa-solid fa-envelope-open-text" />
              <div>
                <strong>Email OTP protection</strong>
                <p>Registration, login, and password reset can all be completed through codes sent to the admin email.</p>
              </div>
            </div>
            <div>
              <i className="fa-solid fa-chart-line" />
              <div>
                <strong>Live publication pipeline</strong>
                <p>Admin-created elections and linked candidates become available in the voter experience and vote flow.</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="admin-auth-form">
          <div className="admin-pill" style={{ background: '#ecfdf5', color: '#065f46', marginBottom: 16 }}>
            <i className="fa-solid fa-user-shield" />
            {statusLoading ? 'Checking platform status' : adminExists ? 'Admin account detected' : 'First admin setup'}
          </div>

          <h1>{otpRequired ? 'Verify Your OTP' : mode === 'register' ? 'Create Admin Account' : 'Sign In as Admin'}</h1>
          <p>
            {otpRequired
              ? otpInfo
              : mode === 'register'
                ? 'Create the first admin account to unlock the control panel.'
                : 'Enter the verified admin credentials to continue to the dashboard.'}
          </p>

          {error && (
            <div className="admin-alert error">
              {error}
            </div>
          )}

          {!otpRequired && !statusLoading && adminExists && (
            <div className="admin-alert info">
              OTP-based login is enabled for the admin account.
            </div>
          )}

          <form className="admin-auth-stack" onSubmit={otpRequired ? onVerifyOtp : onSubmit}>
            {mode === 'register' && !otpRequired && (
              <div className="admin-field">
                <label htmlFor="admin-name">Admin Name</label>
                <input
                  id="admin-name"
                  className="admin-input"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="Enter the administrator name"
                  required
                />
              </div>
            )}

            <div className="admin-field">
              <label htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="email"
                className="admin-input"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>

            {!otpRequired ? (
              <div className="admin-field">
                <label htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  className="admin-input"
                  value={form.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  placeholder="Enter a secure password"
                  required
                />
              </div>
            ) : (
              <div className="admin-field">
                <label htmlFor="admin-otp">One-Time Password</label>
                <input
                  id="admin-otp"
                  className="admin-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>
            )}

            <button className="admin-primary-btn" type="submit" disabled={loading || statusLoading}>
              {loading
                ? 'Please wait...'
                : otpRequired
                  ? 'Verify OTP'
                  : mode === 'register'
                    ? 'Create Admin'
                    : 'Send Login OTP'}
            </button>
          </form>

          <div className="admin-auth-footer">
            {adminExists && !otpRequired && (
              <Link className="admin-link-btn" to="/admin/forgot-password">
                Forgot password?
              </Link>
            )}
            {otpRequired && (
              <button
                className="admin-secondary-btn"
                type="button"
                onClick={() => {
                  setOtpRequired(false);
                  setOtp('');
                  setError('');
                }}
              >
                Back
              </button>
            )}
            <Link className="admin-link-btn" to="/">
              Return to public site
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminAuthPage;
