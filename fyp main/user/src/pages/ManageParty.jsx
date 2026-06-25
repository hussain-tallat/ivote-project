import React from "react";
import Sidebar from "../components/Sidebar";
import { Link } from "react-router-dom";

const ManageParty = () => {
  return (
    <>
      {/* PAGE TITLE (CENTERED) */}
      <h1 className="manage-party-title">Party Management</h1>

      <div className="dashboard-container">

        {/* LEFT SIDEBAR */}
        <Sidebar activePage="manage-party" />

        {/* MAIN CONTENT */}
        <main className="dashboard-content">

          {/* ADMIN USER (TOP-RIGHT) */}
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            marginBottom: "10px", 
            alignItems: "center" 
          }}>
            <div className="admin-avatar">AU</div>
            <span style={{ marginLeft: "10px", color: "#444" }}>Admin User</span>
          </div>

          {/* (Removed old “Manage Party” heading here) */}

          {/* TABLE SECTION */}
          <div className="table-section">
            <div className="table-card-inner">

              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}></th>
                    <th>Photo</th>
                    <th>Party Name</th>
                    <th>Abbreviation</th>
                    <th>Symbol</th>
                    <th>Manifesto</th>
                  </tr>
                </thead>

                <tbody>
                  {/* EMPTY ROW FROM YOUR DESIGN */}
                  <tr>
                    <td><input type="checkbox" /></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>

                  <tr>
                    <td><input type="checkbox" /></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>

                  <tr>
                    <td><input type="checkbox" /></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>

              {/* ACTION BUTTONS */}
              <div style={{ display: "flex", marginTop: "20px", gap: "12px" }}>
                <button className="btn-block">Block Party</button>
                <button className="btn-delete">Delete Party</button>

                <div style={{ marginLeft: "auto" }}>
                  <Link to="/add-party">
                    <button className="btn-add">Add Party</button>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ManageParty;
