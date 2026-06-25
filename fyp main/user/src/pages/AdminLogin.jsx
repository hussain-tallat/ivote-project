import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../CSS/style.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulation of login logic
    console.log("Logging in with:", credentials);
    // Redirect to Dashboard
    navigate("/admin-dashboard");
  };

  return (
    <div className="login-container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="login-card" style={{ width: "100%", maxWidth: "400px", padding: "30px", background: "white", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "25px", color: "#333" }}>Admin Login</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label className="label">Email Address</label>
            <input
              type="email"
              name="email"
              className="input-field"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              className="input-field"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="admin-login-btn" style={{ width: "100%" }}>
            Login
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link to="/admin-registration" style={{ color: "#007bff", fontWeight: "500" }}>Create an Account</Link>
          <Link to="/admin-forgot-password" style={{ fontSize: "0.9em", color: "#666" }}>Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;