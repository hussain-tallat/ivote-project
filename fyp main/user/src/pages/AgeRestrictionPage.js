
import React from 'react';
import { Link } from 'react-router-dom';

const AgeRestrictionPage = () => {
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
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            color: 'var(--primary-green)', 
            fontSize: '2rem', 
            marginBottom: '1rem' 
          }}>
            You are under 18.
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
            <strong>You must be 18+ to register to this website.</strong>
          </div>
        </div>

        <div style={{ 
          marginBottom: '2rem',
          textAlign: 'left',
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--dark-grey)' }}>
            What you can do:
          </h3>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            color: 'var(--dark-grey)'
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
      </div>
    </div>
  );
};

export default AgeRestrictionPage;
