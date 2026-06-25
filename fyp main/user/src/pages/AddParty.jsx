import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config/api';

const initialForm = {
  partyName: '',
  abbreviation: '',
  leaderName: '',
  foundationDate: '',
  slogan: '',
  symbol: '',
  status: 'Active'
};

const deriveShortName = (value) => (
  String(value || '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 8)
    .toUpperCase()
);

const AddParty = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const shortNamePreview = useMemo(
    () => form.abbreviation.trim().toUpperCase() || deriveShortName(form.partyName),
    [form.abbreviation, form.partyName]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '', general: '' }));
    setSuccessMessage('');
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.partyName.trim()) nextErrors.partyName = 'Party name is required.';
    if (!form.leaderName.trim()) nextErrors.leaderName = 'Leader name is required.';
    if (!form.slogan.trim()) nextErrors.slogan = 'Manifesto summary is required.';
    if (!form.symbol.trim()) nextErrors.symbol = 'Election symbol is required.';

    const shortName = form.abbreviation.trim() || deriveShortName(form.partyName);
    if (!shortName) nextErrors.abbreviation = 'Abbreviation is required.';

    if (form.foundationDate) {
      const foundedDate = new Date(form.foundationDate);
      if (Number.isNaN(foundedDate.getTime())) {
        nextErrors.foundationDate = 'Foundation date is invalid.';
      } else if (foundedDate > new Date()) {
        nextErrors.foundationDate = 'Foundation date cannot be in the future.';
      }
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

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: form.partyName.trim(),
        shortName: shortNamePreview,
        symbol: form.symbol.trim(),
        leader: form.leaderName.trim(),
        founded: form.foundationDate ? new Date(form.foundationDate) : undefined,
        manifesto: form.slogan.trim(),
        isActive: form.status === 'Active'
      };

      const response = await fetch(`${API_BASE}/api/admin/parties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create party.');
      }

      setForm(initialForm);
      setErrors({});
      setSuccessMessage('Party created successfully and is ready to appear in admin management.');
    } catch (submitError) {
      setErrors({ general: submitError?.message || 'Failed to create party.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-shell">
      <Sidebar />

      <div className="admin-main">
        <div className="admin-page">
          <section className="admin-hero" style={{ marginBottom: 22 }}>
            <div>
              <h1>Add Political Party</h1>
              <p>
                Create a professional party profile for the election system with a clean public identity, leadership information, manifesto summary, and election symbol.
              </p>
              <div className="admin-hero-meta">
                <span className="admin-pill">
                  <i className="fa-solid fa-flag" />
                  Structured for election records
                </span>
                <span className="admin-pill">
                  <i className="fa-solid fa-shield-halved" />
                  Validated before saving
                </span>
                <span className="admin-pill">
                  <i className="fa-solid fa-users" />
                  Ready for candidate linking
                </span>
              </div>
            </div>
          </section>

          {errors.general && <div className="admin-alert error">{errors.general}</div>}
          {successMessage && <div className="admin-alert success">{successMessage}</div>}

          <div className="admin-stat-grid" style={{ marginBottom: 22 }}>
            <div className="admin-stat-card">
              <div className="admin-metric-icon">
                <i className="fa-solid fa-signature" />
              </div>
              <strong>{shortNamePreview || 'AUTO'}</strong>
              <span>Short name preview generated from the party title.</span>
            </div>
            <div className="admin-stat-card">
              <div className="admin-metric-icon">
                <i className="fa-solid fa-award" />
              </div>
              <strong>{form.symbol.trim() || 'Symbol'}</strong>
              <span>Visible election symbol that appears across ballots and listings.</span>
            </div>
            <div className="admin-stat-card">
              <div className="admin-metric-icon">
                <i className="fa-solid fa-circle-check" />
              </div>
              <strong>{form.status}</strong>
              <span>Choose whether the party should be stored as active or inactive.</span>
            </div>
          </div>

          <form className="admin-panel" onSubmit={handleSubmit}>
            <div className="admin-section-title">
              <div>
                <h2>Party Profile</h2>
                <p>Enter the party details that will be used by admins, candidates, and voter-facing pages.</p>
              </div>
              <div className="admin-toolbar-actions">
                <button
                  type="button"
                  className="admin-ghost-btn"
                  onClick={() => navigate('/admin/parties')}
                >
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }} />
                  Back to Parties
                </button>
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="partyName">Party Name</label>
                <input
                  id="partyName"
                  className="admin-input"
                  name="partyName"
                  value={form.partyName}
                  onChange={handleChange}
                  placeholder="Pakistan Reform Alliance"
                />
                {errors.partyName && <small style={{ color: '#be123c' }}>{errors.partyName}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="abbreviation">Abbreviation</label>
                <input
                  id="abbreviation"
                  className="admin-input"
                  name="abbreviation"
                  value={form.abbreviation}
                  onChange={handleChange}
                  placeholder="PRA"
                />
                {errors.abbreviation && <small style={{ color: '#be123c' }}>{errors.abbreviation}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="leaderName">Leader Name</label>
                <input
                  id="leaderName"
                  className="admin-input"
                  name="leaderName"
                  value={form.leaderName}
                  onChange={handleChange}
                  placeholder="Party leader name"
                />
                {errors.leaderName && <small style={{ color: '#be123c' }}>{errors.leaderName}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="foundationDate">Foundation Date</label>
                <input
                  id="foundationDate"
                  type="date"
                  className="admin-input"
                  name="foundationDate"
                  value={form.foundationDate}
                  onChange={handleChange}
                />
                {errors.foundationDate && <small style={{ color: '#be123c' }}>{errors.foundationDate}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="symbol">Election Symbol</label>
                <input
                  id="symbol"
                  className="admin-input"
                  name="symbol"
                  value={form.symbol}
                  onChange={handleChange}
                  placeholder="Arrow, Book, Bat, Scale"
                />
                {errors.symbol && <small style={{ color: '#be123c' }}>{errors.symbol}</small>}
              </div>

              <div className="admin-field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  className="admin-select"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="admin-field" style={{ marginTop: 18 }}>
              <label htmlFor="slogan">Manifesto Summary / Slogan</label>
              <textarea
                id="slogan"
                className="admin-textarea"
                name="slogan"
                value={form.slogan}
                onChange={handleChange}
                placeholder="Summarize the party mission, public commitments, and voter message."
              />
              {errors.slogan && <small style={{ color: '#be123c' }}>{errors.slogan}</small>}
            </div>

            <div className="admin-card-list" style={{ marginTop: 22 }}>
              <div className="admin-elevated-row">
                <div>
                  <h4 style={{ color: '#0f172a' }}>Submission Readiness</h4>
                  <p style={{ color: '#64748b', marginTop: 6 }}>
                    The record will save the party name, short name, leader, manifesto, symbol, and activation state.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={`admin-badge ${form.status === 'Active' ? 'active' : 'inactive'}`}>
                    {form.status}
                  </div>
                  <div style={{ color: '#475569', marginTop: 8, fontWeight: 700 }}>
                    Short name: {shortNamePreview || 'Pending'}
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-toolbar" style={{ marginTop: 22 }}>
              <div style={{ color: '#64748b' }}>
                Keep the party details polished and consistent so candidate and voter pages look professional.
              </div>
              <div className="admin-toolbar-actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => {
                    setForm(initialForm);
                    setErrors({});
                    setSuccessMessage('');
                  }}
                >
                  Reset Form
                </button>
                <button type="submit" className="admin-primary-btn" disabled={isSubmitting}>
                  <i className="fa-solid fa-square-plus" style={{ marginRight: 8 }} />
                  {isSubmitting ? 'Saving Party...' : 'Create Party'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddParty;
