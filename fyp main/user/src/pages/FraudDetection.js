
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FraudDetection = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    warnings: 0,
    resolvedAlerts: 0
  });

  const [alerts] = useState([
    {
      id: 1,
      timestamp: '2025-01-15 14:30:25',
      type: 'Duplicate CNIC',
      details: 'CNIC 12345-1234567-1 used twice in Lahore',
      severity: 'CRITICAL',
      status: 'Open'
    },
    {
      id: 2,
      timestamp: '2025-01-15 14:25:10',
      type: 'Multiple IPs',
      details: 'Same user accessed from 3 different IP addresses',
      severity: 'Warning',
      status: 'Investigating'
    },
    {
      id: 3,
      timestamp: '2025-01-15 14:20:45',
      type: 'Abnormal Voting',
      details: 'Unusual voting pattern detected in Region X',
      severity: 'CRITICAL',
      status: 'Open'
    },
    {
      id: 4,
      timestamp: '2025-01-15 14:15:30',
      type: 'Failed Verification',
      details: 'Multiple failed biometric attempts',
      severity: 'Warning',
      status: 'Resolved'
    }
  ]);

  const [insights] = useState([
    'Unusual spike detected in Region X (3.2x higher than average)',
    'CNIC duplication attempts; 8 in last 24 hours',
    'Multiple IP access patterns from 15 different users',
    'Biometric failure rate increased by 25% in last hour'
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        totalAlerts: prev.totalAlerts + Math.floor(Math.random() * 3),
        criticalAlerts: prev.criticalAlerts + Math.floor(Math.random() * 2),
        warnings: prev.warnings + Math.floor(Math.random() * 2),
        resolvedAlerts: prev.resolvedAlerts + Math.floor(Math.random() * 1)
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'var(--red)';
      case 'Warning': return 'var(--yellow)';
      case 'Resolved': return 'var(--accent-green)';
      default: return 'var(--dark-grey)';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'var(--accent-green)';
      case 'Investigating': return 'var(--blue)';
      case 'Resolved': return 'var(--dark-grey)';
      default: return 'var(--dark-grey)';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            color: 'var(--primary-green)', 
            fontSize: '2.5rem', 
            marginBottom: '0.5rem' 
          }}>
            {t('fraud_detection_alerts_title')}
          </h1>
          <p style={{ color: 'var(--dark-grey)', fontSize: '1.1rem' }}>
            {t('ai_powered_monitoring_description')}
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              color: 'var(--primary-green)', 
              marginBottom: '1rem' 
            }}>
              ⚠️
            </div>
            <h3 style={{ 
              marginBottom: '0.5rem', 
              color: 'var(--primary-green)',
              fontSize: '2.5rem',
              fontWeight: '700'
            }}>
              {stats.totalAlerts.toLocaleString()}
            </h3>
            <p style={{ color: 'var(--dark-grey)', margin: 0 }}>{t('total_alerts_detected')}</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ 
              fontSize: '3rem', 
              color: 'var(--red)', 
              marginBottom: '1rem' 
            }}>
              🔴
            </div>
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'var(--red)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              !
            </div>
            <h3 style={{ 
              marginBottom: '0.5rem', 
              color: 'var(--red)',
              fontSize: '2.5rem',
              fontWeight: '700'
            }}>
              {stats.criticalAlerts.toLocaleString()}
            </h3>
            <p style={{ color: 'var(--dark-grey)', margin: 0 }}>{t('critical_alerts')}</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ 
              fontSize: '3rem', 
              color: 'var(--yellow)', 
              marginBottom: '1rem' 
            }}>
              🟡
            </div>
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'var(--yellow)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              !
            </div>
            <h3 style={{ 
              marginBottom: '0.5rem', 
              color: 'var(--yellow)',
              fontSize: '2.5rem',
              fontWeight: '700'
            }}>
              {stats.warnings.toLocaleString()}
            </h3>
            <p style={{ color: 'var(--dark-grey)', margin: 0 }}>{t('warnings')}</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              color: 'var(--accent-green)', 
              marginBottom: '1rem' 
            }}>
              ✅
            </div>
            <h3 style={{ 
              marginBottom: '0.5rem', 
              color: 'var(--accent-green)',
              fontSize: '2.5rem',
              fontWeight: '700'
            }}>
              {stats.resolvedAlerts.toLocaleString()}
            </h3>
            <p style={{ color: 'var(--dark-grey)', margin: 0 }}>{t('resolved_alerts')}</p>
          </div>
        </div>

        {/* Alerts Log */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            color: 'var(--primary-green)', 
            marginBottom: '1.5rem' 
          }}>
            {t('alerts_log_title')}
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>{t('timestamp')}</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>{t('type_of_alert')}</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>{t('details')}</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>{t('severity')}</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                      {alert.timestamp}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                      {alert.type}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                      {alert.details}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        backgroundColor: getSeverityColor(alert.severity),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        {alert.severity}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        backgroundColor: getStatusColor(alert.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        {alert.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights Section */}
        <div className="card">
          <h3 style={{ 
            color: 'var(--primary-green)', 
            marginBottom: '1.5rem' 
          }}>
            {t('all_insights_title')}
          </h3>
          
          <div style={{ marginBottom: '2rem' }}>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              margin: 0
            }}>
              {insights.map((insight, index) => (
                <li key={index} style={{ 
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid var(--primary-green)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ 
                      color: 'var(--primary-green)',
                      fontSize: '1.2rem'
                    }}>
                      📊
                    </span>
                    <span style={{ color: 'var(--dark-grey)' }}>
                      {insight}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Trend Chart Placeholder */}
          <div style={{ 
            height: '200px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #dee2e6'
          }}>
            <div style={{ textAlign: 'center', color: 'var(--dark-grey)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
              <p style={{ margin: 0, fontWeight: '500' }}>{t('trend_analysis_chart_title')}</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                {t('real_time_fraud_detection_trends')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ 
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link 
              to="/admin" 
              className="btn btn-primary"
              style={{ padding: '12px 24px' }}
            >
              {t('back_to_dashboard')}
            </Link>
            <button 
              className="btn btn-outline"
              style={{ padding: '12px 24px' }}
              onClick={() => window.print()}
            >
              {t('export_report')}
            </button>
            <button 
              className="btn btn-outline"
              style={{ padding: '12px 24px' }}
            >
              {t('refresh_alerts')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudDetection;
