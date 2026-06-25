import React, { useState } from 'react';
import  "../CSS/voter-management.css";
import Sidebar from '../components/Sidebar';
const VoterManagement = () => {
  // Mock data based on your image
  const [voters] = useState([
    { id: 1, name: 'Ali Ahmad', cnic: '****-12345', email: 'hnrane.f@example.com', phone: '0300-1234567', status: 'Verified' },
    { id: 2, name: 'Fatima Khan', cnic: '****-22345', email: 'fatima.khan@exa', phone: '0300-1234567', status: 'Pending' },
    { id: 3, name: 'Umar Ali', cnic: '****-32345', email: 'umarali@example', phone: '0321-9876543', status: 'Blocked' },
    { id: 4, name: 'Aisha Zaman', cnic: '****-42345', email: 'aisha.zaman@ex', phone: '0321-9876543', status: 'Blocked' },
    { id: 5, name: 'Saad Mehmood', cnic: '****-52345', email: '0333-5687890', phone: '0333-4567890', status: 'Verified' },
  ]);


  return (
    <div className="voter-container">
      <Sidebar />
      <div className="content-wrapper">
        <div className="voter-header">
          <h1>Voter Management</h1>
          <p>View, search, and manage registered voters</p>
        </div>

        <div className="search-section">
          <input type="text" className="search-input" placeholder="Enter CNIC or Name" />
          <select className="status-select">
            <option>Status</option>
          </select>
          <button className="search-btn">Search</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>CNIC</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {voters.map((voter, index) => (
                <tr key={index}>
                  <td>{voter.name}</td>
                  <td>{voter.cnic}</td>
                  <td style={{color: '#888'}}>{voter.email}</td>
                  <td>{voter.phone}</td>
                  <td>
                    <span className={`status-pill ${voter.status.toLowerCase()}`}>
                      {voter.status}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn">View</button>
                    <button className="action-btn">Block</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VoterManagement;