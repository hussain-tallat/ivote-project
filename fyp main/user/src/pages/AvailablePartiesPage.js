import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';

const AvailablePartiesPage = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadParties = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/public/parties`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load parties');
        }
        setParties(data.parties || []);
      } catch (e) {
        setError(e?.message || 'Failed to load parties');
      } finally {
        setLoading(false);
      }
    };

    loadParties();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7fbfa 0%, #edf5f4 100%)', padding: '2rem 0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '2rem', background: 'linear-gradient(135deg, #0f4d3a 0%, #156f63 100%)', color: 'white', borderRadius: 28, padding: '34px 24px', boxShadow: '0 24px 60px rgba(15, 77, 58, 0.18)' }}>
          <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '1rem' }}>
            Available Parties
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.1rem', maxWidth: '680px', margin: '0 auto' }}>
            Review the political parties that are currently published in the system before moving to candidates and voting.
          </p>
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center' }}>Loading parties...</div>
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', color: '#dc3545' }}>{error}</div>
        ) : parties.length === 0 ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary-green)' }}>No parties available yet</h3>
            <p style={{ color: 'var(--dark-grey)', marginBottom: 0 }}>
              Published parties will appear here after the admin adds them.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {parties.map((party) => (
              <div key={party._id} className="card" style={{ border: '1px solid #e5e7eb', borderRadius: 24, boxShadow: '0 18px 40px rgba(15,23,42,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: party.color || '#ecfdf5',
                    color: '#0f172a',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800
                  }}>
                    {party.shortName?.slice(0, 2) || party.symbol?.slice(0, 2) || 'P'}
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--primary-green)', margin: 0 }}>{party.name}</h3>
                    <p style={{ color: 'var(--dark-grey)', margin: '4px 0 0 0' }}>{party.shortName || party.symbol}</p>
                  </div>
                </div>
                <p style={{ color: 'var(--dark-grey)', marginBottom: '0.75rem' }}>
                  Leader: {party.leader || 'Not provided'}
                </p>
                <p style={{ color: 'var(--dark-grey)', marginBottom: 0 }}>
                  {party.description || 'No party description has been added yet.'}
                </p>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <Link to="/candidates" className="btn btn-primary" style={{ padding: '16px 32px', marginRight: '1rem', textDecoration: 'none' }}>
            View Candidates
          </Link>
          <Link to="/elections" className="btn btn-outline" style={{ padding: '16px 32px', textDecoration: 'none' }}>
            Continue to Voting Flow
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AvailablePartiesPage;
