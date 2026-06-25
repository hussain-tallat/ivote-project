
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HowItWorksPage = () => {
  const { t } = useTranslation();
  const steps = [
    {
      number: 1,
      title: 'Login',
      description: 'Enter your CNIC and password to access your account.',
      icon: '👤'
    },
    {
      number: 2,
      title: 'Fingerprint Verification',
      description: 'Scan your fingerprint to confirm your identity with NADRA records.',
      icon: '👆'
    },
    {
      number: 3,
      title: 'Face Recognition',
      description: 'Use your camera for additional verification through facial recognition.',
      icon: '📷'
    },
    {
      number: 4,
      title: 'Voting Dashboard',
      description: 'Access the secure voting dashboard to view candidates and parties.',
      icon: '👥'
    },
    {
      number: 5,
      title: 'Security Questions',
      description: 'Answer your pre-set security questions for final verification.',
      icon: '🔒'
    },
    {
      number: 6,
      title: 'Vote Casted Successfully',
      description: 'Submit your vote and receive confirmation that your vote has been recorded securely.',
      icon: '✅'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            color: 'var(--primary-green)', 
            fontSize: '2.5rem', 
            marginBottom: '1rem' 
          }}>
            {t('How It Works')}
          </h1>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {t('Follow these steps to securely cast your vote:')}
          </p>
        </div>

        {/* Steps */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {steps.map((step, index) => (
            <div key={step.number} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              marginBottom: '3rem',
              padding: '2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}>
              {/* Step Number and Icon */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                marginRight: '2rem',
                minWidth: '80px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'var(--primary-green)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  {step.number}
                </div>
                {/* Icon per step number -- in the steps array in order */}
                {step.number === 1 && <i className="fa-solid fa-right-to-bracket" style={{ fontSize: 32, color: 'var(--primary-green)' }}></i>}
                {step.number === 2 && <i className="fa-solid fa-fingerprint" style={{ fontSize: 32, color: 'var(--primary-green)' }}></i>}
                {step.number === 3 && <i className="fa-solid fa-face-viewfinder" style={{ fontSize: 32, color: 'var(--primary-green)' }}></i>}
                {step.number === 4 && <i className="fa-solid fa-display" style={{ fontSize: 32, color: 'var(--primary-green)' }}></i>}
                {step.number === 5 && <i className="fa-solid fa-question" style={{ fontSize: 32, color: 'var(--primary-green)' }}></i>}
                {step.number === 6 && <i className="fa-solid fa-check-double" style={{ fontSize: 32, color: 'var(--primary-green)' }}></i>}
              </div>

              {/* Step Content */}
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  color: 'var(--primary-green)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  fontWeight: '600'
                }}>
                  {step.number}. {step.title}
                </h3>
                <p style={{ 
                  color: 'var(--dark-grey)', 
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {step.description}
                </p>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '-1.5rem',
                  transform: 'translateX(-50%)',
                  width: '2px',
                  height: '3rem',
                  backgroundColor: 'var(--primary-green)',
                  opacity: 0.3
                }}></div>
              )}
            </div>
          ))}
        </div>

        {/* Security Features */}
        <div className="card" style={{ 
          marginTop: '3rem',
          textAlign: 'center',
          backgroundColor: 'var(--primary-green)',
          color: 'white'
        }}>
          <h3 style={{ 
            fontSize: '1.8rem', 
            marginBottom: '1.5rem' 
          }}>
            {t('Security Features')}
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              {/* Encryption */}
              <i className="fa-solid fa-lock" style={{ fontSize: 32, color: '#1976d2' }}></i>
              <h4 style={{ marginBottom: '0.5rem' }}>{t('Encryption')}</h4>
              <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
                {t('End-to-end encryption for all data')}
              </p>
            </div>
            
            <div>
              {/* Biometric Security */}
              <i className="fa-solid fa-fingerprint" style={{ fontSize: 32, color: '#388e3c' }}></i>
              <h4 style={{ marginBottom: '0.5rem' }}>{t('Biometric Security')}</h4>
              <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
                {t('Multi-factor authentication')}
              </p>
            </div>
            
            <div>
              {/* Transparency */}
              <i className="fa-solid fa-eye" style={{ fontSize: 32, color: '#fbc02d' }}></i>
              <h4 style={{ marginBottom: '0.5rem' }}>{t('Transparency')}</h4>
              <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
                {t('Real-time monitoring and alerts')}
              </p>
            </div>
            
            <div>
              {/* Verification */}
              <i className="fa-solid fa-check-shield" style={{ fontSize: 32, color: '#10b981' }}></i>
              <h4 style={{ marginBottom: '0.5rem' }}>{t('Verification')}</h4>
              <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
                {t('Multiple verification layers')}
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '3rem',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            color: 'var(--primary-green)', 
            fontSize: '1.8rem', 
            marginBottom: '1rem' 
          }}>
            {t('Ready to Start Voting?')}
          </h3>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1.1rem', 
            marginBottom: '2rem' 
          }}>
            {t('Join thousands of Pakistanis who trust iVotePK for secure digital voting.')}
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/register" 
              className="btn btn-primary"
              style={{ 
                padding: '14px 28px', 
                fontSize: '1.1rem' 
              }}
            >
              {t('Register Now')}
            </Link>
            <Link 
              to="/login" 
              className="btn btn-outline"
              style={{ 
                padding: '14px 28px', 
                fontSize: '1.1rem' 
              }}
            >
              {t('Login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
