
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CNICVerificationPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cnic: '',
    dateOfBirth: ''
  });
  const [errors, setErrors] = useState({});
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // CNIC validation (Pakistani CNIC format: 12345-1234567-1 or overseas format)
    const cnicRegex = /^(\d{5}-\d{7}-\d{1}|\d{13})$/;
    if (!formData.cnic) {
      newErrors.cnic = t('cnic_required');
    } else if (!cnicRegex.test(formData.cnic)) {
      newErrors.cnic = t('cnic_format_error');
    }

    // Date of Birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('dob_required');
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        // Haven't had birthday this year yet
        if (age < 18) {
          newErrors.dateOfBirth = t('age_restriction');
        }
      } else if (age < 18) {
        newErrors.dateOfBirth = t('age_restriction');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateAge = (dateOfBirth) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsVerifying(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const age = calculateAge(formData.dateOfBirth);

      if (age < 18) {
        // Navigate to age restriction page
        navigate('/age-restriction');
      } else {
        // Store verification data and navigate to biometric setup
        localStorage.setItem('verificationData', JSON.stringify(formData));
        navigate('/biometric-setup');
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
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
            {t('cnic_verification')}
          </h1>
          <p style={{ color: 'var(--dark-grey)', fontSize: '1rem' }}>
            {t('cnic_verification_desc')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('cnic_number')}</label>
            <input
              type="text"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              placeholder={t('cnic_placeholder')}
              className={`form-input ${errors.cnic ? 'error' : ''}`}
            />
            {errors.cnic && <div className="error-message">{errors.cnic}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">{t('date_of_birth')}</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={`form-input ${errors.dateOfBirth ? 'error' : ''}`}
            />
            {errors.dateOfBirth && <div className="error-message">{errors.dateOfBirth}</div>}
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
            disabled={isVerifying}
          >
            {isVerifying ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }}></div>
                {t('verifying')}
              </div>
            ) : (
              t('verify_continue')
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
            {t('verification_notice')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CNICVerificationPage;
