import React from "react";
import "../CSS/AccountSuspended.css"; // ✅ CORRECT PATH
import { FaExclamationTriangle } from "react-icons/fa";

const AccountSuspended = () => {
  return (
    <div className="account-suspended-wrapper">
      {/* -------- MAIN CARD -------- */}
      <div className="suspended-card">
        <h2 className="suspended-title">Account Suspended</h2>

        <div className="warning-box">
          <FaExclamationTriangle className="warning-icon" />
          <p>Your account has been temporarily suspended.</p>
        </div>

        <p className="suspended-text">
          For security reasons, you cannot log in or access your account for the
          next 24 hours.
        </p>

        <div className="suspension-details">
          <h4>Suspension Details</h4>
          <p>
            <strong>Reason:</strong> Multiple voting attempts detected from the
            same CNIC
          </p>
          <p>
            <strong>Suspension Duration:</strong> 24 Hours
          </p>
          <p>
            <strong>Access Restored:</strong> 24/04/2024 – 10:45 AM
          </p>
        </div>

        <div className="suspension-actions">
          <h4>What you can do</h4>
          <p>Please wait until the suspension period is over.</p>
          <p>
            If you believe this is a mistake, you can{" "}
            <span className="contact-support">contact support</span>.
          </p>
        </div>

        <div className="button-group">
          <button className="btn-primary">Contact Support</button>
          <button className="btn-secondary">Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default AccountSuspended;
