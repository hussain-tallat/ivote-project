import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../CSS/style.css";

const AdminRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulation of registration logic
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Registered User:", formData);
    // Redirect to Login Page after successful registration
    navigate("/");
  };

  return (
    <div className="login-container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="login-card" style={{ width: "100%", maxWidth: "400px", padding: "30px", background: "white", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "25px", color: "#333" }}>Admin Registration</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label className="label">Full Name</label>
            <input
              type="text"
              name="fullName"
              className="input-field"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label className="label">Email Address</label>
            <input
              type="email"
              name="email"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              className="input-field"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="input-field"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="admin-login-btn" style={{ width: "100%" }}>
            Register
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ color: "#666" }}>
            Already have an account? <Link to="/" style={{ color: "#007bff", fontWeight: "500" }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegistration;