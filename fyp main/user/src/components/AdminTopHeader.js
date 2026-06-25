import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const titleMap = {
  '/admin/dashboard': 'Dashboard',
  '/admin/elections': 'Manage Elections',
  '/admin/add-election': 'Create Election',
  '/admin/candidates': 'Manage Candidates',
  '/admin/add-candidate': 'Add Candidate',
  '/admin/parties': 'Political Parties',
  '/admin/add-party': 'Register Party',
  '/admin/voters': 'Voter Management',
  '/admin/fraud': 'Fraud Detection',
  '/admin/fraud-detection': 'Fraud Detection',
  '/admin/live-analytics': 'Live Analytics',
  '/admin/reports': 'Reports'
};

const subtitleMap = {
  '/admin/dashboard': 'Monitor the platform, watch election activity, and stay ahead of operational issues.',
  '/admin/elections': 'Review every election record and keep voter-facing events in sync.',
  '/admin/add-election': 'Launch a new election with the right schedule, constituency, and visibility.',
  '/admin/candidates': 'Track every candidate profile, linked elections, and publication status.',
  '/admin/add-candidate': 'Add a candidate and attach them to the elections voters should see.',
  '/admin/parties': 'Organize party records, symbols, and public presentation details.',
  '/admin/add-party': 'Create a party profile that can be used across candidate and election flows.',
  '/admin/voters': 'Review voter records, verification state, and account activity.',
  '/admin/fraud': 'Watch suspicious signals and investigate anomalies quickly.',
  '/admin/fraud-detection': 'Watch suspicious signals and investigate anomalies quickly.',
  '/admin/live-analytics': 'Keep an eye on turnout, activity, and real-time changes.',
  '/admin/reports': 'Prepare summaries and exports for election review.'
};

const AdminTopHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = titleMap[location.pathname] || 'Admin Panel';
  const pageSubtitle = subtitleMap[location.pathname] || 'Manage the voting platform with a single control surface.';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    navigate('/admin/auth');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 990,
        backdropFilter: 'blur(14px)',
        background: 'rgba(247, 251, 250, 0.82)',
        borderBottom: '1px solid rgba(203, 213, 225, 0.6)'
      }}
    >
      <div
        className="admin-top-header-inline"
        style={{
          padding: '14px 22px',
          display: 'flex',
          gap: 16,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f766e' }}>
            iVotePK Admin
          </div>
          <strong style={{ display: 'block', color: '#0f172a', fontSize: 20, marginTop: 2 }}>{pageTitle}</strong>
          <span style={{ color: '#64748b', fontSize: 14 }}>{pageSubtitle}</span>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="admin-secondary-btn" onClick={() => navigate('/')}>
            Public Site
          </button>
          <button className="admin-primary-btn" onClick={() => navigate('/admin/dashboard')}>
            Overview
          </button>
          <button className="admin-danger-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
      <style>
        {`
          .admin-top-header-inline {
            margin-left: 260px;
          }

          @media (max-width: 860px) {
            .admin-top-header-inline {
              margin-left: 0;
            }
          }
        `}
      </style>
    </header>
  );
};

export default AdminTopHeader;
