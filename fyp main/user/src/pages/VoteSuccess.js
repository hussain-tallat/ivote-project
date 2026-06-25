
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const VoteSuccess = () => {
  const location = useLocation();
  const { candidate, voteId, timestamp } = location.state || {};

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
            fontSize: '5rem', 
            color: 'var(--accent-green)', 
            marginBottom: '1rem' 
          }}>
            ✅
          </div>
          <h1 style={{ 
            color: 'var(--primary-green)', 
            fontSize: '2.5rem', 
            marginBottom: '1rem' 
          }}>
            Vote Cast Successfully!
          </h1>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1.1rem',
            marginBottom: '2rem'
          }}>
            Your vote has been securely recorded and verified. Thank you for participating in the democratic process.
          </p>
        </div>

        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '2rem', 
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
          <h3 style={{ 
            color: 'var(--primary-green)', 
            marginBottom: '1rem' 
          }}>
            Vote Confirmation Details
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            textAlign: 'left'
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                Vote ID
              </p>
              <p style={{ margin: 0, fontWeight: '500', color: 'var(--primary-green)' }}>
                #{voteId || 'VOTE-UNKNOWN'}
              </p>
            </div>
            
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                Timestamp
              </p>
              <p style={{ margin: 0, fontWeight: '500' }}>
                {timestamp || new Date().toLocaleString()}
              </p>
            </div>
            
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                Status
              </p>
              <p style={{ margin: 0, fontWeight: '500', color: 'var(--accent-green)' }}>
                Verified & Recorded
              </p>
            </div>
            
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                Security Level
              </p>
              <p style={{ margin: 0, fontWeight: '500', color: 'var(--primary-green)' }}>
                High (Biometric + OTP)
              </p>
            </div>

            {candidate && (
              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid #e9ecef', paddingTop: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                  Voted For
                </p>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                  {candidate.image && (
                    <img src={candidate.image} alt={candidate.name} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px', objectFit: 'cover' }} />
                  )}
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary-green)' }}>{candidate.name}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>{candidate.party?.name || candidate.party || 'Independent'}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '1.5rem', 
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid var(--accent-green)'
        }}>
          <h4 style={{ 
            color: 'var(--primary-green)', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ marginRight: '8px' }}>🔒</span>
            Your Vote is Secure
          </h4>
          <p style={{ 
            margin: 0, 
            fontSize: '0.9rem',
            color: 'var(--dark-grey)',
            lineHeight: '1.5'
          }}>
            Your vote has been encrypted and stored securely. It cannot be modified or deleted. 
            The system uses advanced cryptographic techniques to ensure the integrity and 
            confidentiality of your vote.
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link 
            to="/user-dashboard" 
            className="btn btn-primary"
            style={{ 
              padding: '14px 28px', 
              fontSize: '1.1rem'
            }}
          >
            Back to Dashboard
          </Link>
          <Link 
            to="/elections" 
            className="btn btn-outline"
            style={{ 
              padding: '14px 28px', 
              fontSize: '1.1rem'
            }}
          >
            View Other Elections
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
            <strong>Important:</strong> You have successfully cast your vote. 
            You cannot vote again in this election. Results will be announced after the voting period ends.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoteSuccess;
