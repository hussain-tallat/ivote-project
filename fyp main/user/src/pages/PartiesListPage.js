import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config/api';

const PartiesListPage = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadParties = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/parties?page=1&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load parties');
      setParties(data.parties || []);
    } catch (e) {
      setError(e?.message || 'Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  const deleteParty = async (id) => {
    if (!window.confirm('Delete this party?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/parties/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete party');
      await loadParties();
    } catch (e) {
      alert(e?.message || 'Failed to delete party');
    }
  };

  return (
    <div className="dashboard-container" style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <Sidebar />
      <div className="dashboard-content" style={{ marginLeft: 260, padding: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="dashboard-header" style={{ margin: 0 }}>Parties</h2>
          <Link to="/admin/add-party" className="btn btn-primary">Add Party</Link>
        </div>

        {error && <div style={{ color: '#dc3545', marginBottom: 10 }}>{error}</div>}

        <div className="card" style={{ border: '1px solid #e5e7eb' }}>
          {loading ? (
            <p>Loading parties...</p>
          ) : parties.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '24px 10px' }}>
              No Parties Found. Please add one to get started.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {parties.map((p) => (
                <div key={p._id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, background: '#fff' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5', display: 'grid', placeItems: 'center', fontSize: 22, color: '#065f46', marginBottom: 10 }}>
                    {p.symbol?.slice(0, 2) || '🏳️'}
                  </div>
                  <h4 style={{ margin: '0 0 4px 0' }}>{p.name}</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{p.shortName}</p>
                  <p style={{ margin: '8px 0', color: '#334155', fontSize: 13 }}>Leader: {p.leader || '—'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: p.isActive ? '#dcfce7' : '#fee2e2', color: p.isActive ? '#166534' : '#991b1b' }}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button className="btn btn-outline" onClick={() => deleteParty(p._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartiesListPage;

