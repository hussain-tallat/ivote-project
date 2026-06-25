import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config/api';

const initialForm = {
  title: '',
  description: '',
  type: '',
  districtCode: '',
  halqaId: '',
  constituency: '',
  startDate: '',
  endDate: '',
  status: 'upcoming',
  eligibleVoters: ''
};

const AddElection = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [districts, setDistricts] = useState([]);

  React.useEffect(() => {
    const loadDistricts = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/public/districts`);
        const data = await response.json();
        if (response.ok && data.success) {
          setDistricts(data.districts || []);
        }
      } catch {
        setDistricts([]);
      }
    };

    loadDistricts();
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
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const selectedDistrict = districts.find((district) => district.code === form.districtCode);
  const districtHalqas = selectedDistrict?.halqas || [];

  const validateForm = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Election title is required.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';
    if (!form.type) nextErrors.type = 'Election type is required.';
    if (!form.districtCode) nextErrors.districtCode = 'District is required.';
    if (!form.halqaId) nextErrors.halqaId = 'Halqa is required.';
    if (!form.startDate) nextErrors.startDate = 'Start date is required.';
    if (!form.endDate) nextErrors.endDate = 'End date is required.';
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      nextErrors.endDate = 'End date must be after the start date.';
    }
    if (!form.eligibleVoters || Number(form.eligibleVoters) <= 0) {
      nextErrors.eligibleVoters = 'Eligible voters must be greater than zero.';
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not logged in.');
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        districtCode: form.districtCode,
        district: selectedDistrict?.name,
        halqaId: form.halqaId,
        constituency: form.halqaId,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        status: form.status,
        eligibleVoters: Number(form.eligibleVoters)
      };

      const res = await fetch(`${API_BASE}/api/admin/elections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create election');
      }

      navigate('/admin/elections');
    } catch (err) {
      setError(err?.message || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-shell">
      <Sidebar activePage="add-election" />

      <div className="admin-main">
        <div className="admin-page">
          <section className="admin-hero" style={{ marginBottom: 22 }}>
            <div>
              <h1>Create Election</h1>
              <p>Create a new election that can appear on the voter side as soon as its schedule and status allow it.</p>
              <div className="admin-hero-meta">
                <span className="admin-pill">
                  <i className="fa-solid fa-eye" />
                  Published through public election APIs
                </span>
                <span className="admin-pill">
                  <i className="fa-solid fa-calendar-days" />
                  Status controls voter visibility
                </span>
              </div>
            </div>
          </section>

          {error && <div className="admin-alert error">{error}</div>}

          <form className="admin-panel" onSubmit={handleSubmit}>
            <div className="admin-section-title">
              <div>
                <h2>Election Details</h2>
                <p>Use one clean record per election. Candidates can be linked after this step.</p>
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="title">Election Title</label>
                <input id="title" className="admin-input" name="title" value={form.title} onChange={handleChange} placeholder="General Election 2026" />
                {errors.title && <small style={{ color: '#be123c' }}>{errors.title}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="type">Election Type</label>
                <select id="type" className="admin-select" name="type" value={form.type} onChange={handleChange}>
                  <option value="">Select election type</option>
                  <option value="National">National</option>
                  <option value="Provincial">Provincial</option>
                  <option value="Local">Local</option>
                  <option value="Senate">Senate</option>
                  <option value="Presidential">Presidential</option>
                </select>
                {errors.type && <small style={{ color: '#be123c' }}>{errors.type}</small>}
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
                <label htmlFor="eligibleVoters">Eligible Voters</label>
                <input id="eligibleVoters" className="admin-input" type="number" min="1" name="eligibleVoters" value={form.eligibleVoters} onChange={handleChange} placeholder="250000" />
                {errors.eligibleVoters && <small style={{ color: '#be123c' }}>{errors.eligibleVoters}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="startDate">Start Date & Time</label>
                <input id="startDate" className="admin-input" type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} />
                {errors.startDate && <small style={{ color: '#be123c' }}>{errors.startDate}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="endDate">End Date & Time</label>
                <input id="endDate" className="admin-input" type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} />
                {errors.endDate && <small style={{ color: '#be123c' }}>{errors.endDate}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="status">Initial Status</label>
                <select id="status" className="admin-select" name="status" value={form.status} onChange={handleChange}>
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="admin-field" style={{ marginTop: 18 }}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="admin-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Add the election purpose, scope, and any voter-facing notes."
              />
              {errors.description && <small style={{ color: '#be123c' }}>{errors.description}</small>}
            </div>

            <div className="admin-toolbar" style={{ marginTop: 22 }}>
              <div style={{ color: '#64748b' }}>
                Once saved, this election is available to candidate-linking flows and public election listings.
              </div>
              <div className="admin-toolbar-actions">
                <button className="admin-secondary-btn" type="button" onClick={() => navigate('/admin/elections')} disabled={loading}>
                  Cancel
                </button>
                <button className="admin-primary-btn" type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Election'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddElection;
