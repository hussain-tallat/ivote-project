
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const CastVote = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isVoting, setIsVoting] = useState(false);
  const [securityAnswers, setSecurityAnswers] = useState({
    answer1: '',
    answer2: '',
    answer3: ''
  });
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);
  const [securityErrors, setSecurityErrors] = useState({});
  const [savedQuestions, setSavedQuestions] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Load security questions from database when component mounts
  React.useEffect(() => {
    const fetchSecurityQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          // Enforced by backend: user must complete Face+Fingerprint MFA first.
          navigate('/login');
          return;
        }
        const data = await response.json();
        if (data.success && data.user?.securityQuestions?.length >= 3) {
          setSavedQuestions(data.user.securityQuestions);
        }
      } catch (error) {
        console.error('Failed to load security questions:', error);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchSecurityQuestions();
  }, []);

  // Timer for voting session
  React.useEffect(() => {
    if (localStorage.getItem('voteCancelled')) {
      alert("You are not allowed to cast the vote again.");
      navigate('/user-dashboard');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.setItem('voteCancelled', 'true');
          alert("Time expired! The vote is automatically cancelled.");
          navigate('/user-dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  // Load candidates
  React.useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/public/candidates`);
        const data = await response.json();
        if (data.success && data.candidates) {
          setCandidates(data.candidates);
        }
      } catch (error) {
        console.error('Failed to load candidates:', error);
      } finally {
        setLoadingCandidates(false);
      }
    };
    fetchCandidates();
  }, []);

  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidate(candidateId);
    setShowConfirmation(true);
  };

  const handleSecurityAnswerChange = (questionIndex, value) => {
    setSecurityAnswers(prev => ({
      ...prev,
      [`answer${questionIndex + 1}`]: value
    }));
    
    // Clear error when user starts typing
    if (securityErrors[`answer${questionIndex + 1}`]) {
      setSecurityErrors(prev => ({
        ...prev,
        [`answer${questionIndex + 1}`]: ''
      }));
    }
  };

  const validateSecurityAnswers = () => {
    const errors = {};
    
    if (!securityAnswers.answer1.trim()) {
      errors.answer1 = 'Please answer security question 1';
    }
    if (!securityAnswers.answer2.trim()) {
      errors.answer2 = 'Please answer security question 2';
    }
    if (!securityAnswers.answer3.trim()) {
      errors.answer3 = 'Please answer security question 3';
    }
    
    setSecurityErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleVoteSubmit = async () => {
    if (!selectedCandidate) return;
    
    setShowSecurityQuestions(true);
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    
    if (!validateSecurityAnswers()) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const verifyResponse = await fetch('http://localhost:5000/api/vote/verify-security', {
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
      if (!verifyData.success) {
        setSecurityErrors({ answer1: verifyData.message || 'Security verification failed' });
        return;
      }
    } catch (error) {
      setSecurityErrors({ answer1: 'Unable to verify security answers. Please try again.' });
      return;
    }

    setIsVoting(true);
    
    try {
      // Simulate biometric verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random success/failure for demo
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        // Navigate to success page
        navigate('/vote-success', { 
          state: { 
            candidate: selectedCandidateData,
            voteId: 'VOTE-' + Date.now().toString().slice(-8),
            timestamp: new Date().toLocaleString()
          } 
        });
      } else {
        // Show error and redirect to suspension
        navigate('/suspended');
      }
    } catch (error) {
      console.error('Voting error:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const selectedCandidateData = candidates.find(c => c._id === selectedCandidate);

  if (showSecurityQuestions) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8f9fa', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem 0'
      }}>
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: timeLeft <= 10 ? '#dc3545' : 'var(--primary-green)',
          color: 'white',
          padding: '10px 25px',
          borderRadius: '50px',
          fontWeight: 'bold',
          zIndex: 1000,
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '1.2rem'
        }}>
          <i className="fa-solid fa-stopwatch"></i>
          <span>{timeLeft}s Remaining</span>
        </div>
        <div className="card" style={{ 
          maxWidth: '600px', 
          width: '100%', 
          margin: '0 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ 
              color: 'var(--primary-green)', 
              fontSize: '2rem', 
              marginBottom: '0.5rem' 
            }}>
              Security Verification
            </h1>
            <p style={{ color: 'var(--dark-grey)', fontSize: '1rem' }}>
              Please answer your security questions to complete your vote
            </p>
          </div>

          <form onSubmit={handleSecuritySubmit}>
            {loadingQuestions && (
              <p style={{ marginBottom: '1rem' }}>Loading security questions...</p>
            )}
            {!loadingQuestions && savedQuestions && [1, 2, 3].map((questionNum) => (
              <div key={questionNum} className="form-group">
                <label className="form-label">
                  {savedQuestions[questionNum - 1]?.question || `Security Question ${questionNum}`}
                </label>
                <input
                  type="text"
                  value={securityAnswers[`answer${questionNum}`]}
                  onChange={(e) => handleSecurityAnswerChange(questionNum - 1, e.target.value)}
                  placeholder={`Enter your answer`}
                  className={`form-input ${securityErrors[`answer${questionNum}`] ? 'error' : ''}`}
                />
                {securityErrors[`answer${questionNum}`] && (
                  <div className="error-message">
                    {securityErrors[`answer${questionNum}`]}
                  </div>
                )}
              </div>
            ))}
            {!loadingQuestions && !savedQuestions && (
              <div className="error-message" style={{ marginBottom: '1rem' }}>
                Security questions are not set for this account. Please complete registration setup first.
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                padding: '14px', 
                fontSize: '1.1rem',
                marginBottom: '1.5rem'
              }}
              disabled={isVoting || loadingQuestions || !savedQuestions}
            >
              {isVoting ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }}></div>
                  Processing Vote...
                </div>
              ) : (
                'Submit Vote'
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setShowSecurityQuestions(false)}
              className="btn btn-outline"
              style={{ padding: '10px 20px' }}
            >
              Back to Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 0' }}>
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: timeLeft <= 10 ? '#dc3545' : 'var(--primary-green)',
        color: 'white',
        padding: '10px 25px',
        borderRadius: '50px',
        fontWeight: 'bold',
        zIndex: 1000,
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '1.2rem'
      }}>
        <i className="fa-solid fa-stopwatch"></i>
        <span>{timeLeft}s Remaining</span>
      </div>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            color: 'var(--primary-green)', 
            fontSize: '2.5rem', 
            marginBottom: '1rem' 
          }}>
            Cast Your Vote
          </h1>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Please select one candidate to submit your vote. You can only vote once.
          </p>
        </div>

        {/* Candidates List */}
        {/* Empty State */}
        {loadingCandidates ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ color: 'var(--dark-grey)' }}>Loading candidates...</h3>
          </div>
        ) : candidates.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed #ced4da' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', color: '#adb5bd' }}>🗂️</div>
            <h3 style={{ color: 'var(--primary-green)', marginBottom: '0.5rem' }}>No Data Available</h3>
            <p style={{ color: 'var(--dark-grey)', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
              Please create an election or party to see results. Currently, there are no candidates enrolled.
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {candidates.map((candidate) => (
              <div key={candidate._id} className="card" style={{
                marginBottom: '1.5rem',
                border: selectedCandidate === candidate._id ? '2px solid var(--primary-green)' : '1px solid #e9ecef',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => handleCandidateSelect(candidate._id)}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem' 
                }}>
                  <img
                    src={candidate.photo || 'https://via.placeholder.com/80x80/1a4d3a/ffffff?text=Img'}
                    alt={candidate.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      color: 'var(--primary-green)', 
                      fontSize: '1.3rem',
                      marginBottom: '0.5rem'
                    }}>
                      {candidate.name}
                    </h3>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <img
                        src={candidate.party?.logo || 'https://via.placeholder.com/30x20/ff0000/ffffff?text=P'}
                        alt={candidate.party?.name || 'Independent'}
                        style={{ width: '30px', height: '20px', objectFit: 'cover' }}
                      />
                      <span style={{ 
                        color: 'var(--dark-grey)', 
                        fontWeight: '500' 
                      }}>
                        {candidate.party?.name || 'Independent'}
                      </span>
                    </div>
                    
                    <p style={{ 
                      color: 'var(--dark-grey)', 
                      fontSize: '0.9rem',
                      margin: 0
                    }}>
                      {candidate.manifesto || candidate.biography || 'No manifesto provided by candidate.'}
                    </p>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px'
                  }}>
                    <input
                      type="radio"
                      name="candidate"
                      checked={selectedCandidate === candidate._id}
                      onChange={() => handleCandidateSelect(candidate._id)}
                      style={{ 
                        width: '20px', 
                        height: '20px',
                        accentColor: 'var(--primary-green)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Section */}
        {showConfirmation && selectedCandidateData && (
          <div className="card" style={{ 
            maxWidth: '600px', 
            margin: '2rem auto',
            textAlign: 'center',
            border: '2px solid var(--primary-green)'
          }}>
            <h2 style={{ 
              color: 'var(--primary-green)', 
              marginBottom: '1rem' 
            }}>
              Confirm Your Selection
            </h2>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '1.5rem', 
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ 
                fontSize: '1.1rem', 
                margin: 0,
                color: 'var(--dark-grey)'
              }}>
                You have selected <strong style={{ color: 'var(--primary-green)' }}>
                  {selectedCandidateData.name}
                </strong>
              </p>
              <p style={{ 
                fontSize: '0.9rem', 
                margin: '0.5rem 0 0 0',
                color: 'var(--dark-grey)'
              }}>
                {selectedCandidateData.party?.name || selectedCandidateData.party || 'Independent'}
              </p>
            </div>
            
            <p style={{ 
              color: 'var(--dark-grey)', 
              marginBottom: '1.5rem' 
            }}>
              Are you sure you want to submit yuir vote?
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleVoteSubmit}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                Confirm & Submit Vote
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn btn-outline"
                style={{ padding: '12px 24px' }}
              >
                Cancel / Change Selection
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card" style={{ 
          maxWidth: '800px', 
          margin: '2rem auto 0',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            color: 'var(--primary-green)', 
            marginBottom: '1rem' 
          }}>
            Voting Instructions
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            textAlign: 'left'
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: '500' }}>1. Select Candidate</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                Click on your preferred candidate
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '500' }}>2. Confirm Selection</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                Review and confirm your choice
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '500' }}>3. Security Verification</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                Answer security questions
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '500' }}>4. Vote Submitted</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dark-grey)' }}>
                Your vote is securely recorded
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CastVote;
