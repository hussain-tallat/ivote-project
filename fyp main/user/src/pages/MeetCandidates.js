import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api';

const pageShell = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(15, 118, 110, 0.14), transparent 28%), radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.12), transparent 26%), linear-gradient(180deg, #f7fbfa 0%, #edf5f4 100%)',
  padding: '2rem 0 3rem'
};

const cardSurface = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 22px 54px rgba(15, 23, 42, 0.08)',
  borderRadius: 24
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'NA';

const MeetCandidates = () => {
  const [filters, setFilters] = useState({
    search: '',
    party: '',
    constituency: ''
  });
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/public/candidates`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to load candidates');
        }

        setCandidates(data.candidates || []);
      } catch (err) {
        setError(err?.message || 'Error loading candidates');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const partyOptions = useMemo(() => (
    Array.from(new Set(candidates.map((candidate) => candidate.party?.name).filter(Boolean))).sort()
  ), [candidates]);

  const constituencyOptions = useMemo(() => (
    Array.from(new Set(candidates.map((candidate) => candidate.constituency).filter(Boolean))).sort()
  ), [candidates]);

  const filteredCandidates = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const matchesSearch = !searchTerm || [
        candidate.name,
        candidate.biography,
        candidate.constituency,
        candidate.party?.name,
        candidate.experience
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm));

      const matchesParty = !filters.party || candidate.party?.name === filters.party;
      const matchesConstituency = !filters.constituency || candidate.constituency === filters.constituency;

      return matchesSearch && matchesParty && matchesConstituency;
    });
  }, [candidates, filters]);

  const summary = useMemo(() => ({
    totalCandidates: candidates.length,
    totalParties: partyOptions.length,
    totalConstituencies: constituencyOptions.length
  }), [candidates.length, constituencyOptions.length, partyOptions.length]);

  const handleFilterChange = ({ target: { name, value } }) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      party: '',
      constituency: ''
    });
  };

  return (
    <div style={pageShell}>
      <div className="container">
        <section
          style={{
            ...cardSurface,
            background:
              'linear-gradient(135deg, rgba(15, 77, 58, 0.98) 0%, rgba(21, 111, 99, 0.96) 58%, rgba(30, 64, 175, 0.94) 100%)',
            color: 'white',
            padding: '34px 28px',
            marginBottom: '1.5rem',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', inset: 'auto -60px -60px auto', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', fontWeight: 700, marginBottom: 18 }}>
              Candidate Listing
            </div>
            <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '0.8rem' }}>
              Review every candidate before you vote
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.05rem', maxWidth: 780, marginBottom: 24 }}>
              Compare party affiliation, constituency, experience, and campaign promises in one professional voter view designed for clear and confident decision-making.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Candidates', value: summary.totalCandidates },
                { label: 'Parties', value: summary.totalParties },
                { label: 'Constituencies', value: summary.totalConstituencies }
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.12)'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{item.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ ...cardSurface, padding: '24px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, color: '#0f172a' }}>Smart Filters</h2>
              <p style={{ margin: '8px 0 0 0', color: '#64748b' }}>
                After login, this list is already limited to your saved halqa. Use filters for quick comparison.
              </p>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}>
              Showing {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? '' : 's'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>Search</label>
              <input
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name, party, biography, or experience"
                style={{ width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>Party</label>
              <select
                name="party"
                value={filters.party}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: 'white' }}
              >
                <option value="">All parties</option>
                {partyOptions.map((party) => (
                  <option key={party} value={party}>{party}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>Halqa</label>
              <select
                name="constituency"
                value={filters.constituency}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: 'white' }}
              >
                <option value="">All halqay</option>
                {constituencyOptions.map((constituency) => (
                  <option key={constituency} value={constituency}>{constituency}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <button
              onClick={resetFilters}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: 14,
                padding: '12px 18px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
            <Link
              to="/elections"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #0f766e, #065f46)',
                color: 'white',
                borderRadius: 14,
                padding: '12px 18px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              Continue to Elections
            </Link>
          </div>
        </section>

        {loading ? (
          <div style={{ ...cardSurface, padding: '34px', textAlign: 'center', color: '#475569' }}>
            Loading candidates...
          </div>
        ) : error ? (
          <div style={{ ...cardSurface, padding: '34px', textAlign: 'center', color: '#b91c1c' }}>
            {error}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div style={{ ...cardSurface, padding: '40px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔎</div>
            <h3 style={{ color: '#0f172a', marginBottom: 8 }}>No candidates match the current filters</h3>
            <p style={{ color: '#64748b', maxWidth: 520, margin: '0 auto 18px' }}>
              Adjust your filters to view more candidates and compare them before moving to the ballot.
            </p>
            <button
              onClick={resetFilters}
              style={{
                background: 'linear-gradient(135deg, #0f766e, #065f46)',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: '12px 18px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredCandidates.map((candidate) => {
              const partyColor = candidate.party?.color || '#0f766e';
              const promises = Array.isArray(candidate.promises) ? candidate.promises.slice(0, 3) : [];
              const achievements = Array.isArray(candidate.achievements) ? candidate.achievements.slice(0, 2) : [];

              return (
                <article
                  key={candidate._id}
                  style={{
                    ...cardSurface,
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    {candidate.photo ? (
                      <img
                        src={candidate.photo}
                        alt={candidate.name}
                        style={{
                          width: 78,
                          height: 78,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `3px solid ${partyColor}`
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 78,
                          height: 78,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          background: `linear-gradient(135deg, ${partyColor}, #1e40af)`,
                          color: 'white',
                          fontSize: '1.2rem',
                          fontWeight: 800
                        }}
                      >
                        {getInitials(candidate.name)}
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem' }}>{candidate.name}</h3>
                        <span
                          style={{
                            padding: '6px 12px',
                            borderRadius: 999,
                            background: `${partyColor}18`,
                            color: partyColor,
                            fontWeight: 800,
                            fontSize: 12
                          }}
                        >
                          {candidate.party?.name || 'Independent'}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', color: '#475569' }}>
                        {candidate.constituency || 'Constituency not assigned'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                    <div style={{ padding: '12px 14px', borderRadius: 16, background: '#f8fafc' }}>
                      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Experience</div>
                      <div style={{ color: '#0f172a', marginTop: 4, fontWeight: 700 }}>{candidate.experience || 'Not provided'}</div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 16, background: '#f8fafc' }}>
                      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Education</div>
                      <div style={{ color: '#0f172a', marginTop: 4, fontWeight: 700 }}>{candidate.education || 'Not provided'}</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Profile Summary</h4>
                    <p style={{ margin: 0, color: '#475569', lineHeight: 1.65 }}>
                      {candidate.biography || 'No biography has been published for this candidate yet.'}
                    </p>
                  </div>

                  {promises.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Key Promises</h4>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {promises.map((promise, index) => (
                          <span
                            key={`${candidate._id}-promise-${index}`}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 14,
                              background: '#ecfeff',
                              color: '#0f766e',
                              fontWeight: 700,
                              fontSize: 13
                            }}
                          >
                            {promise}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {achievements.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Highlights</h4>
                      <div style={{ color: '#475569', lineHeight: 1.65 }}>
                        {achievements.join(' • ')}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
                    <Link
                      to="/elections"
                      style={{
                        flex: 1,
                        minWidth: 160,
                        textDecoration: 'none',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #0f766e, #065f46)',
                        color: 'white',
                        borderRadius: 14,
                        padding: '12px 16px',
                        fontWeight: 800
                      }}
                    >
                      Go to Elections
                    </Link>
                    <Link
                      to="/parties"
                      style={{
                        flex: 1,
                        minWidth: 160,
                        textDecoration: 'none',
                        textAlign: 'center',
                        background: '#ffffff',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: 14,
                        padding: '12px 16px',
                        fontWeight: 800
                      }}
                    >
                      View Parties
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetCandidates;
