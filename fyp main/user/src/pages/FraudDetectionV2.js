import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config/api';
import Sidebar from '../components/Sidebar';

const severityClass = {
  critical: 'cancelled',
  high: 'cancelled',
  medium: 'pending',
  low: 'completed'
};

const statusClass = {
  detected: 'cancelled',
  investigating: 'pending',
  confirmed: 'cancelled',
  false_positive: 'completed',
  resolved: 'active'
};

const FraudDetectionV2 = () => {
  const token = useMemo(() => localStorage.getItem('token'), []);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlertId, setSelectedAlertId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');

  const loadFraudLogs = useCallback(async ({ showLoader = false } = {}) => {
    try {
      if (!token) {
        setError('Not logged in.');
        return;
      }

      setError('');
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const res = await fetch(`${API_BASE}/api/admin/fraud-logs?page=1&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch fraud logs');
      }

      const logs = data.logs || [];
      setAlerts(logs);
      if (!selectedAlertId && logs.length) {
        setSelectedAlertId(logs[0]._id);
      }
      if (selectedAlertId && !logs.some((log) => log._id === selectedAlertId)) {
        setSelectedAlertId(logs[0]?._id || '');
      }
    } catch (e) {
      setError(e?.message || 'Failed to load fraud alerts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAlertId, token]);

  useEffect(() => {
    loadFraudLogs({ showLoader: true });
    const interval = setInterval(() => {
      loadFraudLogs();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadFraudLogs]);

  const handleResolve = async (logId) => {
    if (!token || !logId) return;
    try {
      setActionLoadingId(logId);
      const res = await fetch(`${API_BASE}/api/admin/fraud-logs/${logId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: 'Reviewed and updated from admin fraud panel.' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to resolve fraud log');
      }
      await loadFraudLogs();
    } catch (e) {
      setError(e?.message || 'Failed to resolve fraud log.');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleUnblock = async (userId, logId) => {
    if (!token || !userId) return;
    try {
      setActionLoadingId(logId || userId);
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: true })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to unblock user');
      }
      await loadFraudLogs();
    } catch (e) {
      setError(e?.message || 'Failed to unblock user.');
    } finally {
      setActionLoadingId('');
    }
  };

  const stats = {
    total: alerts.length,
    critical: alerts.filter((alert) => String(alert.severity || '').toLowerCase() === 'critical').length,
    blockedUsers: alerts.filter((alert) => alert.isUserBlocked).length,
    resolved: alerts.filter((alert) => String(alert.status || '').toLowerCase() === 'resolved').length
  };

  const selectedAlert = alerts.find((alert) => alert._id === selectedAlertId) || alerts[0] || null;

  return (
    <div className="admin-shell">
      <Sidebar />

      <div className="admin-main">
        <div className="admin-page">
          <section className="admin-hero" style={{ marginBottom: 22 }}>
            <div>
              <h1>Fraud Detection</h1>
              <p>Review suspicious activity with stable live refresh, complete voter details, and clear fraud classifications.</p>
              <div className="admin-hero-meta">
                <span className="admin-pill">
                  <i className="fa-solid fa-shield-halved" />
                  Fraud review center
                </span>
                <span className="admin-pill">
                  <i className="fa-solid fa-rotate" />
                  {refreshing ? 'Refreshing in background' : 'Auto-refresh every 15s'}
                </span>
              </div>
            </div>

            <div className="admin-toolbar-actions">
              <button className="admin-secondary-btn" onClick={() => loadFraudLogs()}>
                Refresh Now
              </button>
            </div>
          </section>

          {error && <div className="admin-alert error">{error}</div>}

          <section className="admin-stat-grid" style={{ marginBottom: 22 }}>
            <div className="admin-stat-card">
              <div className="admin-metric-icon">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <strong>{stats.total}</strong>
              <span>Total Alerts</span>
            </div>
            <div className="admin-stat-card">
              <div className="admin-metric-icon">
                <i className="fa-solid fa-bell" />
              </div>
              <strong>{stats.critical}</strong>
              <span>Critical Alerts</span>
            </div>
            <div className="admin-stat-card">
              <div className="admin-metric-icon">
                <i className="fa-solid fa-user-lock" />
              </div>
              <strong>{stats.blockedUsers}</strong>
              <span>Blocked Users</span>
            </div>
            <div className="admin-stat-card">
              <div className="admin-metric-icon">
                <i className="fa-solid fa-circle-check" />
              </div>
              <strong>{stats.resolved}</strong>
              <span>Resolved Cases</span>
            </div>
          </section>

          <div className="admin-grid two">
            <section className="admin-panel">
              <div className="admin-section-title">
                <div>
                  <h2>Alerts Log</h2>
                  <p>Voter ID, email, fraud type, and action status are shown directly in the grid.</p>
                </div>
              </div>

              {loading ? (
                <div className="admin-empty">
                  <strong>Loading fraud logs</strong>
                  Pulling the latest alerts from the backend.
                </div>
              ) : alerts.length === 0 ? (
                <div className="admin-empty">
                  <strong>No fraud alerts detected</strong>
                  The monitoring system is clear right now.
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Voter ID</th>
                        <th>Email</th>
                        <th>Fraud Type</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map((alert) => {
                        const isBusy = actionLoadingId === alert._id || actionLoadingId === alert.userId?._id;
                        return (
                          <tr key={alert._id} style={{ background: selectedAlertId === alert._id ? '#f8fafc' : undefined }}>
                            <td>{alert.voterId || 'N/A'}</td>
                            <td>{alert.voterEmail || 'N/A'}</td>
                            <td>
                              <strong>{alert.fraudTypeLabel}</strong>
                            </td>
                            <td>
                              <span className={`admin-badge ${severityClass[String(alert.severity || '').toLowerCase()] || 'completed'}`}>
                                {alert.severity || 'medium'}
                              </span>
                            </td>
                            <td>
                              <span className={`admin-badge ${statusClass[String(alert.status || '').toLowerCase()] || 'pending'}`}>
                                {alert.isUserBlocked ? 'blocked' : (alert.status || 'detected')}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button className="admin-secondary-btn" onClick={() => setSelectedAlertId(alert._id)}>
                                  Details
                                </button>
                                {String(alert.status || '').toLowerCase() !== 'resolved' && (
                                  <button
                                    className="admin-primary-btn"
                                    disabled={isBusy}
                                    onClick={() => handleResolve(alert._id)}
                                  >
                                    {isBusy ? 'Working...' : 'Resolve'}
                                  </button>
                                )}
                                {alert.canUnblock && alert.userId?._id && (
                                  <button
                                    className="admin-danger-btn"
                                    disabled={isBusy}
                                    onClick={() => handleUnblock(alert.userId._id, alert._id)}
                                  >
                                    {isBusy ? 'Working...' : 'Unblock User'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="admin-panel">
              <div className="admin-section-title">
                <div>
                  <h2>Alert Details</h2>
                  <p>Inspect the exact fraud type, voter details, evidence, and the unblock status.</p>
                </div>
              </div>

              {!selectedAlert ? (
                <div className="admin-empty">
                  <strong>No alert selected</strong>
                  Choose an alert from the table to inspect it in detail.
                </div>
              ) : (
                <div className="admin-card-list">
                  <div className="admin-elevated-row">
                    <div>
                      <h4>Fraud Type</h4>
                      <p>{selectedAlert.fraudTypeLabel}</p>
                    </div>
                    <span className={`admin-badge ${severityClass[String(selectedAlert.severity || '').toLowerCase()] || 'completed'}`}>
                      {selectedAlert.severity || 'medium'}
                    </span>
                  </div>

                  <div className="admin-elevated-row">
                    <div>
                      <h4>Voter</h4>
                      <p>{selectedAlert.voterName}</p>
                    </div>
                    <div style={{ textAlign: 'right', color: '#475569' }}>
                      <div>{selectedAlert.voterId || 'N/A'}</div>
                      <div>{selectedAlert.voterEmail || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="admin-elevated-row">
                    <div>
                      <h4>Election</h4>
                      <p>{selectedAlert.electionTitle}</p>
                    </div>
                    <div style={{ textAlign: 'right', color: '#475569' }}>
                      <div>Receipt</div>
                      <div>{selectedAlert.voteReceiptNumber || 'Not linked yet'}</div>
                    </div>
                  </div>

                  <div className="admin-elevated-row">
                    <div>
                      <h4>Description</h4>
                      <p>{selectedAlert.description || 'No description available.'}</p>
                    </div>
                  </div>

                  <div className="admin-elevated-row">
                    <div>
                      <h4>Evidence</h4>
                      <p>IP: {selectedAlert.ipAddress || selectedAlert.evidence?.ipAddress || 'N/A'}</p>
                    </div>
                    <div style={{ textAlign: 'right', color: '#475569' }}>
                      <div>Risk Score</div>
                      <div>{selectedAlert.riskScore ?? 'N/A'}</div>
                    </div>
                  </div>

                  <div className="admin-elevated-row">
                    <div>
                      <h4>Detected At</h4>
                      <p>{selectedAlert.detectedAt ? new Date(selectedAlert.detectedAt).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div style={{ textAlign: 'right', color: '#475569' }}>
                      <div>Current Status</div>
                      <div>{selectedAlert.isUserBlocked ? 'Blocked user' : (selectedAlert.status || 'detected')}</div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudDetectionV2;
