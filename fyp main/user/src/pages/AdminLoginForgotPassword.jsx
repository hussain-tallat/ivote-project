import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const AdminLoginForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const sendOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE}/api/auth/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setMessage({ type: 'success', text: 'OTP sent to the admin email address.' });
      setStep(2);
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Failed to send OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE}/api/auth/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          newPassword
        })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setMessage({ type: 'success', text: 'Password updated successfully. Redirecting to admin login...' });
      setTimeout(() => navigate('/admin/auth'), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-shell">
      <div className="admin-auth-card">
        <aside className="admin-auth-brand">
          <div className="admin-pill" style={{ marginBottom: 18 }}>
            <i className="fa-solid fa-key" />
            Recovery Flow
          </div>
          <h2 style={{ margin: 0, fontSize: '2.2rem', lineHeight: 1.1 }}>Reset the admin password by email OTP</h2>
          <p style={{ marginTop: 16, marginBottom: 0 }}>
            Use the registered admin email address to receive a one-time password and set a new login password safely.
          </p>

          <div className="admin-check-list">
            <div>
              <i className="fa-solid fa-envelope-circle-check" />
              <div>
                <strong>Verified email delivery</strong>
                <p>The backend sends a fresh OTP to the registered admin email address.</p>
              </div>
            </div>
            <div>
              <i className="fa-solid fa-lock" />
              <div>
                <strong>Short-lived recovery code</strong>
                <p>Only the current OTP can be used, and it expires automatically.</p>
              </div>
            </div>
            <div>
              <i className="fa-solid fa-shield" />
              <div>
                <strong>Instant return to admin login</strong>
                <p>After reset, the admin can sign in again through the normal OTP-protected login flow.</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="admin-auth-form">
          <div className="admin-pill" style={{ background: '#eff6ff', color: '#1d4ed8', marginBottom: 16 }}>
            <i className="fa-solid fa-rotate-right" />
            {step === 1 ? 'Request OTP' : 'Set New Password'}
          </div>

          <h1>Admin Password Recovery</h1>
          <p>
            {step === 1
              ? 'Enter the registered admin email to receive a one-time password.'
              : 'Enter the OTP from email and create a new password.'}
          </p>

          {message.text && (
            <div className={`admin-alert ${message.type === 'success' ? 'success' : 'error'}`}>
              {message.text}
            </div>
          )}

          {step === 1 ? (
            <form className="admin-auth-stack" onSubmit={sendOtp}>
              <div className="admin-field">
                <label htmlFor="reset-email">Admin Email</label>
                <input
                  id="reset-email"
                  className="admin-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <button className="admin-primary-btn" type="submit" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form className="admin-auth-stack" onSubmit={resetPassword}>
              <div className="admin-field">
                <label htmlFor="reset-otp">OTP Code</label>
                <input
                  id="reset-otp"
                  className="admin-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter the 6-digit OTP"
                  maxLength={6}
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="admin-field">
                <label htmlFor="reset-password">New Password</label>
                <input
                  id="reset-password"
                  className="admin-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a new password"
                  required
                />
              </div>
              <div className="admin-field">
                <label htmlFor="reset-confirm">Confirm Password</label>
                <input
                  id="reset-confirm"
                  className="admin-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat the new password"
                  required
                />
              </div>
              <div className="admin-toolbar-actions">
                <button className="admin-primary-btn" type="submit" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button className="admin-secondary-btn" type="button" onClick={() => setStep(1)} disabled={loading}>
                  Back
                </button>
              </div>
            </form>
          )}

          <div className="admin-auth-footer">
            <Link className="admin-link-btn" to="/admin/auth">
              Back to admin login
            </Link>
            <Link className="admin-link-btn" to="/">
              Return to public site
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminLoginForgotPassword;
