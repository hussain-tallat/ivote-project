import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config/api';
// This page uses mostly inline styles; CSS is optional.
// (The project doesn't currently include `live-analytics.css`.)

import { Chart as ChartJS } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { registerables } from 'chart.js';

// Register all built-in chart.js components (ensures 'bar' is registered).
ChartJS.register(...registerables);

const LiveAnalyticsV2 = () => {
  const token = useMemo(() => localStorage.getItem('token'), []);

  const [electionId, setElectionId] = useState(null);
  const [electionTitle, setElectionTitle] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [totalVotes, setTotalVotes] = useState(0);
  const [turnoutPercentage, setTurnoutPercentage] = useState(0);
  const [candidateBars, setCandidateBars] = useState({ labels: [], values: [] });
  const [partyPie, setPartyPie] = useState({ labels: [], values: [] });

  const [timeSeries, setTimeSeries] = useState([]); // last snapshots
  const [fraudAlerts, setFraudAlerts] = useState(0);

  const pollIntervalMs = 5000;

  const pickTopN = (arr, n) => arr.slice(0, n);

  useEffect(() => {
    let cancelled = false;

    const loadElection = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/api/public/elections`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load elections');

        const first = (data.elections || [])[0];
        if (!first?._id) {
          if (!cancelled) {
            setError('No active election found. Create one from the admin elections page to see analytics.');
          }
          return;
        }

        if (!cancelled) {
          setElectionId(first._id);
          setElectionTitle(first.title || 'Election');
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load election');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadElection();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!electionId) return;

    let cancelled = false;
    let intervalId = null;

    const fetchFraudAlerts = async () => {
      // Fraud logs are admin-protected; if token missing, we skip.
      if (!token) return;
      try {
        const res = await fetch(
          `${API_BASE}/api/admin/fraud-logs?status=detected&page=1&limit=200`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok || !data.success) return;

        const logs = data.logs || [];
        const currentElectionLogs = logs.filter((l) => {
          const id = l?.electionId?._id || l?.electionId;
          return String(id) === String(electionId);
        });
        if (!cancelled) setFraudAlerts(currentElectionLogs.length);
      } catch (e) {
        // ignore
      }
    };

    const fetchResults = async () => {
      const res = await fetch(`${API_BASE}/api/public/elections/${electionId}/results`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch election results');

      const results = data.results || {};
      const total = results.totalVotes || 0;
      const turnout = results.turnoutPercentage || 0;
      const list = results.results || [];

      const sorted = [...list].sort((a, b) => (b.votes || 0) - (a.votes || 0));

      const bars = pickTopN(
        sorted.map((r) => ({ name: r?.candidateId?.name || 'Unknown', votes: r?.votes || 0 })),
        6
      );

      const partyMap = {};
      sorted.forEach((r) => {
        const partyName = r?.candidateId?.party?.name || r?.party?.name || 'Unknown';
        partyMap[partyName] = (partyMap[partyName] || 0) + (r?.votes || 0);
      });

      const parties = Object.entries(partyMap)
        .map(([name, votes]) => ({ name, votes }))
        .sort((a, b) => b.votes - a.votes);

      if (!cancelled) {
        setTotalVotes(total);
        setTurnoutPercentage(turnout);
        setCandidateBars({
          labels: bars.map((b) => b.name),
          values: bars.map((b) => b.votes)
        });
        setPartyPie({
          labels: pickTopN(parties, 5).map((p) => p.name),
          values: pickTopN(parties, 5).map((p) => p.votes)
        });

        const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setTimeSeries((prev) => {
          const next = [...prev, { label: nowLabel, value: total }];
          return next.slice(Math.max(0, next.length - 12));
        });
      }
    };

    const pollOnce = async () => {
      await Promise.allSettled([fetchResults(), fetchFraudAlerts()]);
    };

    pollOnce().catch(() => {});
    intervalId = setInterval(() => pollOnce().catch(() => {}), pollIntervalMs);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [electionId, token]);

  const barChartData = {
    labels: candidateBars.labels,
    datasets: [
      {
        label: 'Votes',
        data: candidateBars.values,
        backgroundColor: '#1b4d3e'
      }
    ]
  };

  const pieChartData = {
    labels: partyPie.labels,
    datasets: [
      {
        data: partyPie.values,
        backgroundColor: ['#9ad9b7', '#6ecf9c', '#4caf7d', '#3f6f5e', '#1b4d3e']
      }
    ]
  };

  const lineChartData = {
    labels: timeSeries.map((p) => p.label),
    datasets: [
      {
        label: 'Total Votes',
        data: timeSeries.map((p) => p.value),
        fill: true,
        backgroundColor: 'rgba(46, 125, 102, 0.2)',
        borderColor: '#2e7d66',
        tension: 0.35
      }
    ]
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--dark-grey)' }}>Loading live analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#dc3545' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <Sidebar />
      <div className="live-analytics" style={{ marginLeft: 260, padding: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
          <h1 className="title" style={{ margin: 0, fontSize: 24 }}>Live Analytics</h1>
          <p className="subtitle" style={{ marginTop: 4 }}>
            Real-time trends for <strong>{electionTitle}</strong> (polling every {pollIntervalMs / 1000}s)
            <span style={{ marginLeft: 10, color: '#10b981', fontWeight: 700 }}>● Live</span>
          </p>
        </div>

      <div className="stats">
        <div className="stat-card">
          <p>Total Votes Cast</p>
          <h2>{totalVotes.toLocaleString()}</h2>
        </div>
        <div className="stat-card">
          <p>Turnout %</p>
          <h2>{turnoutPercentage ? `${turnoutPercentage}%` : '—'}</h2>
        </div>
        <div className="stat-card alert">
          <p>Fraud Alerts</p>
          <h2>{fraudAlerts}</h2>
        </div>
      </div>

      {totalVotes === 0 ? (
        <div className="card" style={{ textAlign: 'center', border: '1px dashed #cbd5e1', boxShadow: 'none' }}>
          Real-time analytics will activate once the first vote is cast.
        </div>
      ) : (
      <div className="charts">
        <div className="chart-box">
          <h3>Votes by Candidate</h3>
          <Bar data={barChartData} redraw />
        </div>

        <div className="chart-box">
          <h3>Votes by Party</h3>
          <Pie data={pieChartData} redraw />
        </div>

        <div className="chart-box full">
          <h3>Total Votes Over Time</h3>
          <Line data={lineChartData} redraw />
        </div>
      </div>
      )}
      </div>
    </div>
  );
};

export default LiveAnalyticsV2;

