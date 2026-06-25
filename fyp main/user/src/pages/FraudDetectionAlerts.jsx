import React from "react";
import "../CSS/fraud-detection-alerts.css";

const FraudDetectionAlerts = () => {
  return (
    <div className="fraud-container">
      {/* HEADER */}
      <div className="fraud-header">
        <h1>Fraud Detection Alerts</h1>
        <p>AI-powered monitoring of suspicious activities in real-time.</p>
      </div>

      {/* STATS */}
      <div className="fraud-stats">
        <div className="stat-card">
          <p>Total Alerts Detected</p>
          <h2>128</h2>
        </div>

        <div className="stat-card">
          <p>
            Critical Alerts <span className="badge red">6</span>
          </p>
          <h2>5</h2>
        </div>

        <div className="stat-card">
          <p>
            Warnings <span className="badge yellow">13</span>
          </p>
          <h2>33</h2>
        </div>

        <div className="stat-card">
          <p>Resolved Alerts</p>
          <h2>90</h2>
        </div>
      </div>

      {/* CONTENT */}
      <div className="fraud-content">
        {/* ALERTS TABLE */}
        <div className="alerts-table">
          <h3>Alerts Log</h3>

          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type of Alert</th>
                <th>Details</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>2024-04-24 10:15</td>
                <td>Duplicate CNIC</td>
                <td>CNIC used twice in Lahore</td>
                <td><span className="severity critical">Critical</span></td>
                <td><span className="status open">Open</span></td>
              </tr>

              <tr>
                <td>2024-04-24 10:05</td>
                <td>Multiple IPs</td>
                <td>50 votes from same IP in 2 mins</td>
                <td><span className="severity critical">Critical</span></td>
                <td><span className="status investigating">Investigating</span></td>
              </tr>

              <tr>
                <td>2024-04-24 09:50</td>
                <td>Abnormal Voting Spike</td>
                <td>Abnormal voting spike in Faisalabad</td>
                <td><span className="severity warning">Warning</span></td>
                <td><span className="status open">Open</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI INSIGHTS */}
        <div className="ai-insights">
          <h3>AI Insights</h3>
          <ul>
            <li>Unusual spike detected in Region X (5× higher than average)</li>
            <li>CNIC duplication attempts: 12 in last 30 minutes</li>
          </ul>

          {/* ✅ REAL GRAPH */}
          <div className="graph-box">
            <svg viewBox="0 0 300 100" className="graph-svg">
              <polyline
                points="0,70 40,50 80,60 120,35 160,45 200,25 240,40 280,20"
                fill="none"
                stroke="#1b4d3e"
                strokeWidth="3"
              />
              <line x1="0" y1="90" x2="300" y2="90" className="graph-axis" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudDetectionAlerts;
