import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../config/api';

const pageShell = {
  minHeight: '100vh',
  background: '#ffffff',
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

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '13px 14px',
  borderRadius: 14,
  border: `1px solid ${hasError ? '#fda4af' : '#cbd5e1'}`,
  background: 'white'
});

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedDistrict, setDetectedDistrict] = useState(null);
  const [isDetectingDistrict, setIsDetectingDistrict] = useState(false);

  useEffect(() => {
    const cnicClean = formData.cnic.replace(/\D/g, '');
    if (cnicClean.length < 5) {
      setDetectedDistrict(null);
      return;
    }

    const controller = new AbortController();
    const lookupDistrict = async () => {
      setIsDetectingDistrict(true);
      try {
        const response = await fetch(`${API_BASE}/api/public/cnic-district/${cnicClean.slice(0, 5)}`, {
          signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'District not found for this CNIC prefix');
        }

        setDetectedDistrict(data.district);
        setErrors((prev) => ({ ...prev, cnic: '' }));
      } catch (error) {
        if (error.name === 'AbortError') return;
        setDetectedDistrict(null);
        if (cnicClean.length >= 5) {
          setErrors((prev) => ({ ...prev, cnic: error.message || 'District not found for this CNIC prefix' }));
        }
      } finally {
        setIsDetectingDistrict(false);
      }
    };

    lookupDistrict();
    return () => controller.abort();
  }, [formData.cnic]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const cnicDigits = formData.cnic.replace(/\D/g, '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;

    if (!formData.name.trim()) {
      nextErrors.name = 'Full name is required';
    }

    if (!formData.cnic) {
      nextErrors.cnic = t('cnic_required');
    } else if (!(/^[\d\s-]+$/.test(formData.cnic) && cnicDigits.length === 13)) {
      nextErrors.cnic = t('cnic_format_error');
    }

    if (!detectedDistrict) {
      nextErrors.cnic = nextErrors.cnic || 'District could not be detected from the first 5 CNIC digits';
    }

    // halqa selection is not required at registration; admin will assign later.

    if (!formData.email) {
      nextErrors.email = t('email_required');
    } else if (!emailRegex.test(formData.email)) {
      nextErrors.email = t('invalid_email');
    }

    if (!formData.phone) {
      nextErrors.phone = t('phone_required');
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      nextErrors.phone = t('phone_format_error');
    }

    if (!formData.password) {
      nextErrors.password = t('password_required');
    } else if (formData.password.length < 8) {
      nextErrors.password = t('password_min_length');
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      nextErrors.password = t('password_lowercase');
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      nextErrors.password = t('password_uppercase');
    } else if (!/(?=.*\d)/.test(formData.password)) {
      nextErrors.password = t('password_number');
    } else if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
      nextErrors.password = t('password_special');
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = t('confirm_password_required');
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = t('passwords_no_match');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const cnicClean = formData.cnic.replace(/-/g, '');

      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          cnic: cnicClean,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          // halqaId intentionally omitted; admin assigns halqa after approval
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrors({ general: data.message || 'Registration failed' });
        return;
      }

      localStorage.setItem('pendingEmail', formData.email);
      localStorage.setItem('pendingCnic', cnicClean);
      localStorage.setItem('userRegistrationData', JSON.stringify({
        ...formData,
        cnic: cnicClean,
        district: detectedDistrict?.name,
        districtCode: detectedDistrict?.code,
        userId: data.userId
      }));

      alert(`Registration successful. OTP has been sent to ${formData.email}.`);
      navigate('/otp-verification');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Failed to connect to server. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const registrationSteps = [
    { text: 'Enter CNIC to detect your district automatically', icon: null },
    { text: 'Register with email, phone, and password', icon: null },
    { text: 'Verify the email OTP sent to your inbox', icon: null },
    { text: 'Enroll fingerprint on your device sensor', icon: '/assets/finger.png' },
    { text: 'Capture a guided facial scan with the webcam', icon: '/assets/face.webp' },
    { text: 'Finish account recovery questions', icon: null }
  ];

  return (
    <div style={pageShell}>
      <div style={{ maxWidth: 1140, width: '100%', margin: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <section
          style={{
            ...panelSurface,
            background:
              'linear-gradient(135deg, rgba(15, 77, 58, 0.98) 0%, rgba(21, 111, 99, 0.96) 58%, rgba(30, 64, 175, 0.94) 100%)',
            color: 'white',
            padding: '32px 28px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', inset: 'auto -70px -70px auto', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', fontWeight: 700, marginBottom: 18 }}>
              Secure Voter Onboarding
            </div>
            <h1 style={{ color: 'white', fontSize: '2.4rem', marginBottom: '0.8rem' }}>
              Create your verified voting account
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.88)', lineHeight: 1.7, marginBottom: 24 }}>
              Every voter completes email verification, fingerprint registration, guided face recognition, and security questions before the account is activated.
            </p>

            <div style={{ display: 'grid', gap: 12 }}>
              {registrationSteps.map((item, index) => (
                <div
                  key={item.text}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.10)'
                  }}
                >
                  <div style={{ minWidth: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                    {index + 1}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.92)' }}>
                    {item.icon && (
                      <img
                        src={item.icon}
                        alt=""
                        style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.14)', padding: 6, objectFit: 'contain', flexShrink: 0 }}
                      />
                    )}
                    <span>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ ...panelSurface, padding: '28px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ color: '#0f4d3a', fontSize: '2rem', marginBottom: '0.5rem' }}>
              {t('create_account') || 'Create Account'}
            </h2>
            <p style={{ color: '#64748b', margin: 0 }}>
              Enter your details to begin the verified registration flow.
            </p>
          </div>

          {errors.general && (
            <div style={{ background: '#fff1f2', color: '#9f1239', padding: '12px 14px', borderRadius: 14, border: '1px solid #fecdd3', marginBottom: '1rem', textAlign: 'center' }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                style={inputStyle(errors.name)}
              />
              {errors.name && <div style={{ marginTop: 6, color: '#b91c1c' }}>{errors.name}</div>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>{t('cnic_number') || 'CNIC Number'}</label>
              <input
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder={t('cnic_placeholder') || '12345-1234567-1'}
                style={inputStyle(errors.cnic)}
              />
              {isDetectingDistrict && <div style={{ marginTop: 6, color: '#475569' }}>Detecting district from CNIC... please wait a moment.</div>}
              {errors.cnic && <div style={{ marginTop: 6, color: '#b91c1c' }}>{errors.cnic}</div>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>Detected District</label>
              <div style={{ padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#f8fafc', color: detectedDistrict ? '#0f172a' : '#64748b' }}>
                {detectedDistrict ? `${detectedDistrict.name} (${detectedDistrict.province})` : 'Enter first 5 CNIC digits to detect district'}
              </div>
              <div style={{ marginTop: 6, color: '#475569', fontSize: 13 }}>
                Your halqa will be assigned later by the administrator. You do not choose it during registration.
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>{t('email_address') || 'Email Address'}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('email_placeholder') || 'name@example.com'}
                autoComplete="email"
                style={inputStyle(errors.email)}
              />
              {errors.email && <div style={{ marginTop: 6, color: '#b91c1c' }}>{errors.email}</div>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>{t('phone_number') || 'Phone Number'}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('phone_placeholder') || '03XXXXXXXXX'}
                style={inputStyle(errors.phone)}
              />
              {errors.phone && <div style={{ marginTop: 6, color: '#b91c1c' }}>{errors.phone}</div>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>{t('create_password') || 'Create Password'}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('password_placeholder') || 'Enter a strong password'}
                style={inputStyle(errors.password)}
              />
              {errors.password && <div style={{ marginTop: 6, color: '#b91c1c' }}>{errors.password}</div>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>{t('confirm_password_label') || 'Confirm Password'}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('confirm_password_placeholder') || 'Re-enter your password'}
                style={inputStyle(errors.confirmPassword)}
              />
              {errors.confirmPassword && <div style={{ marginTop: 6, color: '#b91c1c' }}>{errors.confirmPassword}</div>}
            </div>

            <div style={{ marginBottom: '1.25rem', padding: '16px 18px', background: '#f8fafc', borderRadius: 18, color: '#475569' }}>
              <strong style={{ color: '#0f172a' }}>{t('password_requirements') || 'Password requirements'}</strong>
              <div style={{ marginTop: 8, lineHeight: 1.65 }}>
                Minimum 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0f766e, #065f46)',
                color: 'white',
                border: 'none',
                borderRadius: 16,
                padding: '15px 18px',
                fontSize: '1.02rem',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (t('registering') || 'Registering...') : (t('register_now') || 'Register Now')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', color: '#475569' }}>
            {t('already_have_account_text') || 'Already have an account?'}{' '}
            <Link to="/login" style={{ color: '#0f766e', textDecoration: 'none', fontWeight: 800 }}>
              {t('login_here_link') || 'Login here'}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
