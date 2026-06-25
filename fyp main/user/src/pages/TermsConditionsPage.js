
import React from 'react';
import { Link } from 'react-router-dom';

const TermsConditionsPage = () => {
  const sections = [
    {
      title: 'Introduction',
      content: 'This document outlines the binding agreement between you, the user, and iVotePK regarding your access to and use of our digital voting platform and related services. By registering an account and casting a vote, you agree to comply with all terms stated herein.'
    },
    {
      title: 'Acceptance of Terms',
      content: 'Your use of iVotePK\'s services signifies your explicit agreement to these Terms and Conditions and our Privacy Policy. If you do not agree to any part of these terms, you must not use the platform or proceed with voter registration or voting.'
    },
    {
      title: 'Modification of Terms',
      content: 'iVotePK reserves the right to modify these Terms and Conditions at any time. All changes will be posted on this page. By continuing to use the service after any modification, you accept the revised terms. It is your responsibility to review the terms periodically.'
    },
    {
      title: 'Eligibility',
      content: 'To register on the iVotePK platform and be eligible to vote, you must be a citizen of Pakistan, possess a valid CNIC, and be 18 years of age or older at the time of registration. You must also agree to complete all mandatory security verification steps (CNIC, face, and fingerprint verification).'
    },
    {
      title: 'User Responsibilities',
      content: 'Users are responsible for maintaining the confidentiality of their account credentials, providing accurate information during registration, and complying with all applicable laws and regulations. Any attempt to manipulate the voting process or breach security measures will result in immediate account suspension.'
    },
    {
      title: 'Security and Privacy',
      content: 'iVotePK implements advanced security measures to protect user data and voting integrity. All personal information is encrypted and stored securely. Users consent to the collection and processing of biometric data for identity verification purposes only.'
    },
    {
      title: 'Voting Process',
      content: 'The voting process is designed to be secure, transparent, and anonymous. Once a vote is cast, it cannot be modified or withdrawn. All votes are encrypted and stored securely to maintain the integrity of the electoral process.'
    },
    {
      title: 'Prohibited Activities',
      content: 'Users are prohibited from attempting to hack, manipulate, or interfere with the platform, creating multiple accounts, sharing account credentials, or engaging in any fraudulent activities. Violations will result in immediate account termination and legal action.'
    },
    {
      title: 'Limitation of Liability',
      content: 'iVotePK shall not be liable for any technical issues, system downtime, or data loss that may occur during the voting process. Users participate at their own risk and acknowledge that the platform is provided "as is" without warranties of any kind.'
    },
    {
      title: 'Dispute Resolution',
      content: 'Any disputes arising from the use of iVotePK services shall be resolved through binding arbitration in accordance with Pakistani law. Users agree to waive their right to a jury trial and to participate in good faith in the arbitration process.'
    },
    {
      title: 'Termination',
      content: 'iVotePK reserves the right to terminate user accounts at any time for violations of these terms or for any other reason deemed necessary to protect the integrity of the platform and electoral process.'
    },
    {
      title: 'Contact Information',
      content: 'For questions regarding these Terms and Conditions, please contact us at support@ivotepk.com or call +92 308 443 3843. Our support team is available 24/7 to assist with any inquiries.'
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
            Terms & Conditions
          </h1>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Please read these terms carefully before using our platform
          </p>
        </div>

        {/* Terms Content */}
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {sections.map((section, index) => (
            <div key={index} className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                color: 'var(--primary-green)', 
                fontSize: '1.5rem', 
                marginBottom: '1rem',
                borderBottom: '2px solid var(--primary-green)',
                paddingBottom: '0.5rem'
              }}>
                {index + 1}. {section.title}
              </h2>
              <p style={{ 
                color: 'var(--dark-grey)', 
                fontSize: '1rem',
                lineHeight: '1.7',
                margin: 0
              }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Important Notice */}
        <div className="card" style={{ 
          marginTop: '3rem',
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7'
        }}>
          <h3 style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1.5rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            ⚠️ Important Notice
          </h3>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1rem', 
            marginBottom: '1.5rem',
            fontWeight: '500'
          }}>
            By using iVotePK, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. 
            These terms constitute a legally binding agreement between you and iVotePK.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link 
              to="/privacy" 
              className="btn btn-primary"
              style={{ padding: '12px 24px' }}
            >
              Read Privacy Policy
            </Link>
            <Link 
              to="/contact" 
              className="btn btn-outline"
              style={{ padding: '12px 24px' }}
            >
              Contact Support
            </Link>
          </div>
        </div>

        {/* Last Updated */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '0.9rem',
            margin: 0
          }}>
            <strong>Last Updated:</strong> January 15, 2025
          </p>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '0.9rem',
            margin: '0.5rem 0 0 0'
          }}>
            <strong>Effective Date:</strong> January 15, 2025
          </p>
        </div>

        {/* Quick Links */}
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ 
            color: 'var(--primary-green)', 
            fontSize: '1.8rem', 
            textAlign: 'center',
            marginBottom: '2rem' 
          }}>
            Related Documents
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem' 
          }}>
            <Link 
              to="/privacy" 
              className="card" 
              style={{ 
                textDecoration: 'none', 
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                fontSize: '2.5rem', 
                color: 'var(--primary-green)', 
                marginBottom: '1rem' 
              }}>
                🔒
              </div>
              <h4 style={{ 
                color: 'var(--primary-green)', 
                marginBottom: '0.5rem' 
              }}>
                Privacy Policy
              </h4>
              <p style={{ color: 'var(--dark-grey)', margin: 0, fontSize: '0.9rem' }}>
                How we collect and protect your data
              </p>
            </Link>
            
            <Link 
              to="/help" 
              className="card" 
              style={{ 
                textDecoration: 'none', 
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                fontSize: '2.5rem', 
                color: 'var(--accent-green)', 
                marginBottom: '1rem' 
              }}>
                ❓
              </div>
              <h4 style={{ 
                color: 'var(--accent-green)', 
                marginBottom: '0.5rem' 
              }}>
                Help & FAQs
              </h4>
              <p style={{ color: 'var(--dark-grey)', margin: 0, fontSize: '0.9rem' }}>
                Frequently asked questions
              </p>
            </Link>
            
            <Link 
              to="/contact" 
              className="card" 
              style={{ 
                textDecoration: 'none', 
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                fontSize: '2.5rem', 
                color: 'var(--blue)', 
                marginBottom: '1rem' 
              }}>
                📞
              </div>
              <h4 style={{ 
                color: 'var(--blue)', 
                marginBottom: '0.5rem' 
              }}>
                Contact Us
              </h4>
              <p style={{ color: 'var(--dark-grey)', margin: 0, fontSize: '0.9rem' }}>
                Get in touch with our support team
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditionsPage;
