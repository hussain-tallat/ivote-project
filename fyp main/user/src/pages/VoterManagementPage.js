import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config/api';

const buttonBase = {
  borderRadius: 8,
  padding: '7px 12px',
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'all 0.2s ease'
};

const VoterManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingMode, setPendingMode] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [halqaOptions, setHalqaOptions] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [workingAction, setWorkingAction] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/users?role=voter&page=1&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load users');
      setUsers(data.users || []);
    } catch (e) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/voters/pending?page=1&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load pending voters');
      setPendingUsers(data.users || []);

      // Preload halqas per district
      const uniqueDistricts = [...new Set((data.users || []).map(u => u.districtCode).filter(Boolean))];
      const halqaMap = {};
      await Promise.all(uniqueDistricts.map(async (code) => {
        try {
          const r = await fetch(`${API_BASE}/api/public/districts/${code}/halqas`);
          const d = await r.json();
          if (r.ok && d.success) {
            halqaMap[code] = d.halqas || [];
          } else {
            halqaMap[code] = [];
          }
        } catch (e) {
          halqaMap[code] = [];
        }
      }));
      setHalqaOptions(halqaMap);
    } catch (e) {
      setError(e?.message || 'Failed to load pending voters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (pendingMode) loadPending();
  }, [pendingMode]);

  const toggleStatus = async (user) => {
    try {
      setWorkingAction(`status-${user._id}`);
      setError('');
      setMessage('');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/users/${user._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update user');
      await loadUsers();
      setMessage(data.message || 'User status updated successfully.');
    } catch (e) {
      setError(e?.message || 'Failed to update user status');
    } finally {
      setWorkingAction('');
    }
  };

  const resetVote = async (user) => {
    const confirmed = window.confirm(`Reset vote for ${user.name || user.email || 'this voter'}? They will be able to vote again.`);
    if (!confirmed) return;

    try {
      setWorkingAction(`reset-${user._id}`);
      setError('');
      setMessage('');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/users/${user._id}/reset-vote`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to reset vote');
      await loadUsers();
      const votesDeleted = data.reset?.votesDeleted;
      setMessage(data.message || `Vote reset successfully${votesDeleted ? ` (${votesDeleted} vote removed)` : ''}.`);
    } catch (e) {
      setError(e?.message || 'Failed to reset vote');
    } finally {
      setWorkingAction('');
    }
  };

  const resetAllVotes = async () => {
    const confirmed = window.confirm('Reset all votes? Every voter will be able to vote again.');
    if (!confirmed) return;

    try {
      setWorkingAction('reset-all');
      setError('');
      setMessage('');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/users/reset-all-votes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to reset all votes');
      await loadUsers();
      const votesDeleted = data.reset?.votesDeleted;
      setMessage(data.message || `All votes reset successfully${votesDeleted ? ` (${votesDeleted} votes removed)` : ''}.`);
    } catch (e) {
      setError(e?.message || 'Failed to reset all votes');
    } finally {
      setWorkingAction('');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      String(u.email || '').toLowerCase().includes(q) ||
      String(u.cnic || '').includes(q) ||
      String(u.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="dashboard-container" style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <Sidebar />
      <div className="dashboard-content" style={{ marginLeft: 260, padding: 24 }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <h2 className="dashboard-header" style={{ margin: 0 }}>Voter Management</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by CNIC or Email"
              className="form-input"
              style={{ maxWidth: 280 }}
            />
            <button
              type="button"
              onClick={() => setPendingMode((s) => !s)}
              disabled={loading || Boolean(workingAction)}
              style={{
                ...buttonBase,
                border: '1px solid #10b981',
                color: pendingMode ? '#065f46' : '#10b981',
                background: pendingMode ? '#ecfdf5' : '#fff'
              }}
            >
              {pendingMode ? 'Back to Voters' : 'View New Voter Requests'}
            </button>
            <button
              type="button"
              onClick={loadUsers}
              disabled={loading || Boolean(workingAction)}
              style={{
                ...buttonBase,
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                background: '#fff'
              }}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={resetAllVotes}
              disabled={loading || Boolean(workingAction)}
              style={{
                ...buttonBase,
                border: '1px solid #2563eb',
                color: '#fff',
                background: '#2563eb',
                opacity: loading || Boolean(workingAction) ? 0.7 : 1
              }}
            >
              {workingAction === 'reset-all' ? 'Resetting All...' : 'Reset All Votes'}
            </button>
          </div>
        </div>

        {message && <div className="admin-alert success" style={{ marginBottom: 12 }}>{message}</div>}
        {error && <div className="admin-alert error" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="card" style={{ border: '1px solid #e5e7eb' }}>
          {loading ? (
            <p>Loading...</p>
          ) : pendingMode ? (
            pendingUsers.length === 0 ? (
              <p style={{ color: '#64748b' }}>No pending voter requests.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Voter</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>CNIC</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>District</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Requested At</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Assign Halqa</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 8px' }}>{u.name || 'Unnamed'}<div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div></td>
                      <td style={{ padding: '10px 8px' }}>{u.cnic}</td>
                      <td style={{ padding: '10px 8px' }}>{u.district || u.districtCode}</td>
                      <td style={{ padding: '10px 8px' }}>{u.halqaRequestedAt ? new Date(u.halqaRequestedAt).toLocaleDateString() : 'Not requested'}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <select defaultValue="" id={`halqa-${u._id}`} style={{ padding: 8, borderRadius: 8, minWidth: 160 }}>
                          <option value="">Select halqa</option>
                          {(halqaOptions[u.districtCode] || []).map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <button
                          onClick={async () => {
                            const sel = document.getElementById(`halqa-${u._id}`);
                            const halqa = sel ? sel.value : '';
                            if (!halqa) return alert('Please select halqa before approving');
                            if (!window.confirm(`Approve ${u.name || u.cnic} and assign ${halqa}?`)) return;
                            try {
                              setWorkingAction(`approve-${u._id}`);
                              setError('');
                              const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
                              const res = await fetch(`${API_BASE}/api/admin/voters/${u._id}/approve`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ halqaId: halqa })
                              });
                              const data = await res.json();
                              if (!res.ok || !data.success) throw new Error(data.message || 'Failed to approve voter');
                              setMessage(data.message || 'Voter approved');
                              await loadPending();
                            } catch (e) {
                              setError(e?.message || 'Failed to approve voter');
                            } finally {
                              setWorkingAction('');
                            }
                          }}
                          style={{ ...buttonBase, border: '1px solid #10b981', color: '#065f46', background: '#fff' }}
                        >
                          {workingAction === `approve-${u._id}` ? 'Approving...' : 'Approve & Assign'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : filteredUsers.length === 0 ? (
            <p style={{ color: '#64748b' }}>No Voters Registered.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Voter Profile</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>CNIC</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Registration Date</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Vote Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                          {String(u.name || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name || 'Unnamed'}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px' }}>{u.cnic}</td>
                    <td style={{ padding: '10px 8px' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ color: u.isActive ? '#166534' : '#991b1b', fontWeight: 700 }}>
                        {u.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '6px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background: u.hasCastVote ? '#dbeafe' : '#dcfce7',
                          color: u.hasCastVote ? '#1d4ed8' : '#166534'
                        }}
                      >
                        {u.hasCastVote ? `Voted${u.voteCount ? ` (${u.voteCount})` : ''}` : 'Not Voted'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => resetVote(u)}
                        disabled={loading || Boolean(workingAction) || !u.hasCastVote}
                        title={u.hasCastVote ? 'Reset this voter vote' : 'This voter has not voted yet'}
                        style={{
                          ...buttonBase,
                          border: '1px solid #2563eb',
                          color: u.hasCastVote ? '#2563eb' : '#94a3b8',
                          background: '#fff',
                          marginRight: 8,
                          opacity: loading || Boolean(workingAction) || !u.hasCastVote ? 0.65 : 1,
                          cursor: loading || Boolean(workingAction) || !u.hasCastVote ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {workingAction === `reset-${u._id}` ? 'Resetting...' : 'Reset Vote'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(u)}
                        disabled={loading || Boolean(workingAction)}
                        style={{
                          ...buttonBase,
                          border: '1px solid #ef4444',
                          color: '#ef4444',
                          background: '#fff',
                          opacity: loading || Boolean(workingAction) ? 0.65 : 1,
                          cursor: loading || Boolean(workingAction) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {workingAction === `status-${u._id}` ? 'Updating...' : u.isActive ? 'Block' : 'Unblock'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoterManagementPage;
