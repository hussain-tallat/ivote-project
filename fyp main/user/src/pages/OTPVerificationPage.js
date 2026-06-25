
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config/api';

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Get email from previous page or localStorage
  const email = location.state?.email || localStorage.getItem('pendingEmail');

  // If no email, redirect back to register
  React.useEffect(() => {
    if (!email) {
      alert("No email found for verification. Please register first.");
      navigate('/register');
    }
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          otp: otpString
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('tempToken', data.token);  // Store temp token for biometric setup
        localStorage.setItem('tempRegistrationEmail', email);  // Store email for biometric setup
        localStorage.setItem('isVerified', 'true');
        alert('Email verified successfully! Next: register your device biometric.');
        navigate('/biometric-setup');
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setResendCooldown(60);
    setError('');

    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        alert('New OTP sent to your email!');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 0'
    }}>
      <div className="card" style={{
        maxWidth: '500px',
        width: '100%',
        margin: '0 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            color: 'var(--primary-green)',
            fontSize: '2rem',
            marginBottom: '0.5rem'
          }}>
            OTP Verification
          </h1>
          <p style={{ color: 'var(--dark-grey)', fontSize: '1rem' }}>
            Enter the One-Time Password sent to your registered email so you can continue to biometric setup.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Enter 6-digit OTP</label>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="tel"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`form-input ${error ? 'error' : ''}`}
                  style={{
                    width: '50px',
                    height: '50px',
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}
                />
              ))}
            </div>
            {error && <div className="error-message" style={{ textAlign: 'center' }}>{error}</div>}
          </div>

          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            color: 'var(--dark-grey)',
            fontSize: '0.9rem'
          }}>
            <p>OTP has been sent to your registered email address.</p>
            <p>
              Didn't receive OTP?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? '#999' : 'var(--accent-green)',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline',
                  fontSize: 'inherit'
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
              </button>
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1.1rem',
              marginBottom: '1.5rem'
            }}
            disabled={isVerifying || otp.join('').length !== 6}
          >
            {isVerifying ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }}></div>
                Verifying...
              </div>
            ) : (
              'Verify OTP'
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: 'var(--dark-grey)'
        }}>
          <p>
            <span className="icon">🔒</span>
            Your OTP is valid for 5 minutes and can only be used once.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
