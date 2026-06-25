import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config/api';

const reportOptions = [
  { value: 'summary', label: 'Election Summary', description: 'Overview of election status, dates, and totals.' },
  { value: 'turnout', label: 'Voter Turnout', description: 'Participation metrics and turnout reporting.' },
  { value: 'results', label: 'Candidate Results', description: 'Candidate-wise results and current tallies.' },
  { value: 'fraud', label: 'Fraud Report', description: 'Security and anomaly reporting for the selected election.' }
];

const ReportsExport = () => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [reportType, setReportType] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/admin/elections?page=1&limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const loadedElections = data.elections || [];
          setElections(loadedElections);
          if (loadedElections.length > 0) {
            setSelectedElection((current) => current || loadedElections[0]._id);
          }
        }
      } catch (e) {
        console.error('Failed to load elections:', e);
      }
    };

    fetchElections();
  }, []);

  const generateReport = async () => {
    if (!selectedElection) {
      setError('Please select an election.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/reports/${selectedElection}?type=${reportType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to generate report');
        }
        throw new Error('Failed to generate report');
      }

      const blob = await res.blob();
      if (contentType.includes('application/json')) {
        const text = await blob.text();
        const json = JSON.parse(text || '{}');
        throw new Error(json.message || 'Failed to generate report');
      }

      const contentDisposition = res.headers.get('content-disposition') || '';
      const suggestedNameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const fileName = suggestedNameMatch?.[1] || `report_${reportType}_${selectedElection}.csv`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (e) {
      setError(e?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-shell">
      <Sidebar activePage="reports" />

      <div className="admin-main">
        <div className="admin-page">
          <section className="admin-hero" style={{ marginBottom: 22 }}>
            <div>
              <h1>Reports & Export</h1>
              <p>Generate export-ready election reports without the page falling behind the admin sidebar or breaking the layout.</p>
              <div className="admin-hero-meta">
                <span className="admin-pill">
                  <i className="fa-solid fa-file-export" />
                  Export center
                </span>
                <span className="admin-pill">
                  <i className="fa-solid fa-table-list" />
                  Consistent admin styling
                </span>
              </div>
            </div>
          </section>

          {error && <div className="admin-alert error">{error}</div>}

          <div className="admin-grid two">
            <section className="admin-panel">
              <div className="admin-section-title">
                <div>
                  <h2>Generate Report</h2>
                  <p>Select the election and report type you want to export.</p>
                </div>
              </div>

              <div className="admin-field" style={{ marginBottom: 18 }}>
                <label htmlFor="report-election">Election</label>
                <select
                  id="report-election"
                  className="admin-select"
                  value={selectedElection}
                  onChange={(e) => setSelectedElection(e.target.value)}
                >
                  <option value="">Choose an election</option>
                  {elections.map((election) => (
                    <option key={election._id} value={election._id}>
                      {election.title} ({election.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-card-list" style={{ marginBottom: 20 }}>
                {reportOptions.map((option) => (
                  <label key={option.value} className="admin-elevated-row" style={{ cursor: 'pointer' }}>
                    <div>
                      <h4 style={{ marginBottom: 6 }}>{option.label}</h4>
                      <p style={{ color: '#64748b' }}>{option.description}</p>
                    </div>
                    <input
                      type="radio"
                      name="reportType"
                      value={option.value}
                      checked={reportType === option.value}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                  </label>
                ))}
              </div>

              <button className="admin-primary-btn" onClick={generateReport} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </section>

            <section className="admin-panel">
              <div className="admin-section-title">
                <div>
                  <h2>How It Works</h2>
                  <p>Use this export panel the same way you use the other admin management pages.</p>
                </div>
              </div>

              <div className="admin-card-list">
                <div className="admin-elevated-row">
                  <div>
                    <h4>1. Choose an election</h4>
                    <p>Only elections loaded from the admin API appear here.</p>
                  </div>
                </div>
                <div className="admin-elevated-row">
                  <div>
                    <h4>2. Select a report format</h4>
                    <p>Summary, turnout, results, or fraud export.</p>
                  </div>
                </div>
                <div className="admin-elevated-row">
                  <div>
                    <h4>3. Download the file</h4>
                    <p>The generated document downloads automatically after the backend responds.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsExport;
