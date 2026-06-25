import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const ActivityLogsPage = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getActivityIcon = (type) => {
    const icons = {
      'registration': '📝',
      'otp_verification': '✉️',
      'fingerprint_setup': '👆',
      'face_setup': '📸',
      'security_questions_set': '🔐',
      'login_attempt': '🔓',
      'login_success': '✅',
      'login_failed': '❌',
      'fingerprint_verification': '🔒',
      'face_verification': '👤',
      'vote_cast': '🗳️',
      'vote_view_receipt': '📄',
      'password_reset_request': '🔑',
      'password_reset_success': '✔️',
      'profile_update': '✏️',
      'account_locked': '🚫',
      'suspicious_activity': '⚠️'
    };
    return icons[type] || '📌';
  };

  const getStatusColor = (status) => {
    const colors = {
      'success': '#28a745',
      'failed': '#dc3545',
      'suspicious': '#ff9800',
      'blocked': '#6c757d'
    };
    return colors[status] || '#007bff';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.status === filter);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{ color: '#00563B', marginBottom: '0.5rem' }}>Activity Logs</h1>
            <p style={{ color: '#666' }}>Track all your account activities</p>
          </div>
          <button
            onClick={() => navigate('/user-dashboard')}
            style={{
              backgroundColor: '#00563B',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['all', 'success', 'failed', 'suspicious'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '8px 16px',
                  border: filter === status ? 'none' : '1px solid #ddd',
                  backgroundColor: filter === status ? '#00563B' : 'white',
                  color: filter === status ? 'white' : '#333',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textTransform: 'capitalize'
                }}
              >
                {status} {status === 'all' && `(${activities.length})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #00563B',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '1rem', color: '#666' }}>Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <p style={{ color: '#999', fontSize: '18px' }}>No activities found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredActivities.map((activity, index) => (
              <div
                key={activity._id || index}
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${getStatusColor(activity.status)}`,
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                    <div style={{ fontSize: '32px' }}>
                      {getActivityIcon(activity.actionType)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        color: '#333',
                        marginBottom: '5px',
                        fontSize: '16px',
                        textTransform: 'capitalize'
                      }}>
                        {activity.actionType.replace(/_/g, ' ')}
                      </h3>
                      <p style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
                        {activity.description}
                      </p>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#999' }}>
                        <span>📅 {formatDate(activity.timestamp)}</span>
                        <span>🌐 {activity.ipAddress || 'N/A'}</span>
                        {activity.deviceInfo?.browser && (
                          <span>💻 {activity.deviceInfo.browser} on {activity.deviceInfo.os}</span>
                        )}
                      </div>
                      {activity.riskScore > 0 && (
                        <div style={{
                          marginTop: '10px',
                          display: 'inline-block',
                          padding: '4px 12px',
                          backgroundColor: activity.riskScore >= 70 ? '#ffebee' : '#fff3cd',
                          color: activity.riskScore >= 70 ? '#c62828' : '#856404',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Risk Score: {activity.riskScore}/100
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{
                    padding: '6px 14px',
                    backgroundColor: activity.status === 'success' ? '#d4edda' :
                      activity.status === 'failed' ? '#f8d7da' :
                        activity.status === 'suspicious' ? '#fff3cd' : '#e2e3e5',
                    color: activity.status === 'success' ? '#155724' :
                      activity.status === 'failed' ? '#721c24' :
                        activity.status === 'suspicious' ? '#856404' : '#383d41',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsPage;
