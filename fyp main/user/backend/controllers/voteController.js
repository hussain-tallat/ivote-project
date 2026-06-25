const Vote = require('../models/Vote');
const User = require('../models/User');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Party = require('../models/Party');
const FraudLog = require('../models/FraudLog');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const axios = require('axios');
const { hashData } = require('../utils/encryption');
const {
  hasRegisteredFingerprint,
  hasRegisteredFace,
  isRegistrationComplete,
  syncRegistrationProgress
} = require('../utils/biometricState');
const { buildFraudUserSnapshot } = require('../utils/fraudLogHelpers');

const normalizeSecurityAnswer = (entry) => String(entry?.answer ?? entry ?? '').toLowerCase().trim();
const normalizeHalqa = (value) => String(value || '').trim().toUpperCase();
const recordHalqa = (record) => normalizeHalqa(record?.halqaId || record?.constituency);

const detectFraud = async (voteData, user, election) => {
  const fraudIndicators = [];
  let riskScore = 0;

  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);

  const recentVotes = await Vote.find({
    voter: user._id,
    timestamp: { $gte: oneHourAgo }
  });

  if (recentVotes.length > 3) {
    fraudIndicators.push('rapid_voting');
    riskScore += 30;
  }

  const ipVotes = await Vote.find({
    ipAddress: voteData.ipAddress,
    election: election._id,
    timestamp: { $gte: oneHourAgo }
  });

  if (ipVotes.length > 5) {
    fraudIndicators.push('duplicate_ip');
    riskScore += 40;
  }

  const deviceInfo = voteData.deviceInfo || {};
  const deviceUserAgent = deviceInfo.userAgent || 'unknown';
  const devicePlatform = deviceInfo.platform || 'unknown';
  const deviceBrowser = deviceInfo.browser || 'unknown';

  const deviceVotes = await Vote.find({
    'deviceInfo.userAgent': deviceUserAgent,
    'deviceInfo.platform': devicePlatform,
    'deviceInfo.browser': deviceBrowser,
    timestamp: { $gte: oneHourAgo }
  });

  const deviceVoteCount = deviceVotes.length;

  const userVoteHistory = await Vote.find({ voter: user._id });
  if (userVoteHistory.length > 10) {
    const timestamps = userVoteHistory.map(v => v.timestamp);
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avgInterval < 60000) {
      fraudIndicators.push('suspicious_pattern');
      riskScore += 25;
    }
  }

  const lastVote = await Vote.findOne({ voter: user._id }).sort({ timestamp: -1 });
  const timeSinceLastVoteSeconds = lastVote ? Math.max(0, Math.floor((now - new Date(lastVote.timestamp).getTime()) / 1000)) : 1000;

  const duplicateVote = await Vote.findOne({
    voter: user._id,
    election: election._id
  });

  if (duplicateVote) {
    fraudIndicators.push('multiple_votes');
    riskScore += 50;
  }

  const biometricVerified = Boolean(voteData?.biometricVerified?.face || voteData?.biometricVerified?.fingerprint);
  const securityVerified = Boolean(voteData.securityQuestionVerified);

  // Python AI expects these specific feature names.
  const features = {
    vote_count_last_hour: recentVotes.length,
    ip_vote_count: ipVotes.length,
    device_vote_count: deviceVoteCount,
    time_since_last_vote: timeSinceLastVoteSeconds,
    biometric_verified: biometricVerified,
    security_verified: securityVerified,
    rapid_voting_pattern: recentVotes.length > 3 ? 1 : 0
  };

  return {
    isFraudulent: riskScore >= 50,
    riskScore,
    fraudIndicators,
    features
  };
};

// @desc    Cast a vote
// @route   POST /api/vote/cast
// @access  Private
exports.castVote = async (req, res) => {
  try {
    const { electionId, candidateId, securityAnswers, deviceInfo } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Only approved users (assigned a halqa by admin) can cast votes.
    if (user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not yet approved by the administrator. You cannot cast votes until approved.'
      });
    }

    syncRegistrationProgress(user);
    await user.save();

    const registrationComplete = isRegistrationComplete(user);

    if (!registrationComplete) {
      return res.status(403).json({
        success: false,
        message: 'Registration is incomplete. Complete OTP, face, fingerprint, and security questions first.'
      });
    }

    if (!user.lastMfaVerifiedAt || (Date.now() - new Date(user.lastMfaVerifiedAt).getTime()) > 15 * 60 * 1000) {
      return res.status(401).json({
        success: false,
        message: 'Biometric login verification expired. Please login and verify both fingerprint and face again.'
      });
    }

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    if (election.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Election is not currently active' 
      });
    }

    const voterHalqaId = normalizeHalqa(user.halqaId);
    const electionHalqaId = recordHalqa(election);
    if (!voterHalqaId) {
      return res.status(403).json({
        success: false,
        message: 'Your voter account does not have a saved halqa. Please contact support.'
      });
    }

    if (electionHalqaId && electionHalqaId !== voterHalqaId) {
      return res.status(403).json({
        success: false,
        message: 'This election is not available for your saved halqa.'
      });
    }

    const now = new Date();
    if (now < election.startDate || now > election.endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Election is not within voting period' 
      });
    }

    const existingVote = await Vote.findOne({
      voter: user._id,
      election: electionId
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this election. You cannot vote again.'
      });
    }

    const candidate = await Candidate.findById(candidateId).populate('party');
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const candidateHalqaId = recordHalqa(candidate);
    if (candidateHalqaId && candidateHalqaId !== voterHalqaId) {
      return res.status(403).json({
        success: false,
        message: 'This candidate is not available for your saved halqa.'
      });
    }

    const electionHasCandidate = election.candidates.some((id) => String(id) === String(candidateId));
    if (!electionHasCandidate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Candidate is not part of this election' 
      });
    }

    if (!Array.isArray(securityAnswers) || securityAnswers.length !== 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please answer all security questions' 
      });
    }

    const savedSecurityQuestions = Array.isArray(user.securityQuestions) ? user.securityQuestions : [];

    let securityVerified = true;
    for (let i = 0; i < Math.min(3, savedSecurityQuestions.length); i++) {
      const userAnswer = normalizeSecurityAnswer(securityAnswers[i]);
      const storedAnswer = savedSecurityQuestions[i].answer;
      const isMatch = await bcrypt.compare(userAnswer, storedAnswer);
      
      if (!isMatch) {
        securityVerified = false;
        break;
      }
    }

    if (!securityVerified) {
      return res.status(401).json({ 
        success: false, 
        message: 'Security question verification failed' 
      });
    }

    const voteData = {
      voter: user._id,
      voterCnic: user.cnic,
      election: electionId,
      candidate: candidateId,
      party: candidate.party._id,
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceInfo: deviceInfo || {
        userAgent: req.headers['user-agent'],
        platform: 'unknown',
        browser: 'unknown'
      },
      securityQuestionVerified: securityVerified,
      biometricVerified: {
        face: hasRegisteredFace(user),
        fingerprint: hasRegisteredFingerprint(user)
      }
    };

    const fraudAnalysis = await detectFraud(voteData, user, election);
    
    // Optionally enrich/upgrade risk using the AI service.
    // We only use AI results to increase risk/flags (never to “unflag”).
    let finalRiskScore = fraudAnalysis.riskScore;
    let finalIsFlagged = fraudAnalysis.isFraudulent;
    let aiPrediction = null;

    try {
      if (process.env.AI_FRAUD_API) {
        const aiRes = await axios.post(process.env.AI_FRAUD_API + '/predict', {
          // Features required by the AI service.
          ...fraudAnalysis.features,
          constituency: election.constituency,
          party: candidate?.party?.name,
          current_total_votes: election.totalVotes,
          turnout_percentage: election.turnoutPercentage
        });

        aiPrediction = aiRes?.data?.prediction || null;

        if (aiPrediction && typeof aiPrediction.risk_score === 'number') {
          finalRiskScore = Math.max(finalRiskScore, aiPrediction.risk_score);
        }
        if (aiPrediction && aiPrediction.is_fraudulent) {
          finalIsFlagged = true;
        }
      }
    } catch (aiError) {
      console.error('AI fraud detection API error:', aiError.message);
    }

    voteData.fraudScore = finalRiskScore;
    voteData.isFlagged = finalIsFlagged;

    const voteString = user._id + '-' + electionId + '-' + candidateId + '-' + Date.now();
    voteData.voteHash = hashData(voteString);
    voteData.receiptNumber = 'VR-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const vote = await Vote.create(voteData);

    let createdFraudLog = null;
    if (finalIsFlagged) {
      createdFraudLog = await FraudLog.create({
        userId: user._id,
        ...buildFraudUserSnapshot(user),
        voteId: vote._id,
        electionId: electionId,
        fraudType:
          aiPrediction?.fraud_indicators?.[0] ||
          fraudAnalysis.fraudIndicators?.[0] ||
          'suspicious_pattern',
        severity: finalRiskScore >= 70 ? 'high' : 'medium',
        riskScore: finalRiskScore,
        description: 'Fraudulent voting attempt detected. Indicators: ' + [
          ...(aiPrediction?.fraud_indicators || []),
          ...(fraudAnalysis.fraudIndicators || [])
        ].join(', '),
        evidence: {
          ipAddress: voteData.ipAddress,
          deviceFingerprint: JSON.stringify(voteData.deviceInfo),
          timestamp: new Date()
        },
        ipAddress: voteData.ipAddress,
        deviceInfo: voteData.deviceInfo,
        status: 'detected',
        actionTaken: 'flagged',
        aiPrediction: aiPrediction
          ? {
              model: 'ai_fraud_detection',
              confidence: aiPrediction.confidence,
              features: aiPrediction.features
            }
          : undefined
      });
    }

    user.hasVoted.push({
      electionId: electionId,
      votedAt: Date.now()
    });
    await user.save();

    election.totalVotes += 1;
    const resultIndex = election.results.findIndex(
      r => r.candidateId.toString() === candidateId.toString()
    );
    
    if (resultIndex >= 0) {
      election.results[resultIndex].votes += 1;
    } else {
      election.results.push({
        candidateId: candidateId,
        partyId: candidate.party._id,
        votes: 1,
        percentage: 0
      });
    }

    election.results.forEach(result => {
      result.percentage = (result.votes / election.totalVotes) * 100;
    });

    await election.save();

    candidate.totalVotes += 1;
    await candidate.save();

    if (global.io) {
      global.io.to('election-' + electionId).emit('voteUpdate', {
        electionId,
        totalVotes: election.totalVotes,
        results: election.results
      });
    }

    // Emit updated analytics for admin/live analytics dashboard.
    if (global.socketHandlers?.updateAnalytics) {
      global.socketHandlers.updateAnalytics(electionId);
    }

    // Emit fraud alert for admin dashboard.
    if (createdFraudLog && global.socketHandlers?.emitFraudAlert) {
      global.socketHandlers.emitFraudAlert(createdFraudLog);
    }

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      receipt: {
        receiptNumber: vote.receiptNumber,
        timestamp: vote.timestamp,
        election: election.title,
        candidate: candidate.name,
        party: candidate.party.name,
        voteHash: vote.voteHash
      },
      warning: fraudAnalysis.isFraudulent ? 'Your vote has been flagged for review' : null
    });

  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Get vote receipt
// @route   GET /api/vote/receipt/:receiptNumber
// @access  Private
exports.getReceipt = async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    const vote = await Vote.findOne({ receiptNumber })
      .populate('election', 'title type')
      .populate('candidate', 'name')
      .populate('party', 'name symbol');

    if (!vote) {
      return res.status(404).json({ 
        success: false, 
        message: 'Receipt not found' 
      });
    }

    if (vote.voter.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    res.status(200).json({
      success: true,
      receipt: {
        receiptNumber: vote.receiptNumber,
        timestamp: vote.timestamp,
        election: vote.election.title,
        candidate: vote.candidate.name,
        party: vote.party.name,
        partySymbol: vote.party.symbol,
        voteHash: vote.voteHash,
        status: vote.status
      }
    });

  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Verify security questions before voting
// @route   POST /api/vote/verify-security
// @access  Private
exports.verifySecurityQuestions = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length !== 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide 3 security answers' 
      });
    }

    const user = await User.findById(req.user.id);

    const savedSecurityQuestions = Array.isArray(user?.securityQuestions) ? user.securityQuestions : [];

    if (!user || savedSecurityQuestions.length < 3) {
      return res.status(404).json({ 
        success: false, 
        message: 'Security questions not set up' 
      });
    }

    syncRegistrationProgress(user);
    await user.save();

    const registrationComplete = isRegistrationComplete(user);

    if (!registrationComplete) {
      return res.status(403).json({
        success: false,
        message: 'Registration is incomplete'
      });
    }

    let allCorrect = true;
    for (let i = 0; i < 3; i++) {
      const userAnswer = normalizeSecurityAnswer(answers[i]);
      const storedAnswer = savedSecurityQuestions[i].answer;
      const isMatch = await bcrypt.compare(userAnswer, storedAnswer);
      
      if (!isMatch) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      return res.status(401).json({ 
        success: false, 
        message: 'Security verification failed' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Security questions verified successfully' 
    });

  } catch (error) {
    console.error('Verify security error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user's voting history
// @route   GET /api/vote/history
// @access  Private
exports.getVotingHistory = async (req, res) => {
  try {
    const votes = await Vote.find({ voter: req.user.id })
      .populate('election', 'title type startDate endDate')
      .populate('candidate', 'name photo')
      .populate('party', 'name symbol')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: votes.length,
      votes: votes.map(v => ({
        receiptNumber: v.receiptNumber,
        timestamp: v.timestamp,
        election: v.election,
        candidate: v.candidate,
        party: v.party,
        status: v.status
      }))
    });

  } catch (error) {
    console.error('Get voting history error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
