import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config/api';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not logged in.');
          return;
        }

        const res = await fetch(`${API_BASE}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load admin stats');
        }
        setDashboard(data);
      } catch (e) {
        setError(e?.message || 'Failed to load dashboard.');
      }
    };

    loadDashboard();
  }, []);

  const stats = dashboard?.stats || {};
  const fraudAlerts = dashboard?.fraudAlerts || [];
  const criticalFraudAlerts = fraudAlerts.filter((item) => String(item?.severity || '').toLowerCase() === 'critical').length;

  const metricCards = [
    { title: 'Registered Voters', value: stats.totalUsers || 0, icon: 'fa-users' },
    { title: 'Active Elections', value: stats.activeElections || 0, icon: 'fa-calendar-check' },
    { title: 'Published Parties', value: stats.totalParties || 0, icon: 'fa-flag' },
    { title: 'Critical Alerts', value: criticalFraudAlerts, icon: 'fa-shield-halved' }
  ];

  const quickLinks = [
    { to: '/admin/add-election', label: 'Create Election', desc: 'Launch a new voter-facing election.', icon: 'fa-plus' },
    { to: '/admin/add-candidate', label: 'Add Candidate', desc: 'Create and link a candidate to elections.', icon: 'fa-user-plus' },
    { to: '/admin/candidates', label: 'Manage Candidates', desc: 'Review candidate publication and election links.', icon: 'fa-users-gear' },
    { to: '/admin/live-analytics', label: 'Live Analytics', desc: 'Watch turnout and system activity in real time.', icon: 'fa-chart-line' }
  ];

  return (
    <div className="admin-shell">
      <Sidebar activePage="dashboard" />

      <div className="admin-main">
        <div className="admin-page">
          <section className="admin-hero" style={{ marginBottom: 22 }}>
            <div>
              <h1>Admin Dashboard</h1>
              <p>Everything important is visible here: voter volume, election activity, fraud signals, and where to act next.</p>
              <div className="admin-hero-meta">
                <span className="admin-pill">
                  <i className="fa-solid fa-server" />
                  Backend on port 5000
                </span>
                <span className="admin-pill">
                  <i className="fa-solid fa-globe" />
                  Frontend on port 3000
                </span>
              </div>
            </div>

            <div className="admin-toolbar-actions">
              <Link className="admin-ghost-btn" to="/admin/elections">
                Manage Elections
              </Link>
              <Link className="admin-ghost-btn" to="/admin/voters">
                Review Voters
              </Link>
            </div>
          </section>

          {error && <div className="admin-alert error">{error}</div>}

          <section className="admin-stat-grid" style={{ marginBottom: 22 }}>
            {metricCards.map((card) => (
              <div key={card.title} className="admin-stat-card">
                <div className="admin-metric-icon">
                  <i className={`fa-solid ${card.icon}`} />
                </div>
                <strong>{Number(card.value).toLocaleString()}</strong>
                <span>{card.title}</span>
              </div>
            ))}
          </section>

          <div className="admin-grid two">
            <section className="admin-panel">
              <div className="admin-section-title">
                <div>
                  <h2>Quick Actions</h2>
                  <p>Jump straight into the work that affects the voter-facing experience.</p>
                </div>
              </div>
              <div className="admin-card-list">
                {quickLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="admin-elevated-row"
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div className="admin-metric-icon">
                        <i className={`fa-solid ${item.icon}`} />
                      </div>
                      <div>
                        <h4 style={{ color: '#0f172a' }}>{item.label}</h4>
                        <p style={{ color: '#64748b' }}>{item.desc}</p>
                      </div>
                    </div>
                    <span className="admin-link-btn">Open</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-section-title">
                <div>
                  <h2>Election Pulse</h2>
                  <p>High-level system state pulled from the current database.</p>
                </div>
              </div>

              {Number(stats.totalVotes || 0) === 0 ? (
                <div className="admin-empty">
                  <strong>Waiting for live vote activity</strong>
                  The dashboard is ready. As soon as votes are cast, totals and analytics will appear here.
                </div>
              ) : (
                <div className="admin-card-list">
                  <div className="admin-elevated-row">
                    <div>
                      <h4>Total Votes Cast</h4>
                      <p>All confirmed votes recorded so far.</p>
                    </div>
                    <strong style={{ fontSize: '1.5rem', color: '#0f172a' }}>{Number(stats.totalVotes || 0).toLocaleString()}</strong>
                  </div>
                  <div className="admin-elevated-row">
                    <div>
                      <h4>Fraud Alerts</h4>
                      <p>Signals that should be reviewed by the admin team.</p>
                    </div>
                    <span className={`admin-badge ${criticalFraudAlerts > 0 ? 'cancelled' : 'active'}`}>
                      {criticalFraudAlerts > 0 ? `${criticalFraudAlerts} critical` : 'No critical issues'}
                    </span>
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

export default AdminDashboard;
