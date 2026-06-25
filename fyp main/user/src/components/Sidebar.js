import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>iVotePK</h2>
        <p>Admin Workspace</p>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <i className="fa-solid fa-home"></i>
          <span>Home</span>
        </Link>
        <Link to="/admin/dashboard" className={`nav-item ${isActive('/admin/dashboard')}`}>
          <i className="fa-solid fa-gauge-high"></i>
          <span>Dashboard</span>
        </Link>
        
        <Link to="/admin/elections" className={`nav-item ${isActive('/admin/elections')}`}>
          <i className="fa-regular fa-calendar-check"></i>
          <span>Elections</span>
        </Link>
        
        <Link to="/admin/add-election" className={`nav-item ${isActive('/admin/add-election')}`}>
          <i className="fa-solid fa-plus-circle"></i>
          <span>Add Election</span>
        </Link>
        
        <Link to="/admin/candidates" className={`nav-item ${isActive('/admin/candidates')}`}>
          <i className="fa-solid fa-users"></i>
          <span>Candidates</span>
        </Link>
        
        <Link to="/admin/add-candidate" className={`nav-item ${isActive('/admin/add-candidate')}`}>
          <i className="fa-solid fa-user-plus"></i>
          <span>Add Candidate</span>
        </Link>
        
        <Link to="/admin/parties" className={`nav-item ${isActive('/admin/parties')}`}>
          <i className="fa-solid fa-flag"></i>
          <span>Parties</span>
        </Link>
        
        <Link to="/admin/add-party" className={`nav-item ${isActive('/admin/add-party')}`}>
          <i className="fa-solid fa-square-plus"></i>
          <span>Add Party</span>
        </Link>
        
        <Link to="/admin/voters" className={`nav-item ${isActive('/admin/voters')}`}>
          <i className="fa-solid fa-id-card"></i>
          <span>Voter Management</span>
        </Link>
        
        <Link to="/admin/fraud-detection" className={`nav-item ${isActive('/admin/fraud-detection')}`}>
          <i className="fa-solid fa-shield-halved"></i>
          <span>Fraud Detection</span>
        </Link>
        
        <Link to="/admin/live-analytics" className={`nav-item ${isActive('/admin/live-analytics')}`}>
          <i className="fa-solid fa-chart-line"></i>
          <span>Live Analytics</span>
        </Link>
        
        <Link to="/admin/reports" className={`nav-item ${isActive('/admin/reports')}`}>
          <i className="bi bi-file-earmark-text"></i>
          <span>Reports</span>
        </Link>
        
        <Link
          to="/admin/auth"
          className="nav-item logout"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userData');
          }}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Logout</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
