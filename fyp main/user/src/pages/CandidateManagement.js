import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config/api';

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParty, setFilterParty] = useState('all');
  const [parties, setParties] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [candidatesRes, partiesRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/candidates?page=1&limit=200`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/admin/parties?page=1&limit=200`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const [candidateData, partyData] = await Promise.all([candidatesRes.json(), partiesRes.json()]);
        if (!candidatesRes.ok || !candidateData.success) {
          throw new Error(candidateData.message || 'Failed to load candidates');
        }

        setCandidates(candidateData.candidates || []);
        if (partiesRes.ok && partyData.success) {
          setParties(partyData.parties || []);
        }
      } catch (e) {
        setError(e?.message || 'Failed to load candidates');
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this candidate?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/candidates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete candidate');
      }
      setCandidates((prev) => prev.filter((candidate) => candidate._id !== id));
    } catch (e) {
      setError(e?.message || 'Failed to delete candidate');
    }
  };

  const filteredCandidates = useMemo(() => candidates.filter((candidate) => {
    const candidateName = String(candidate.name || '').toLowerCase();
    const cnic = String(candidate.cnic || '');
    const partyName = String(candidate.party?.name || '').toLowerCase();
    const halqa = String(candidate.halqaId || candidate.constituency || '').toLowerCase();
    const district = String(candidate.district || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = candidateName.includes(query) || cnic.includes(searchTerm) || halqa.includes(query) || district.includes(query);
    const matchesParty = filterParty === 'all' || partyName === filterParty.toLowerCase();
    return matchesSearch && matchesParty;
  }), [candidates, filterParty, searchTerm]);

  return (
    <div className="admin-shell">
      <Sidebar activePage="candidates" />

      <div className="admin-main">
        <div className="admin-page">
          <section className="admin-hero" style={{ marginBottom: 22 }}>
            <div>
              <h1>Candidate Management</h1>
              <p>Review every candidate, confirm which elections they are linked to, and keep voter-facing data clean and current.</p>
              <div className="admin-hero-meta">
                <span className="admin-pill">
                  <i className="fa-solid fa-users" />
                  {candidates.length} total candidates
                </span>
                <span className="admin-pill">
                  <i className="fa-solid fa-link" />
                  Election links control voter visibility
                </span>
              </div>
            </div>

            <div className="admin-toolbar-actions">
              <Link className="admin-ghost-btn" to="/admin/add-candidate">
                Add Candidate
              </Link>
            </div>
          </section>

          {error && <div className="admin-alert error">{error}</div>}

          <section className="admin-panel" style={{ marginBottom: 22 }}>
            <div className="admin-toolbar">
              <div style={{ flex: 1, minWidth: 240 }}>
                <input
                  className="admin-input"
                  type="text"
                  placeholder="Search by name or CNIC"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ minWidth: 220 }}>
                <select className="admin-select" value={filterParty} onChange={(e) => setFilterParty(e.target.value)}>
                  <option value="all">All Parties</option>
                  {parties.map((party) => (
                    <option key={party._id} value={party.name}>
                      {party.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-section-title">
              <div>
                <h2>Candidate Records</h2>
                <p>Delete carefully. Removing a candidate also removes their links from election vote lists.</p>
              </div>
            </div>

            <div className="admin-table-wrap">
              {filteredCandidates.length === 0 ? (
                <div className="admin-empty">
                  <strong>No candidates found</strong>
                  Adjust filters or create a candidate to populate this view.
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>CNIC</th>
                      <th>Party</th>
                      <th>Education</th>
                      <th>District</th>
                      <th>Halqa</th>
                      <th>Linked Elections</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate._id}>
                        <td>
                          <strong>{candidate.name}</strong>
                          <div style={{ color: '#64748b', fontSize: 13 }}>{candidate.email}</div>
                        </td>
                        <td>{candidate.cnic}</td>
                        <td>{candidate.party?.name || 'Unassigned'}</td>
                        <td>{candidate.education || '—'}</td>
                        <td>{candidate.district || 'Not set'}</td>
                        <td>{candidate.halqaId || candidate.constituency}</td>
                        <td>{Array.isArray(candidate.elections) ? candidate.elections.length : 0}</td>
                        <td>
                          <span className={`admin-badge ${candidate.status}`}>{candidate.status}</span>
                        </td>
                        <td>
                          <button className="admin-danger-btn" onClick={() => handleDelete(candidate._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CandidateManagement;
