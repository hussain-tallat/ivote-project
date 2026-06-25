import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const pageShell = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(15, 118, 110, 0.14), transparent 28%), radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.12), transparent 24%), linear-gradient(180deg, #f8fbfa 0%, #edf5f4 100%)',
  padding: '2rem 0 3rem'
};

const panelSurface = {
  background: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.10)',
  borderRadius: 28
};

const actionButtonBase = {
  flex: 1,
  minWidth: 150,
  borderRadius: 16,
  padding: '14px 18px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '0.98rem',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease',
  boxShadow: '0 14px 30px rgba(15, 23, 42, 0.10)'
};

const logoutButtonStyle = {
  ...actionButtonBase,
  background: 'linear-gradient(135deg, #0f766e, #115e59)',
  color: 'white'
};

const deleteButtonStyle = {
  ...actionButtonBase,
  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
  color: 'white'
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isRecoveryLogin, setIsRecoveryLogin] = useState(false);
  const [upcomingElection, setUpcomingElection] = useState(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');
  const [securityStatus, setSecurityStatus] = useState({
    mfaReady: false,
    hasSecurityQuestions: false,
    loginMethod: ''
  });
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [requestingHalqa, setRequestingHalqa] = useState(false);
  const [halqaStatusMessage, setHalqaStatusMessage] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsRecoveryLogin(localStorage.getItem('recoveryLogin') === 'true');
        const sessionMessage = sessionStorage.getItem('loginSuccessMessage');
        if (sessionMessage) {
          setLoginSuccessMessage(sessionMessage);
          sessionStorage.removeItem('loginSuccessMessage');
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        const meRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const meData = await meRes.json();
        if (meRes.ok && meData.success) {
          setUserData(meData.user);
          localStorage.setItem('userData', JSON.stringify(meData.user));
          setSecurityStatus({
            mfaReady: Boolean(
              meData.user?.biometricSetup?.fingerprint?.isSetup ||
              meData.user?.biometricSetup?.face?.isSetup ||
              meData.user?.biometricSetup?.faceRecognition?.isSetup ||
              meData.user?.fingerprintCredential?.credentialId ||
              meData.user?.faceCredential?.credentialId ||
              (Array.isArray(meData.user?.biometricCredentials) && meData.user.biometricCredentials.length > 0) ||
              (Array.isArray(meData.user?.webAuthnCredentials) && meData.user.webAuthnCredentials.length > 0)
            ),
            hasSecurityQuestions: Array.isArray(meData.user?.securityQuestions) && meData.user.securityQuestions.length >= 3,
            loginMethod: meData.user?.lastLoginMethod || ''
          });

          if (!meData.user?.halqaId && meData.user?.halqaRequestedAt) {
            setHalqaStatusMessage(`Halqa assignment requested on ${new Date(meData.user.halqaRequestedAt).toLocaleDateString()}. Admin will assign your halqa soon.`);
          }
        }

        const upcomingRes = await fetch(`${API_BASE}/api/public/elections?status=active`);
        const upcomingData = await upcomingRes.json();
        if (upcomingRes.ok && upcomingData.success && Array.isArray(upcomingData.elections) && upcomingData.elections.length) {
          const sorted = [...upcomingData.elections].sort(
            (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
          setUpcomingElection(sorted[0]);
        }
      } catch (error) {
        console.error('User dashboard load error:', error);
      }
    };

    loadDashboard();
  }, []);

  const dashboardStats = useMemo(() => ([
    {
      label: 'Biometric Status',
      value: securityStatus.mfaReady ? 'Ready' : 'Pending',
      tone: securityStatus.mfaReady ? '#166534' : '#92400e',
      bg: securityStatus.mfaReady ? '#dcfce7' : '#fef3c7'
    },
    {
      label: 'Security Questions',
      value: securityStatus.hasSecurityQuestions ? 'Configured' : 'Pending',
      tone: securityStatus.hasSecurityQuestions ? '#166534' : '#92400e',
      bg: securityStatus.hasSecurityQuestions ? '#dcfce7' : '#fef3c7'
    },
    {
      label: 'Halqa Assignment',
      value: userData?.halqaId
        ? `Assigned (${userData?.halqaId})`
        : userData?.halqaRequestedAt
          ? 'Requested'
          : 'Pending',
      tone: userData?.halqaId ? '#166534' : '#92400e',
      bg: userData?.halqaId ? '#dcfce7' : '#fef3c7'
    },
    {
      label: 'Voting Status',
      value: userData?.hasVotedStatus || (Array.isArray(userData?.hasVoted) && userData?.hasVoted?.length > 0 ? 'Voted' : 'Eligible'),
      tone: Array.isArray(userData?.hasVoted) && userData?.hasVoted?.length > 0 ? '#1d4ed8' : '#0f766e',
      bg: Array.isArray(userData?.hasVoted) && userData?.hasVoted?.length > 0 ? '#dbeafe' : '#ccfbf1'
    }
  ]), [securityStatus, userData]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('recoveryLogin');
    navigate('/login');
  };

  const requestHalqaAssignment = async () => {
    if (!userData) return;
    setRequestingHalqa(true);
    setHalqaStatusMessage('');
    setAccountError('');
    setAccountMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login first.');

      const response = await fetch(`${API_BASE}/api/auth/halqa-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to request halqa assignment');
      }

      setAccountMessage(data.message || 'Halqa assignment request sent.');
      const updatedUser = { ...userData, halqaRequestedAt: data.halqaRequestedAt || new Date().toISOString() };
      setUserData(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setHalqaStatusMessage(`Halqa assignment requested on ${new Date(updatedUser.halqaRequestedAt).toLocaleDateString()}. Admin will assign your halqa soon.`);
    } catch (error) {
      setAccountError(error.message || 'Failed to request halqa assignment');
    } finally {
      setRequestingHalqa(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your account? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingAccount(true);
    setAccountError('');
    setAccountMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login first.');

      const response = await fetch(`${API_BASE}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete account');
      }

      setAccountMessage('Your account has been deleted successfully.');
      logout();
    } catch (error) {
      setAccountError(error.message || 'Unable to delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div style={pageShell}>
      <div className="container">
        <section
          style={{
            ...panelSurface,
            background:
              'linear-gradient(135deg, rgba(15, 77, 58, 0.98) 0%, rgba(21, 111, 99, 0.96) 58%, rgba(30, 64, 175, 0.94) 100%)',
            color: 'white',
            padding: '34px 30px',
            marginBottom: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', inset: 'auto -60px -60px auto', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', fontWeight: 700, marginBottom: 18 }}>
              Secure Voter Dashboard
            </div>
            <h1 style={{ color: 'white', fontSize: '2.45rem', marginBottom: '0.75rem' }}>
              Welcome{userData?.name ? `, ${userData?.name}` : ''}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.05rem', maxWidth: 760, marginBottom: 24 }}>
              Manage your secure voting journey from one place: review elections, verify account readiness, and move smoothly from candidate research to ballot submission.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              {dashboardStats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.12)'
                  }}
                >
                  <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{stat.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {isRecoveryLogin && (
          <div style={{ ...panelSurface, padding: '16px 18px', marginBottom: '1rem', background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412' }}>
            You logged in through backup recovery. If this is your own device, update biometrics now. If this is a shared device, complete only what you need and log out immediately after.
          </div>
        )}

        {loginSuccessMessage && (
          <div style={{ ...panelSurface, padding: '16px 18px', marginBottom: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46' }}>
            <strong>{loginSuccessMessage}</strong>
            <div style={{ marginTop: 6, color: '#047857' }}>
              Your identity was verified successfully and your secure voting session is active.
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <section style={{ ...panelSurface, padding: '24px' }}>
              <h2 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Quick Actions</h2>
              <p style={{ margin: '0 0 18px 0', color: '#64748b' }}>
                Move through the voter experience in a clear order with secure checkpoints.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
                {[
                  { title: 'View Parties', to: '/parties', tone: '#0f766e', bg: '#ecfeff' },
                  { title: 'Browse Candidates', to: '/candidates', tone: '#1d4ed8', bg: '#eff6ff' },
                  { title: 'Open Elections', to: '/elections', tone: '#7c3aed', bg: '#f5f3ff' },
                  { title: 'Manage Security', to: '/security-settings', tone: '#b45309', bg: '#fffbeb' }
                ].map((action) => (
                  <Link
                    key={action.title}
                    to={action.to}
                    style={{
                      textDecoration: 'none',
                      padding: '18px 16px',
                      borderRadius: 20,
                      background: action.bg,
                      color: action.tone,
                      fontWeight: 800,
                      border: '1px solid rgba(148, 163, 184, 0.18)'
                    }}
                  >
                    {action.title}
                  </Link>
                ))}
              </div>
            </section>

            <section style={{ ...panelSurface, padding: '24px' }}>
              <h2 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Upcoming / Active Election</h2>
              {upcomingElection ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ padding: '16px 18px', borderRadius: 20, background: '#f8fafc' }}>
                    <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Election Title</div>
                    <div style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>{upcomingElection.title}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div style={{ padding: '16px 18px', borderRadius: 20, background: '#f8fafc' }}>
                      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Type</div>
                      <div style={{ color: '#0f172a', fontWeight: 700, marginTop: 4 }}>{upcomingElection.type || 'General'}</div>
                    </div>
                    <div style={{ padding: '16px 18px', borderRadius: 20, background: '#f8fafc' }}>
                      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Start</div>
                      <div style={{ color: '#0f172a', fontWeight: 700, marginTop: 4 }}>{new Date(upcomingElection.startDate).toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '16px 18px', borderRadius: 20, background: '#f8fafc' }}>
                      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>End</div>
                      <div style={{ color: '#0f172a', fontWeight: 700, marginTop: 4 }}>{new Date(upcomingElection.endDate).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Link to="/elections" style={{ color: '#0f766e', fontWeight: 800, textDecoration: 'none' }}>
                      Open election flow
                    </Link>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, color: '#64748b' }}>No active election is available right now.</p>
              )}
            </section>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <section style={{ ...panelSurface, padding: '24px' }}>
              <h2 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Profile</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ padding: '14px 16px', borderRadius: 18, background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</div>
                  <div style={{ color: '#0f172a', fontWeight: 700, marginTop: 4 }}>{userData?.name || 'Not available'}</div>
                </div>
                <div style={{ padding: '14px 16px', borderRadius: 18, background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</div>
                  <div style={{ color: '#0f172a', fontWeight: 700, marginTop: 4 }}>{userData?.email || 'Not available'}</div>
                </div>
                <div style={{ padding: '14px 16px', borderRadius: 18, background: '#f8fafc' }}>
                  <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone</div>
                  <div style={{ color: '#0f172a', fontWeight: 700, marginTop: 4 }}>{userData?.phone || 'Not available'}</div>
                </div>
              </div>

              {userData?.status !== 'approved' && (
                <div style={{ marginBottom: 16, padding: '16px', borderRadius: 20, background: '#fff7ed', border: '1px solid #fcd34d' }}>
                  <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Account Approval</div>
                  <p style={{ margin: 0, color: '#854d0e' }}>
                    Your account is currently <strong>{userData?.status || 'pending'}</strong>. Voting is disabled until the administrator approves your account and assigns your halqa.
                  </p>
                </div>
              )}

              <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    ...logoutButtonStyle
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = 'translateY(-2px)';
                    event.currentTarget.style.boxShadow = '0 18px 36px rgba(15, 118, 110, 0.22)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateY(0)';
                    event.currentTarget.style.boxShadow = '0 14px 30px rgba(15, 23, 42, 0.10)';
                  }}
                >
                  Log Out
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  style={{
                    ...deleteButtonStyle,
                    cursor: deletingAccount ? 'not-allowed' : 'pointer',
                    opacity: deletingAccount ? 0.75 : 1
                  }}
                  onMouseEnter={(event) => {
                    if (deletingAccount) return;
                    event.currentTarget.style.transform = 'translateY(-2px)';
                    event.currentTarget.style.boxShadow = '0 18px 36px rgba(239, 68, 68, 0.22)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateY(0)';
                    event.currentTarget.style.boxShadow = '0 14px 30px rgba(15, 23, 42, 0.10)';
                  }}
                >
                  {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
                </button>
              </div>

              {(accountError || accountMessage || halqaStatusMessage) && (
                <div style={{ marginTop: 18 }}>
                  {accountError && (
                    <div style={{ color: '#b91c1c', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 16, padding: '12px 14px' }}>
                      {accountError}
                    </div>
                  )}
                  {accountMessage && (
                    <div style={{ color: '#047857', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 16, padding: '12px 14px' }}>
                      {accountMessage}
                    </div>
                  )}
                  {halqaStatusMessage && !accountMessage && (
                    <div style={{ color: '#0f172a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: '12px 14px' }}>
                      {halqaStatusMessage}
                    </div>
                  )}
                </div>
              )}

              {!userData?.halqaId && (
                <div style={{ marginTop: 22, padding: '18px', borderRadius: 20, background: '#f8fafc', border: '1px solid #dbeafe' }}>
                  <div style={{ marginBottom: 12, color: '#1d4ed8', fontWeight: 700 }}>Halqa assignment needed</div>
                  <p style={{ margin: 0, color: '#475569' }}>
                    Your account is not yet assigned to a halqa. You can request assignment now and the administrator will approve your account and assign the correct halqa.
                  </p>
                  <button
                    type="button"
                    onClick={requestHalqaAssignment}
                    disabled={requestingHalqa || Boolean(userData?.halqaRequestedAt)}
                    style={{
                      marginTop: 14,
                      borderRadius: 14,
                      border: 'none',
                      padding: '12px 18px',
                      background: requestingHalqa ? '#93c5fd' : '#2563eb',
                      color: 'white',
                      cursor: requestingHalqa ? 'not-allowed' : 'pointer',
                      fontWeight: 700
                    }}
                  >
                    {requestingHalqa ? 'Requesting...' : userData?.halqaRequestedAt ? 'Request Sent' : 'Request Halqa Assignment'}
                  </button>
                </div>
              )}
            </section>

            <section style={{ ...panelSurface, padding: '24px' }}>
              <h2 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Security Status</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {dashboardStats.map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 18,
                      background: stat.bg,
                      color: stat.tone,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: 800
                    }}
                  >
                    <span>{stat.label}</span>
                    <span>{stat.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ color: '#64748b', marginBottom: 8 }}>Last login method</div>
                <strong style={{ color: '#0f172a' }}>{securityStatus.loginMethod || 'Unknown'}</strong>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
