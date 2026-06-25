import React from "react";
import "../CSS/live-analytics.css"; // ✅ FIXED PATH

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

import { Pie, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

const LiveAnalytics = () => {
  const pieData = {
    labels: ["Candidate 1", "Candidate 2", "Candidate 3", "Candidate 4", "Candidate 5"],
    datasets: [
      {
        data: [28, 22, 18, 15, 17],
        backgroundColor: ["#9ad9b7", "#6ecf9c", "#4caf7d", "#3f6f5e", "#1b4d3e"],
        borderWidth: 0,
      },
    ],
  };

  const lineData = {
    labels: ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"],
    datasets: [
      {
        label: "Votes Cast",
        data: [50, 350, 500, 850, 420],
        fill: true,
        backgroundColor: "rgba(46, 125, 102, 0.2)",
        borderColor: "#2e7d66",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="live-analytics">
      <h1 className="title">Live Voting Analytics</h1>
      <p className="subtitle">
        Real-time insights into votes cast across candidates and regions
      </p>

      <div className="stats">
        <div className="stat-card">
          <p>Total Votes Cast</p>
          <h2>5,410</h2>
        </div>
        <div className="stat-card">
          <p>Registered Voters</p>
          <h2>18,705</h2>
        </div>
        <div className="stat-card">
          <p>Turnout %</p>
          <h2>28.9%</h2>
        </div>
        <div className="stat-card alert">
          <p>Flagged Alerts</p>
          <h2>2</h2>
        </div>
      </div>

      <div className="charts">
        <div className="chart-box">
          <h3>Votes By Candidates</h3>
          <Pie data={pieData} />
        </div>

        <div className="chart-box full">
          <h3>Votes Cast Over Time</h3>
          <Line data={lineData} />
        </div>
      </div>
    </div>
  );
};

export default LiveAnalytics;
