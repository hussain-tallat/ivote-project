
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';

const OngoingElections = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setError('');
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/public/elections`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch elections');
        }
        setElections(data.elections || []);
      } catch (e) {
        setError(e?.message || 'Failed to load elections');
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            fontSize: '3rem', 
            color: 'var(--primary-green)', 
            marginBottom: '1rem' 
          }}>
            🗳️
          </div>
          <h1 style={{ 
            color: 'var(--primary-green)', 
            fontSize: '2.5rem', 
            marginBottom: '1rem' 
          }}>
            Ongoing Elections
          </h1>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto 1rem'
          }}>
            Stay updated with the elections currently in progress. Cast your vote securely and track live participation.
          </p>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <span>🔒</span>
            Your vote is private and securely verified through CNIC & biometric verification.
          </p>
        </div>

        {/* Elections Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {loading && <p style={{ textAlign: 'center', color: 'var(--dark-grey)' }}>Loading elections...</p>}
          {!loading && error && (
            <p style={{ textAlign: 'center', color: '#dc3545' }}>
              {error}
            </p>
          )}
          {!loading && !error && elections.map((election) => {
            const isActive = election.status === 'active';
            return (
            <div key={election._id} className="card" style={{
              border: isActive ? '2px solid var(--primary-green)' : '1px solid #e9ecef',
              position: 'relative'
            }}>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '20px',
                  backgroundColor: 'var(--primary-green)',
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}>
                  LIVE
                </div>
              )}
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  color: 'var(--primary-green)', 
                  fontSize: '1.3rem',
                  marginBottom: '0.5rem'
                }}>
                  {election.title}
                </h3>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '1rem' 
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? 'var(--accent-green)' : 'var(--orange)',
                    marginRight: '8px'
                  }}></div>
                  <span style={{ 
                    color: isActive ? 'var(--accent-green)' : 'var(--orange)',
                    fontWeight: '500'
                  }}>
                    {election.status}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  padding: '0.5rem 0',
                  borderTop: '1px solid #e9ecef',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                      Start Date
                    </p>
                    <p style={{ margin: 0, fontWeight: '500' }}>
                      {formatDate(election.startDate)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                      End Date
                    </p>
                    <p style={{ margin: 0, fontWeight: '500' }}>
                      {formatDate(election.endDate)}
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    color: 'var(--primary-green)',
                    fontWeight: '500'
                  }}>
                    {isActive ? 'Active' : 'Completed'}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                {isActive && (
                  <Link 
                    to="/vote"
                    state={{ electionId: election._id }}
                    className="btn btn-primary"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    Vote Now
                  </Link>
                )}
              </div>
            </div>
            );
          })}
          {!loading && !error && elections.length === 0 && (
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--primary-green)' }}>No Elections Available Yet</h3>
              <p style={{ color: 'var(--dark-grey)', marginBottom: 0 }}>
                Elections will appear here after admin creates and activates them.
              </p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div style={{ textAlign: 'center' }}>
          <Link 
            to="/parties" 
            className="btn btn-outline"
            style={{ 
              padding: '16px 32px', 
              fontSize: '1.1rem',
              marginRight: '1rem'
            }}
          >
            View Available Parties
          </Link>
          <Link 
            to="/candidates" 
            className="btn btn-primary"
            style={{ 
              padding: '16px 32px', 
              fontSize: '1.1rem'
            }}
          >
            Meet Candidates
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OngoingElections;
