import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config/api';

const initialForm = {
  name: '',
  party: '',
  cnic: '',
  email: '',
  phone: '',
  education: '',
  experience: '',
  districtCode: '',
  halqaId: '',
  constituency: '',
  biography: '',
  status: 'active',
  elections: []
};

const normalizeCnic = (value) => String(value || '').replace(/\D/g, '');

const AddCandidate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [parties, setParties] = useState([]);
  const [elections, setElections] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const token = localStorage.getItem('token');
        const [partiesRes, electionsRes, districtsRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/parties?page=1&limit=200`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/admin/elections?page=1&limit=200`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/public/districts`)
        ]);

        const [partiesData, electionsData, districtsData] = await Promise.all([partiesRes.json(), electionsRes.json(), districtsRes.json()]);
        if (partiesRes.ok && partiesData.success) {
          setParties(partiesData.parties || []);
        }
        if (electionsRes.ok && electionsData.success) {
          setElections(electionsData.elections || []);
        }
        if (districtsRes.ok && districtsData.success) {
          setDistricts(districtsData.districts || []);
        }
      } catch {
        // The form can still render; validation will protect submission if lookups are missing.
      }
    };

    loadLookups();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      if (name === 'districtCode') {
        return { ...prev, districtCode: value, halqaId: '', constituency: '' };
      }
      if (name === 'halqaId') {
        return { ...prev, halqaId: value, constituency: value };
      }
      return { ...prev, [name]: value };
    });
    setErrors((prev) => ({ ...prev, [name]: '', general: '' }));
  };

  const selectedDistrict = districts.find((district) => district.code === form.districtCode);
  const districtHalqas = selectedDistrict?.halqas || [];

  const toggleElection = (electionId) => {
    setForm((prev) => ({
      ...prev,
      elections: prev.elections.includes(electionId)
        ? prev.elections.filter((id) => id !== electionId)
        : [...prev.elections, electionId]
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Candidate name is required.';
    if (!form.party) nextErrors.party = 'Please select a party.';

    const normalizedCnic = normalizeCnic(form.cnic);
    if (!normalizedCnic) {
      nextErrors.cnic = 'CNIC is required.';
    } else if (!/^\d{13}$/.test(normalizedCnic)) {
      nextErrors.cnic = 'CNIC must contain exactly 13 digits.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    }

    if (!form.districtCode) nextErrors.districtCode = 'District is required.';
    if (!form.halqaId) nextErrors.halqaId = 'Halqa is required.';
    if (!form.biography.trim()) nextErrors.biography = 'Biography is required.';
    if (form.elections.length === 0) nextErrors.elections = 'Link the candidate to at least one election so voters can see them in the vote flow.';

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: form.name.trim(),
        cnic: normalizeCnic(form.cnic),
        email: form.email.trim(),
        phone: form.phone.trim(),
        education: form.education.trim(),
        experience: form.experience.trim(),
        party: form.party,
        districtCode: form.districtCode,
        district: selectedDistrict?.name,
        halqaId: form.halqaId,
        constituency: form.halqaId,
        biography: form.biography.trim(),
        age: 35,
        status: form.status,
        elections: form.elections
      };

      const res = await fetch(`${API_BASE}/api/admin/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create candidate');
      }

      navigate('/admin/candidates');
    } catch (e) {
      setErrors({ general: e?.message || 'Failed to create candidate' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-shell">
      <Sidebar activePage="add-candidate" />

      <div className="admin-main">
        <div className="admin-page">
          <section className="admin-hero" style={{ marginBottom: 22 }}>
            <div>
              <h1>Add Candidate</h1>
              <p>Create a candidate profile, normalize the CNIC correctly for the database, and link them to voter-facing elections right away.</p>
              <div className="admin-hero-meta">
                <span className="admin-pill">
                  <i className="fa-solid fa-id-card" />
                  Stores CNIC as 13 digits
                </span>
                <span className="admin-pill">
                  <i className="fa-solid fa-link" />
                  Links directly into election vote lists
                </span>
              </div>
            </div>
          </section>

          {errors.general && <div className="admin-alert error">{errors.general}</div>}

          <form className="admin-panel" onSubmit={handleSubmit}>
            <div className="admin-section-title">
              <div>
                <h2>Candidate Profile</h2>
                <p>Every saved candidate can be published to voters and attached to one or more elections.</p>
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="name">Full Name</label>
                <input id="name" className="admin-input" name="name" value={form.name} onChange={handleChange} placeholder="Candidate full name" />
                {errors.name && <small style={{ color: '#be123c' }}>{errors.name}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="party">Political Party</label>
                <select id="party" className="admin-select" name="party" value={form.party} onChange={handleChange}>
                  <option value="">Choose a party</option>
                  {parties.map((party) => (
                    <option key={party._id} value={party._id}>
                      {party.name}
                    </option>
                  ))}
                </select>
                {errors.party && <small style={{ color: '#be123c' }}>{errors.party}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="cnic">CNIC</label>
                <input id="cnic" className="admin-input" name="cnic" value={form.cnic} onChange={handleChange} placeholder="3520212345671 or 35202-1234567-1" />
                {errors.cnic && <small style={{ color: '#be123c' }}>{errors.cnic}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="email">Email</label>
                <input id="email" className="admin-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="candidate@example.com" />
                {errors.email && <small style={{ color: '#be123c' }}>{errors.email}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" className="admin-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+92 300 1234567" />
                {errors.phone && <small style={{ color: '#be123c' }}>{errors.phone}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="education">Education</label>
                <input id="education" className="admin-input" name="education" value={form.education} onChange={handleChange} placeholder="e.g. MSc Political Science" />
              </div>

              <div className="admin-field">
                <label htmlFor="experience">Experience</label>
                <input id="experience" className="admin-input" name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 10 years in public service" />
              </div>

              <div className="admin-field">
                <label htmlFor="districtCode">District</label>
                <select id="districtCode" className="admin-select" name="districtCode" value={form.districtCode} onChange={handleChange}>
                  <option value="">Choose district</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name} ({district.code})
                    </option>
                  ))}
                </select>
                {errors.districtCode && <small style={{ color: '#be123c' }}>{errors.districtCode}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="halqaId">Halqa</label>
                <input
                  id="halqaId"
                  className="admin-input"
                  name="halqaId"
                  value={form.halqaId}
                  onChange={handleChange}
                  placeholder="Type halqa / constituency"
                />
                {districtHalqas.length ? (
                  <small style={{ color: '#475569' }}>
                    Suggested halqas for this district: {districtHalqas.slice(0, 5).join(', ')}{districtHalqas.length > 5 ? '...' : ''}
                  </small>
                ) : (
                  <small style={{ color: '#64748b' }}>Type the halqa name for the selected district.</small>
                )}
                {errors.halqaId && <small style={{ color: '#be123c' }}>{errors.halqaId}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="status">Status</label>
                <select id="status" className="admin-select" name="status" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="disqualified">Disqualified</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>

            <div className="admin-field" style={{ marginTop: 18 }}>
              <label htmlFor="biography">Biography / Manifesto</label>
              <textarea
                id="biography"
                className="admin-textarea"
                name="biography"
                value={form.biography}
                onChange={handleChange}
                placeholder="Describe the candidate background, priorities, and public platform."
              />
              {errors.biography && <small style={{ color: '#be123c' }}>{errors.biography}</small>}
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="admin-section-title">
                <div>
                  <h3>Linked Elections</h3>
                  <p>Select the elections where this candidate should appear for voters and vote casting.</p>
                </div>
              </div>

              {elections.length === 0 ? (
                <div className="admin-empty">
                  <strong>No elections available yet</strong>
                  Create at least one election first, then return here to link the candidate.
                </div>
              ) : (
                <div className="admin-card-list">
                  {elections.map((election) => {
                    const checked = form.elections.includes(election._id);
                    return (
                      <label key={election._id} className="admin-elevated-row" style={{ cursor: 'pointer' }}>
                        <div>
                          <h4 style={{ marginBottom: 6 }}>{election.title}</h4>
                          <p style={{ color: '#64748b' }}>
                            {election.halqaId || election.constituency} - {election.district || 'District not set'} - {election.status} - {new Date(election.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleElection(election._id)}
                          style={{ width: 18, height: 18 }}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
              {errors.elections && <small style={{ color: '#be123c', display: 'block', marginTop: 8 }}>{errors.elections}</small>}
            </div>

            <div className="admin-toolbar" style={{ marginTop: 22 }}>
              <div style={{ color: '#64748b' }}>
                Saved candidates are synced with the selected elections so the voter-side candidate and vote pages can load them.
              </div>
              <div className="admin-toolbar-actions">
                <button className="admin-secondary-btn" type="button" onClick={() => navigate('/admin/candidates')} disabled={isSubmitting}>
                  Cancel
                </button>
                <button className="admin-primary-btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Candidate'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCandidate;
