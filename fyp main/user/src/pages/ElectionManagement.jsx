import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config/api';

const ElectionManagement = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchElections = async () => {
    try {
      setError('');
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/elections?page=1&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load elections');
      }
      setElections(data.elections || []);
    } catch (e) {
      setError(e?.message || 'Failed to load elections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const grouped = useMemo(() => {
    const groups = {
      active: [],
      upcoming: [],
      completed: [],
      cancelled: []
    };

    elections.forEach((election) => {
      const key = groups[election.status] ? election.status : 'upcoming';
      groups[key].push(election);
    });

    return groups;
  }, [elections]);

  const updateStatus = async (id, status) => {
    try {
      setActionLoading(id);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/elections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to set election to ${status}`);
      }
      await fetchElections();
    } catch (e) {
      setError(e?.message || 'Failed to update election status.');
    } finally {
      setActionLoading('');
    }
  };

  const deleteElection = async (id) => {
    if (!window.confirm('Delete this election?')) return;
    try {
      setActionLoading(id);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/elections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete election');
      }
      await fetchElections();
    } catch (e) {
      setError(e?.message || 'Failed to delete election.');
    } finally {
      setActionLoading('');
    }
  };

  const renderTable = (items, emptyTitle, emptyText) => (
    <div className="admin-table-wrap">
      {items.length === 0 ? (
        <div className="admin-empty">
          <strong>{emptyTitle}</strong>
          {emptyText}
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Election</th>
              <th>Constituency</th>
              <th>Dates</th>
              <th>Linked Candidates</th>
              <th>Voters</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((election) => (
              <tr key={election._id}>
                <td>
                  <strong>{election.title}</strong>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{election.type}</div>
                </td>
                <td>{election.constituency}</td>
                <td>
                  <div>{new Date(election.startDate).toLocaleDateString()}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>to {new Date(election.endDate).toLocaleDateString()}</div>
                </td>
                <td>{Array.isArray(election.candidates) ? election.candidates.length : 0}</td>
                <td>{Number(election.eligibleVoters || 0).toLocaleString()}</td>
                <td>
                  <span className={`admin-badge ${election.status}`}>{election.status}</span>
                </td>
                <td>
                  <div className="admin-toolbar-actions">
                    {election.status !== 'active' && (
                      <button className="admin-secondary-btn" onClick={() => updateStatus(election._id, 'active')} disabled={actionLoading === election._id}>
                        Activate
                      </button>
                    )}
                    {election.status !== 'cancelled' && (
                      <button className="admin-secondary-btn" onClick={() => updateStatus(election._id, 'cancelled')} disabled={actionLoading === election._id}>
                        Cancel
                      </button>
                    )}
                    <button className="admin-danger-btn" onClick={() => deleteElection(election._id)} disabled={actionLoading === election._id}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="admin-shell">
      <Sidebar activePage="elections" />

      <div className="admin-main">
        <div className="admin-page">
          <section className="admin-hero" style={{ marginBottom: 22 }}>
            <div>
              <h1>Manage Elections</h1>
              <p>All elections are loaded from the database here, and status changes immediately affect what the voter side can see.</p>
              <div className="admin-hero-meta">
                <span className="admin-pill">
                  <i className="fa-solid fa-database" />
                  Synced with public election listings
                </span>
                <span className="admin-pill">
                  <i className="fa-solid fa-users-viewfinder" />
                  Linked candidates drive the vote page
                </span>
              </div>
            </div>

            <div className="admin-toolbar-actions">
              <Link className="admin-ghost-btn" to="/admin/add-election">
                Add Election
              </Link>
            </div>
          </section>

          {error && <div className="admin-alert error">{error}</div>}

          <section className="admin-stat-grid" style={{ marginBottom: 22 }}>
            <div className="admin-stat-card">
              <div className="admin-metric-icon"><i className="fa-solid fa-play" /></div>
              <strong>{grouped.active.length}</strong>
              <span>Active Elections</span>
            </div>
            <div className="admin-stat-card">
              <div className="admin-metric-icon"><i className="fa-solid fa-hourglass-start" /></div>
              <strong>{grouped.upcoming.length}</strong>
              <span>Upcoming Elections</span>
            </div>
            <div className="admin-stat-card">
              <div className="admin-metric-icon"><i className="fa-solid fa-check-double" /></div>
              <strong>{grouped.completed.length}</strong>
              <span>Completed Elections</span>
            </div>
            <div className="admin-stat-card">
              <div className="admin-metric-icon"><i className="fa-solid fa-ban" /></div>
              <strong>{grouped.cancelled.length}</strong>
              <span>Cancelled Elections</span>
            </div>
          </section>

          <div className="admin-grid">
            <section className="admin-panel">
              <div className="admin-section-title">
                <div>
                  <h2>All Election Records</h2>
                  <p>Use status controls carefully. Active elections are visible to voters and can accept votes inside the schedule window.</p>
                </div>
              </div>

              {loading
                ? <div className="admin-empty"><strong>Loading elections...</strong>Please wait while records are fetched from the server.</div>
                : renderTable(
                    elections,
                    'No elections found',
                    'Create the first election and it will appear here immediately.'
                  )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectionManagement;
