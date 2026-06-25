import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const pageShell = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(15, 118, 110, 0.14), transparent 30%), radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.12), transparent 28%), linear-gradient(180deg, #f7fbfa 0%, #edf5f4 100%)',
  padding: '2rem 0 3rem'
};

const surface = {
  background: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 22px 54px rgba(15, 23, 42, 0.08)',
  borderRadius: 24
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'NA';

const CastVoteV2 = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const electionId = location.state?.electionId;
  const electionTitle = location.state?.electionTitle || 'Selected Election';

  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidatesError, setCandidatesError] = useState('');

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);

  const [securityAnswers, setSecurityAnswers] = useState({
    answer1: '',
    answer2: '',
    answer3: ''
  });
  const [securityErrors, setSecurityErrors] = useState({});
  const [savedQuestions, setSavedQuestions] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [timeLeft, setTimeLeft] = useState(30);
  const [isVoting, setIsVoting] = useState(false);

  const token = useMemo(() => localStorage.getItem('token'), []);

  useEffect(() => {
    if (!electionId) {
      setCandidatesError('No election was selected for voting. Please return to the elections page and choose an election first.');
      return;
    }

    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      setCandidatesError('');
      try {
        const res = await fetch(`${API_BASE}/api/public/elections/${electionId}/candidates`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load candidates');
        }

        setCandidates(data.candidates || []);
      } catch (e) {
        setCandidatesError(e?.message || 'Failed to load candidates');
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchCandidates();
  }, [electionId]);

  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      try {
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          navigate('/login');
          return;
        }

        const data = await response.json();
        if (data.success && data.user?.securityQuestions?.length >= 3) {
          setSavedQuestions(data.user.securityQuestions);
        } else {
          setSavedQuestions([]);
        }
      } catch (e) {
        console.error('Failed to load security questions:', e);
        setSavedQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchSecurityQuestions();
  }, [navigate, token]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          alert('Voting session expired. Please restart the ballot and submit within the secure time window.');
          navigate('/user-dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setShowConfirmation(true);
    setShowSecurityQuestions(false);
    setSecurityErrors({});
  };

  const handleSecurityAnswerChange = (questionIndex, value) => {
    setSecurityAnswers((prev) => ({
      ...prev,
      [`answer${questionIndex + 1}`]: value
    }));

    if (securityErrors[`answer${questionIndex + 1}`]) {
      setSecurityErrors((prev) => ({
        ...prev,
        [`answer${questionIndex + 1}`]: ''
      }));
    }
  };

  const validateSecurityAnswers = () => {
    const errors = {};

    if (!securityAnswers.answer1.trim()) errors.answer1 = 'Please answer security question 1';
    if (!securityAnswers.answer2.trim()) errors.answer2 = 'Please answer security question 2';
    if (!securityAnswers.answer3.trim()) errors.answer3 = 'Please answer security question 3';

    setSecurityErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleVerifyAndCast = async (event) => {
    event?.preventDefault?.();

    if (!selectedCandidate) return;
    if (!validateSecurityAnswers()) return;
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setIsVoting(true);

      const verifyResponse = await fetch(`${API_BASE}/api/vote/verify-security`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: [
            securityAnswers.answer1.trim(),
            securityAnswers.answer2.trim(),
            securityAnswers.answer3.trim()
          ]
        })
      });

      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok || !verifyData.success) {
        setSecurityErrors({ answer1: verifyData.message || 'Security verification failed' });
        return;
      }

      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform || 'unknown',
        browser: navigator.appName || 'unknown'
      };

      const castRes = await fetch(`${API_BASE}/api/vote/cast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          electionId,
          candidateId: selectedCandidate._id,
          securityAnswers: [
            { answer: securityAnswers.answer1.trim() },
            { answer: securityAnswers.answer2.trim() },
            { answer: securityAnswers.answer3.trim() }
          ],
          deviceInfo
        })
      });

      const castData = await castRes.json();
      if (!castRes.ok || !castData.success) {
        if (castRes.status === 401 || castRes.status === 403) navigate('/login');
        setSecurityErrors({ answer1: castData.message || 'Failed to cast vote' });
        return;
      }

      if (castData.warning) {
        alert(castData.warning);
      }

      const receipt = castData.receipt;
      navigate('/vote-success', {
        state: {
          candidate: selectedCandidate,
          voteId: receipt?.receiptNumber,
          timestamp: receipt?.timestamp
        }
      });
    } catch (err) {
      console.error('Vote cast error:', err);
      setSecurityErrors({ answer1: 'Unable to cast vote. Please try again.' });
    } finally {
      setIsVoting(false);
    }
  };

  if (candidatesError) {
    return (
      <div style={{ ...pageShell, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...surface, maxWidth: 700, width: '100%', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#0f4d3a', marginBottom: '0.75rem' }}>Cast Vote</h2>
          <p style={{ color: '#b91c1c', margin: 0 }}>{candidatesError}</p>
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => navigate('/elections')}
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
              Back to Elections
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedCandidateData = selectedCandidate;

  const timerPill = (
    <div
      style={{
        position: 'fixed',
        top: 82,
        left: '50%',
        transform: 'translateX(-50%)',
        background: timeLeft <= 10 ? '#b91c1c' : 'linear-gradient(135deg, #0f766e, #065f46)',
        color: 'white',
        padding: '10px 18px',
        borderRadius: 999,
        fontWeight: 800,
        zIndex: 1000,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}
    >
      <span>Secure ballot window</span>
      <span>{formatTime(timeLeft)}</span>
    </div>
  );

  if (showSecurityQuestions) {
    return (
      <div style={pageShell}>
        {timerPill}
        <div className="container">
          <section
            style={{
              ...surface,
              background:
                'linear-gradient(135deg, rgba(15, 77, 58, 0.98) 0%, rgba(21, 111, 99, 0.96) 58%, rgba(30, 64, 175, 0.94) 100%)',
              color: 'white',
              padding: '34px 28px',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', fontWeight: 700, marginBottom: 18 }}>
              Secure Vote Confirmation
            </div>
            <h1 style={{ color: 'white', fontSize: '2.35rem', marginBottom: '0.75rem' }}>Answer your security questions and cast your vote</h1>
            <p style={{ color: 'rgba(255,255,255,0.88)', margin: 0, maxWidth: 760 }}>
              Your biometric session is already active. Complete the final knowledge-based verification to submit the ballot securely.
            </p>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <aside style={{ ...surface, padding: '24px' }}>
              <h2 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Selected Candidate</h2>
              {selectedCandidateData && (
                <>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                    {selectedCandidateData.photo ? (
                      <img
                        src={selectedCandidateData.photo}
                        alt={selectedCandidateData.name}
                        style={{ width: 82, height: 82, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 82,
                          height: 82,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          background: 'linear-gradient(135deg, #0f766e, #1e40af)',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '1.25rem'
                        }}
                      >
                        {getInitials(selectedCandidateData.name)}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, color: '#0f172a' }}>{selectedCandidateData.name}</h3>
                      <p style={{ margin: '6px 0 0 0', color: '#475569' }}>
                        {selectedCandidateData.party?.name || selectedCandidateData.party || 'Independent'}
                      </p>
                      <p style={{ margin: '6px 0 0 0', color: '#64748b' }}>{selectedCandidateData.constituency || 'Constituency not provided'}</p>
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px', borderRadius: 18, background: '#f8fafc', color: '#475569', lineHeight: 1.65 }}>
                    {selectedCandidateData.biography || selectedCandidateData.manifesto || 'No campaign summary provided.'}
                  </div>
                </>
              )}

              <div style={{ marginTop: 18, padding: '16px 18px', borderRadius: 18, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#065f46' }}>Before you submit</h3>
                <p style={{ margin: 0, color: '#047857', lineHeight: 1.65 }}>
                  Review your candidate carefully. Once the ballot is submitted successfully, it cannot be changed.
                </p>
              </div>
            </aside>

            <section style={{ ...surface, padding: '24px' }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>Security Questions</h2>
                <p style={{ margin: '8px 0 0 0', color: '#64748b' }}>
                  Provide the answers linked to your account so the vote can be recorded securely.
                </p>
              </div>

              <form onSubmit={handleVerifyAndCast}>
                {loadingQuestions && <p style={{ color: '#475569' }}>Loading security questions...</p>}

                {!loadingQuestions && !savedQuestions?.length && (
                  <div style={{ marginBottom: '1rem', color: '#b91c1c', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 16, padding: '14px 16px' }}>
                    Security questions are not available for this account yet. Please complete account setup first.
                  </div>
                )}

                {!loadingQuestions && savedQuestions && [1, 2, 3].map((questionNum) => (
                  <div key={questionNum} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontWeight: 700 }}>
                      {savedQuestions[questionNum - 1]?.question || `Security Question ${questionNum}`}
                    </label>
                    <input
                      type="text"
                      value={securityAnswers[`answer${questionNum}`]}
                      onChange={(e) => handleSecurityAnswerChange(questionNum - 1, e.target.value)}
                      placeholder="Enter your answer"
                      style={{
                        width: '100%',
                        padding: '13px 14px',
                        borderRadius: 14,
                        border: `1px solid ${securityErrors[`answer${questionNum}`] ? '#fda4af' : '#cbd5e1'}`,
                        background: 'white'
                      }}
                    />
                    {securityErrors[`answer${questionNum}`] && (
                      <div style={{ color: '#b91c1c', marginTop: 6 }}>
                        {securityErrors[`answer${questionNum}`]}
                      </div>
                    )}
                  </div>
                ))}

                {securityErrors.answer1 && !securityErrors.answer2 && !securityErrors.answer3 && (
                  <div style={{ marginBottom: '1rem', color: '#b91c1c', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 16, padding: '14px 16px' }}>
                    {securityErrors.answer1}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                  <button
                    type="submit"
                    disabled={isVoting || loadingQuestions || !savedQuestions?.length}
                    style={{
                      flex: 1,
                      minWidth: 180,
                      background: 'linear-gradient(135deg, #0f766e, #065f46)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 14,
                      padding: '14px 18px',
                      fontWeight: 800,
                      cursor: isVoting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isVoting ? 'Submitting Secure Vote...' : 'Submit Vote Securely'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSecurityQuestions(false)}
                    style={{
                      flex: 1,
                      minWidth: 180,
                      background: '#ffffff',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: 14,
                      padding: '14px 18px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Back to Candidate Selection
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageShell}>
      {timerPill}
      <div className="container">
        <section
          style={{
            ...surface,
            background:
              'linear-gradient(135deg, rgba(15, 77, 58, 0.98) 0%, rgba(21, 111, 99, 0.96) 58%, rgba(30, 64, 175, 0.94) 100%)',
            color: 'white',
            padding: '34px 28px',
            marginBottom: '1.5rem',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', inset: 'auto auto -70px -50px', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', fontWeight: 700, marginBottom: 18 }}>
              Secure Ballot
            </div>
            <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '0.75rem' }}>Cast your vote with confidence</h1>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.05rem', maxWidth: 760, marginBottom: 22 }}>
              Review the candidates for <strong>{electionTitle}</strong>, select one option, and continue through the secure confirmation step.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['1. Review candidates', '2. Confirm selection', '3. Answer security questions', '4. Submit secure ballot'].map((step) => (
                <span
                  key={step}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.12)',
                    fontWeight: 700
                  }}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </section>

        {showConfirmation && selectedCandidateData && (
          <section style={{ ...surface, padding: '22px', marginBottom: '1.5rem', border: '1px solid rgba(15, 118, 110, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a' }}>Candidate selected</h2>
                <p style={{ margin: '8px 0 0 0', color: '#475569' }}>
                  {selectedCandidateData.name} • {selectedCandidateData.party?.name || selectedCandidateData.party || 'Independent'} • {selectedCandidateData.constituency || 'Constituency not provided'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowSecurityQuestions(true)}
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
                  Continue to Security Check
                </button>
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setSelectedCandidate(null);
                  }}
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
                  Change Selection
                </button>
              </div>
            </div>
          </section>
        )}

        {loadingCandidates ? (
          <div style={{ ...surface, padding: '34px', textAlign: 'center', color: '#475569' }}>
            Loading candidates...
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ ...surface, padding: '40px 28px', textAlign: 'center' }}>
            <h3 style={{ color: '#0f172a', marginBottom: 8 }}>No candidates are available for this election</h3>
            <p style={{ color: '#64748b', margin: '0 auto 18px', maxWidth: 520 }}>
              Please return to the elections page and choose another election, or contact the administrator if this election should already have candidates.
            </p>
            <button
              onClick={() => navigate('/elections')}
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
              Back to Elections
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {candidates.map((candidate) => {
              const partyColor = candidate.party?.color || '#0f766e';
              const isSelected = selectedCandidate?._id === candidate._id;

              return (
                <article
                  key={candidate._id}
                  onClick={() => handleCandidateSelect(candidate)}
                  style={{
                    ...surface,
                    padding: '22px',
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${partyColor}` : '1px solid rgba(148, 163, 184, 0.18)',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
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
                          fontWeight: 800,
                          fontSize: '1.2rem'
                        }}
                      >
                        {getInitials(candidate.name)}
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, color: '#0f172a' }}>{candidate.name}</h3>
                        <span
                          style={{
                            padding: '6px 12px',
                            borderRadius: 999,
                            background: isSelected ? `${partyColor}18` : '#f8fafc',
                            color: isSelected ? partyColor : '#334155',
                            fontWeight: 800,
                            fontSize: 12
                          }}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', color: '#475569' }}>
                        {candidate.party?.name || candidate.party || 'Independent'}
                      </p>
                      <p style={{ margin: '6px 0 0 0', color: '#64748b' }}>
                        {candidate.constituency || 'Constituency not provided'}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', borderRadius: 18, background: '#f8fafc', color: '#475569', lineHeight: 1.65, minHeight: 110 }}>
                    {candidate.biography || candidate.manifesto || 'No campaign summary provided.'}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
                    <div style={{ padding: '12px 14px', borderRadius: 16, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Experience</div>
                      <div style={{ marginTop: 4, color: '#0f172a', fontWeight: 700 }}>{candidate.experience || 'Not provided'}</div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 16, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Education</div>
                      <div style={{ marginTop: 4, color: '#0f172a', fontWeight: 700 }}>{candidate.education || 'Not provided'}</div>
                    </div>
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

export default CastVoteV2;
