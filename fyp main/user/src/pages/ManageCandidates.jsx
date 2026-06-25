import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const ManageCandidates = () => {
  return (
    <>
      {/* NOTE: Do NOT render Navbar or Footer here — App.js already includes them.
          This avoids duplicate header/footer. */}

      {/* Large page title (matches the big heading in your mockup) */}
      <div style={{ textAlign: "center", paddingTop: "26px", paddingBottom: "10px" }}>
        <h1 style={{ fontSize: "56px", margin: 0, fontWeight: 500, color: "#111" }}>
          Candidate Management
        </h1>
      </div>

      {/* Main Dashboard Structure */}
      <div className="dashboard-container">
        {/* Sidebar */}
        <Sidebar activePage="manage-candidates" />

        {/* Main Content Area */}
        <main className="dashboard-content">
          {/* small header row with admin avatar on right (like your mock) */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10
          }}>
            <div>
              <h2 className="dashboard-header" style={{ marginBottom: 6 }}>Manage Candidates</h2>
              <p style={{ margin: 0, color: "#666" }}>
              </p>
            </div>

            {/* admin user circle */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "#e9eef0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
              }}>
                AU
              </div>
              <div style={{ color: "#444", fontSize: 14 }}>Admin User</div>
            </div>
          </div>

          {/* Table Card (centered large card like mock) */}
          <section className="table-section" style={{ padding: 28 }}>
            <div className="table-card-inner">
              <table className="dashboard-table" aria-label="Candidates table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}></th>
                    <th>Name</th>
                    <th>Party</th>
                    <th>Halka</th>
                    <th>Election Seat</th>
                    <th>Manifesto</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Placeholder empty rows to match the mock */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td><input type="checkbox" /></td>
                      <td style={{ minHeight: 36 }}></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Action buttons row */}
              <div style={{
                marginTop: 18,
                display: "flex",
                alignItems: "center",
                gap: 12
              }}>
                <button className="btn-block" style={{ padding: "8px 14px", borderRadius: 6 }}>
                  Block Candidate
                </button>

                <button className="btn-delete" style={{ padding: "8px 14px", borderRadius: 6 }}>
                  Delete Candidate
                </button>

                <div style={{ marginLeft: "auto" }}>
                  <Link to="/add-candidate">
                    <button className="btn-add" style={{ padding: "8px 14px", borderRadius: 6 }}>
                      Add Candidate
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default ManageCandidates;
