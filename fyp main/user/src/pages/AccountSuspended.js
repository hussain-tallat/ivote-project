
import React from 'react';
import { Link } from 'react-router-dom';

const AccountSuspended = () => {
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
        maxWidth: '600px', 
        width: '100%', 
        margin: '0 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            fontSize: '4rem', 
            color: 'var(--orange)', 
            marginBottom: '1rem' 
          }}>
            ⚠️
          </div>
          <h1 style={{ 
            color: 'var(--primary-green)', 
            fontSize: '2.5rem', 
            marginBottom: '1rem' 
          }}>
            Account Suspended
          </h1>
        </div>

        <div className="alert alert-error" style={{ 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          textAlign: 'left'
        }}>
          <span style={{ 
            fontSize: '1.5rem', 
            marginRight: '1rem',
            color: 'var(--red)'
          }}>
            ⚠️
          </span>
          <div>
            <strong>Your account has been temporarily suspended</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              For security reasons, you cannot log in or access your account for the next 3 mint
            </p>
          </div>
        </div>

        <div style={{ 
          marginBottom: '2rem',
          textAlign: 'left',
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '8px'
        }}>
          <h3 style={{ 
            marginBottom: '1rem', 
            color: 'var(--dark-grey)' 
          }}>
            Suspension Details
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
              <strong>Reason:</strong>
            </p>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--dark-grey)' }}>
              Multiple voting attempts detected from the same CNIC
            </p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
              <strong>Suspension Duration:</strong>
            </p>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--red)', fontWeight: 'bold' }}>
              3 mint
            </p>
          </div>
          
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
              <strong>Access Restored:</strong>
            </p>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--primary-green)', fontWeight: 'bold' }}>
              time date after 3 mint
            </p>
          </div>
        </div>

        <div style={{ 
          marginBottom: '2rem',
          textAlign: 'left',
          backgroundColor: '#fff3cd',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <h4 style={{ 
            marginBottom: '1rem', 
            color: 'var(--dark-grey)' 
          }}>
            What you can do:
          </h4>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            color: 'var(--dark-grey)',
            margin: 0
          }}>
            <li style={{ marginBottom: '0.5rem' }}>
              • Please wait until the suspension perriod is over
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              • If you believe this is a mistake, you can{' '}
              <Link 
                to="/contact" 
                style={{ 
                  color: 'var(--accent-green)', 
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                contact support
              </Link>
            </li>
          </ul>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link 
            to="/contact" 
            className="btn btn-primary"
            style={{ 
              padding: '12px 24px', 
              fontSize: '1rem',
              minWidth: '140px'
            }}
          >
            Contact Support
          </Link>
          <Link 
            to="/" 
            className="btn btn-outline"
            style={{ 
              padding: '12px 24px', 
              fontSize: '1rem',
              minWidth: '140px'
            }}
          >
            Back to Home
          </Link>
        </div>

        <div style={{ 
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: 'var(--dark-grey)'
        }}>
          <p style={{ margin: 0, textAlign: 'center' }}>
            <strong>Security Notice:</strong> This suspension is implemented to prevent 
            fraudulent voting activities and maintain the integrity of the electoral process.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountSuspended;
