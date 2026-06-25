const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Party = require('../models/Party');
const User = require('../models/User');
const Vote = require('../models/Vote');
const FraudLog = require('../models/FraudLog');
const ActivityLog = require('../models/ActivityLog');
const Analytics = require('../models/Analytics');
const { getFraudTypeLabel } = require('../utils/fraudLogHelpers');
const {
  getDistrictByCode,
  isValidHalqaForDistrict,
  normalizeHalqaId
} = require('../utils/halqaData');

const normalizeCnic = (value) => String(value || '').replace(/\D/g, '');
const uniqueIds = (values = []) => [...new Set(values.filter(Boolean).map(String))];
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};
const safeReportSlug = (value) => String(value || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const normalizeHalqaPayload = (body = {}) => {
  const districtCode = String(body.districtCode || '').trim();
  const districtRecord = districtCode ? getDistrictByCode(districtCode) : null;
  const halqaId = normalizeHalqaId(body.halqaId || body.constituency);
  const constituency = halqaId || String(body.constituency || '').trim();

  if (districtCode && !districtRecord) {
    throw new Error('Selected district was not found.');
  }

  if (districtRecord && !isValidHalqaForDistrict(districtRecord.code, halqaId)) {
    throw new Error(`Selected halqa does not belong to ${districtRecord.name}.`);
  }

  return {
    districtCode: districtRecord?.code || districtCode || undefined,
    district: districtRecord?.name || String(body.district || '').trim() || undefined,
    halqaId: halqaId || undefined,
    constituency
  };
};

const rebuildElectionTallies = async (electionId) => {
  const election = await Election.findById(electionId).select('candidates eligibleVoters totalVotes turnoutPercentage results');
  if (!election) {
    return null;
  }

  const [votes, candidates] = await Promise.all([
    Vote.find({ election: election._id }).select('candidate party'),
    Candidate.find({ _id: { $in: election.candidates } }).select('_id party')
  ]);

  const candidatePartyMap = new Map(
    candidates.map((candidate) => [String(candidate._id), candidate.party ? String(candidate.party) : null])
  );
  const voteCountMap = new Map();

  votes.forEach((vote) => {
    const candidateId = String(vote.candidate);
    voteCountMap.set(candidateId, (voteCountMap.get(candidateId) || 0) + 1);

    if (!candidatePartyMap.has(candidateId)) {
      candidatePartyMap.set(candidateId, vote.party ? String(vote.party) : null);
    }
  });

  election.totalVotes = votes.length;
  election.turnoutPercentage = election.eligibleVoters
    ? (election.totalVotes / election.eligibleVoters) * 100
    : 0;
  election.results = (election.candidates || []).map((candidateId) => {
    const candidateKey = String(candidateId);
    const totalCandidateVotes = voteCountMap.get(candidateKey) || 0;

    return {
      candidateId,
      partyId: candidatePartyMap.get(candidateKey) || undefined,
      votes: totalCandidateVotes,
      percentage: election.totalVotes > 0 ? (totalCandidateVotes / election.totalVotes) * 100 : 0
    };
  });

  await election.save();
  return election;
};

// @desc    Get all elections
// @route   GET /api/admin/elections
// @access  Private/Admin
exports.getElections = async (req, res) => {
  try {
    const { status, type, halqaId, districtCode, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (districtCode) query.districtCode = districtCode;
    if (halqaId) query.$or = [{ halqaId: normalizeHalqaId(halqaId) }, { constituency: normalizeHalqaId(halqaId) }];

    const elections = await Election.find(query)
      .populate('candidates', 'name photo party')
      .populate('parties', 'name symbol')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Election.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      elections
    });

  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single election
// @route   GET /api/admin/elections/:id
// @access  Private/Admin
exports.getElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate('candidates')
      .populate('parties');

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    res.status(200).json({ success: true, election });

  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create election
// @route   POST /api/admin/elections
// @access  Private/Admin
exports.createElection = async (req, res) => {
  try {
    const halqaPayload = normalizeHalqaPayload(req.body);
    const electionData = {
      ...req.body,
      createdBy: req.user.id,
      title: String(req.body.title || '').trim(),
      description: String(req.body.description || '').trim(),
      ...halqaPayload,
      candidates: uniqueIds(req.body.candidates),
      parties: uniqueIds(req.body.parties)
    };

    const election = await Election.create(electionData);

    res.status(201).json({
      success: true,
      message: 'Election created successfully',
      election
    });

  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update election
// @route   PUT /api/admin/elections/:id
// @access  Private/Admin
exports.updateElection = async (req, res) => {
  try {
    let election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    const updatePayload = {
      ...req.body,
      ...(req.body.districtCode !== undefined || req.body.halqaId !== undefined || req.body.constituency !== undefined
        ? normalizeHalqaPayload(req.body)
        : {})
    };

    election = await Election.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Election updated successfully',
      election
    });

  } catch (error) {
    console.error('Update election error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete election
// @route   DELETE /api/admin/elections/:id
// @access  Private/Admin
exports.deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    await election.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Election deleted successfully'
    });

  } catch (error) {
    console.error('Delete election error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all parties
// @route   GET /api/admin/parties
// @access  Private/Admin
exports.getParties = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;

    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const parties = await Party.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Party.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      parties
    });

  } catch (error) {
    console.error('Get parties error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create party
// @route   POST /api/admin/parties
// @access  Private/Admin
exports.createParty = async (req, res) => {
  try {
    // 1. VALIDATION - Check required fields
    const { name, shortName, symbol, color } = req.body;
    
    if (!name || !shortName || !symbol) {
      // Clean up uploaded file if exists
      if (req.file) {
        const fs = require('fs');
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('File deletion error:', err);
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, shortName, symbol'
      });
    }

    // 2. VALIDATION - Check if party already exists
    const existingParty = await Party.findOne({ 
      $or: [
        { name: name.trim() },
        { shortName: shortName.trim() }
      ]
    });

    if (existingParty) {
      // Clean up uploaded file if exists
      if (req.file) {
        const fs = require('fs');
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('File deletion error:', err);
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Party with this name or short name already exists'
      });
    }

    // 3. VALIDATION - Name length checks
    if (name.length < 3 || name.length > 100) {
      if (req.file) {
        const fs = require('fs');
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('File deletion error:', err);
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Party name must be between 3 and 100 characters'
      });
    }

    // 4. VALIDATION - Symbol length
    if (symbol.length < 1 || symbol.length > 50) {
      if (req.file) {
        const fs = require('fs');
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('File deletion error:', err);
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Party symbol must be between 1 and 50 characters'
      });
    }

    // 5. VALIDATION - Validate color format (hex)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (color && !hexColorRegex.test(color)) {
      if (req.file) {
        const fs = require('fs');
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('File deletion error:', err);
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid color format. Use hex color (e.g., #1b4d3e)'
      });
    }

    // 6. PREPARE PARTY DATA
    const partyData = {
      ...req.body,
      createdBy: req.user.id,
      name: name.trim(),
      shortName: shortName.trim(),
      symbol: symbol.trim()
    };

    // 7. Handle file upload if exists
    if (req.file) {
      const path = require('path');
      // Store relative path from backend root
      partyData.logo = `/uploads/${req.file.filename}`;
    }

    // 8. CREATE PARTY
    const party = await Party.create(partyData);

    // 9. RESPONSE - Return created party with file info if uploaded
    const responseData = party.toObject();
    if (req.file) {
      responseData.uploadedFile = {
        originalName: req.file.originalname,
        size: req.file.size,
        path: responseData.logo
      };
    }

    res.status(201).json({
      success: true,
      message: 'Party created successfully',
      party: responseData
    });

  } catch (error) {
    console.error('Create party error:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('File deletion error:', err);
      });
    }

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A party with this name, short name, or registration number already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update party
// @route   PUT /api/admin/parties/:id
// @access  Private/Admin
exports.updateParty = async (req, res) => {
  try {
    let party = await Party.findById(req.params.id);

    if (!party) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }

    party = await Party.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Party updated successfully',
      party
    });

  } catch (error) {
    console.error('Update party error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete party
// @route   DELETE /api/admin/parties/:id
// @access  Private/Admin
exports.deleteParty = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);

    if (!party) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }

    await party.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Party deleted successfully'
    });

  } catch (error) {
    console.error('Delete party error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all candidates
// @route   GET /api/admin/candidates
// @access  Private/Admin
exports.getCandidates = async (req, res) => {
  try {
    const { party, constituency, districtCode, halqaId, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (party) query.party = party;
    if (constituency) query.constituency = constituency;
    if (districtCode) query.districtCode = districtCode;
    if (halqaId) query.$or = [{ halqaId: normalizeHalqaId(halqaId) }, { constituency: normalizeHalqaId(halqaId) }];
    if (status) query.status = status;

    const candidates = await Candidate.find(query)
      .populate('party', 'name symbol')
      .populate('elections', 'title type')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Candidate.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      candidates
    });

  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create candidate
// @route   POST /api/admin/candidates
// @access  Private/Admin
exports.createCandidate = async (req, res) => {
  try {
    const electionIds = uniqueIds(req.body.elections);
    const halqaPayload = normalizeHalqaPayload(req.body);
    const candidateData = {
      ...req.body,
      createdBy: req.user.id,
      name: String(req.body.name || '').trim(),
      cnic: normalizeCnic(req.body.cnic),
      email: String(req.body.email || '').trim().toLowerCase(),
      phone: String(req.body.phone || '').trim(),
      ...halqaPayload,
      biography: String(req.body.biography || '').trim(),
      elections: electionIds
    };

    const candidate = await Candidate.create(candidateData);

    if (electionIds.length) {
      const elections = await Election.find({ _id: { $in: electionIds } }).populate('parties', '_id');
      for (const election of elections) {
        const alreadyLinked = election.candidates.some((id) => String(id) === String(candidate._id));
        if (!alreadyLinked) {
          election.candidates.push(candidate._id);
        }

        const partyId = String(candidate.party);
        if (!election.parties.some((id) => String(id) === partyId)) {
          election.parties.push(candidate.party);
        }

        if (!election.results.some((entry) => String(entry.candidateId) === String(candidate._id))) {
          election.results.push({
            candidateId: candidate._id,
            partyId: candidate.party,
            votes: 0,
            percentage: 0
          });
        }

        await election.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      candidate
    });

  } catch (error) {
    console.error('Create candidate error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update candidate
// @route   PUT /api/admin/candidates/:id
// @access  Private/Admin
exports.updateCandidate = async (req, res) => {
  try {
    let candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const nextElectionIds = uniqueIds(req.body.elections ?? candidate.elections);
    const previousElectionIds = uniqueIds(candidate.elections);
    const nextHalqaPayload = req.body.districtCode !== undefined || req.body.halqaId !== undefined || req.body.constituency !== undefined
      ? normalizeHalqaPayload(req.body)
      : {
        districtCode: candidate.districtCode,
        district: candidate.district,
        halqaId: candidate.halqaId,
        constituency: candidate.constituency
      };

    const updatePayload = {
      ...req.body,
      name: req.body.name !== undefined ? String(req.body.name).trim() : candidate.name,
      cnic: req.body.cnic !== undefined ? normalizeCnic(req.body.cnic) : candidate.cnic,
      email: req.body.email !== undefined ? String(req.body.email).trim().toLowerCase() : candidate.email,
      phone: req.body.phone !== undefined ? String(req.body.phone).trim() : candidate.phone,
      ...nextHalqaPayload,
      biography: req.body.biography !== undefined ? String(req.body.biography).trim() : candidate.biography,
      elections: nextElectionIds
    };

    candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );

    const electionsToDetach = previousElectionIds.filter((id) => !nextElectionIds.includes(id));
    const electionsToAttach = nextElectionIds.filter((id) => !previousElectionIds.includes(id));

    if (electionsToDetach.length) {
      const detachTargets = await Election.find({ _id: { $in: electionsToDetach } });
      for (const election of detachTargets) {
        election.candidates = election.candidates.filter((id) => String(id) !== String(candidate._id));
        election.results = election.results.filter((entry) => String(entry.candidateId) !== String(candidate._id));
        await election.save();
      }
    }

    if (electionsToAttach.length) {
      const attachTargets = await Election.find({ _id: { $in: electionsToAttach } });
      for (const election of attachTargets) {
        if (!election.candidates.some((id) => String(id) === String(candidate._id))) {
          election.candidates.push(candidate._id);
        }
        if (!election.parties.some((id) => String(id) === String(candidate.party))) {
          election.parties.push(candidate.party);
        }
        if (!election.results.some((entry) => String(entry.candidateId) === String(candidate._id))) {
          election.results.push({
            candidateId: candidate._id,
            partyId: candidate.party,
            votes: 0,
            percentage: 0
          });
        }
        await election.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Candidate updated successfully',
      candidate
    });

  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete candidate
// @route   DELETE /api/admin/candidates/:id
// @access  Private/Admin
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    await Election.updateMany(
      { candidates: candidate._id },
      {
        $pull: {
          candidates: candidate._id,
          results: { candidateId: candidate._id }
        }
      }
    );

    await candidate.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully'
    });

  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, isVerified, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    const users = await User.find(query)
      .select('-password -otp -securityQuestions.answer')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);
    const userIds = users.map((user) => user._id);
    const voteTotals = userIds.length
      ? await Vote.aggregate([
          {
            $match: {
              voter: { $in: userIds }
            }
          },
          {
            $group: {
              _id: '$voter',
              voteCount: { $sum: 1 },
              electionIds: { $addToSet: '$election' }
            }
          }
        ])
      : [];
    const voteTotalsMap = new Map(voteTotals.map((entry) => [String(entry._id), entry]));
    const enrichedUsers = users.map((user) => {
      const voteSummary = voteTotalsMap.get(String(user._id));
      const voteCount = Number(voteSummary?.voteCount || 0);
      const userObject = user.toObject();

      return {
        ...userObject,
        voteCount,
        hasCastVote: voteCount > 0,
        votedElectionIds: voteSummary?.electionIds || []
      };
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      users: enrichedUsers
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get pending voter registration requests
// @route   GET /api/admin/voters/pending
// @access  Private/Admin
exports.getPendingVoters = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const query = { role: 'voter', status: 'pending' };

    const users = await User.find(query)
      .select('name cnic email district districtCode halqaRequestedAt createdAt')
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      users
    });
  } catch (error) {
    console.error('Get pending voters error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Approve and assign halqa to a pending voter
// @route   PUT /api/admin/voters/:id/approve
// @access  Private/Admin
exports.approveVoter = async (req, res) => {
  try {
    const voterId = req.params.id;
    const halqaId = normalizeHalqaId(req.body.halqaId || req.body.constituency);

    const user = await User.findById(voterId);
    if (!user) return res.status(404).json({ success: false, message: 'Voter not found' });
    if (user.role !== 'voter') return res.status(400).json({ success: false, message: 'Not a voter account' });

    // Validate halqa belongs to user's district if provided
    if (halqaId && !isValidHalqaForDistrict(user.districtCode, halqaId)) {
      return res.status(400).json({ success: false, message: 'Selected halqa does not belong to voter district' });
    }

    user.halqaId = halqaId || user.halqaId;
    user.status = 'approved';
    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'approve_voter',
      message: `Approved voter ${user.name || user.cnic} and assigned halqa ${user.halqaId || 'N/A'}`,
      meta: { approvedVoterId: user._id, halqaId: user.halqaId }
    });

    res.status(200).json({ success: true, message: 'Voter approved and halqa assigned', user: {
      id: user._id,
      name: user.name,
      cnic: user.cnic,
      halqaId: user.halqaId,
      status: user.status
    }});
  } catch (error) {
    console.error('Approve voter error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user active status (block/unblock)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive(boolean) is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Keep single admin integrity: cannot deactivate the only admin through this endpoint.
    if (user.role === 'admin' && isActive === false) {
      const admins = await User.countDocuments({ role: 'admin', isActive: true });
      if (admins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the only active admin account.'
        });
      }
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cnic: user.cnic,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Reset votes for a single voter
// @route   PUT /api/admin/users/:id/reset-vote
// @access  Private/Admin
exports.resetUserVotes = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'voter') {
      return res.status(400).json({ success: false, message: 'Only voter accounts can have votes reset' });
    }

    const votes = await Vote.find({ voter: user._id });
    const lockedElectionIds = uniqueIds((user.hasVoted || []).map((entry) => entry.electionId));
    const voteElectionIds = uniqueIds(votes.map((vote) => vote.election));
    const electionIds = uniqueIds([...voteElectionIds, ...lockedElectionIds]);

    if (votes.length === 0 && lockedElectionIds.length === 0) {
      user.hasVoted = [];
      await user.save();
      return res.status(200).json({ success: true, message: 'User vote history was already empty' });
    }

    const candidateCounts = votes.reduce((acc, vote) => {
      const key = vote.candidate.toString();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    await Promise.all(Object.entries(candidateCounts).map(async ([candidateId, count]) => {
      const candidate = await Candidate.findById(candidateId);
      if (candidate) {
        candidate.totalVotes = Math.max(0, candidate.totalVotes - count);
        await candidate.save();
      }
    }));

    await Vote.deleteMany({ voter: user._id });
    await User.updateOne(
      { _id: user._id },
      { $set: { hasVoted: [] } }
    );

    await Promise.all(electionIds.map((electionId) => rebuildElectionTallies(electionId)));

    return res.status(200).json({
      success: true,
      message: 'Voter vote has been reset successfully. This voter can vote again.',
      reset: {
        voterId: user._id,
        votesDeleted: votes.length,
        electionsReset: electionIds.length
      }
    });
  } catch (error) {
    console.error('Reset user votes error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Reset all votes across the system
// @route   PUT /api/admin/users/reset-all-votes
// @access  Private/Admin
exports.resetAllVotes = async (req, res) => {
  try {
    const deleteResult = await Vote.deleteMany({});
    await Candidate.updateMany({}, { $set: { totalVotes: 0 } });
    const userResult = await User.updateMany({ role: 'voter' }, { $set: { hasVoted: [] } });
    const elections = await Election.find({}).select('_id');

    await Promise.all(elections.map((election) => rebuildElectionTallies(election._id)));

    return res.status(200).json({
      success: true,
      message: 'All voter votes have been reset successfully. Every voter can vote again.',
      reset: {
        votesDeleted: deleteResult.deletedCount || 0,
        votersReset: userResult.modifiedCount || 0,
        electionsReset: elections.length
      }
    });
  } catch (error) {
    console.error('Reset all votes error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'voter' });
    const totalElections = await Election.countDocuments();
    const activeElections = await Election.countDocuments({ status: 'active' });
    const totalVotes = await Vote.countDocuments();
    const totalFraudAlerts = await FraudLog.countDocuments({ isResolved: false });
    const totalParties = await Party.countDocuments({ isActive: true });
    const totalCandidates = await Candidate.countDocuments({ status: 'active' });

    const recentVotes = await Vote.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('voter', 'name cnic')
      .populate('election', 'title')
      .populate('candidate', 'name');

    const fraudLogs = await FraudLog.find({ isResolved: false })
      .sort({ detectedAt: -1 })
      .limit(10)
      .populate('userId', 'name cnic email')
      .populate('electionId', 'title');

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalElections,
        activeElections,
        totalVotes,
        totalFraudAlerts,
        totalParties,
        totalCandidates
      },
      recentVotes,
      fraudAlerts: fraudLogs
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get fraud logs
// @route   GET /api/admin/fraud-logs
// @access  Private/Admin
exports.getFraudLogs = async (req, res) => {
  try {
    const { severity, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const logs = await FraudLog.find(query)
      .populate('userId', 'name cnic email isActive')
      .populate('electionId', 'title type')
      .populate('voteId', 'receiptNumber')
      .sort({ detectedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await FraudLog.countDocuments(query);

    const formattedLogs = logs.map((log) => {
      const raw = log.toObject();
      const user = raw.userId || null;

      return {
        ...raw,
        voterName: user?.name || raw.userName || 'Unknown voter',
        voterId: user?.cnic || raw.userCnic || 'N/A',
        voterEmail: user?.email || raw.userEmail || 'N/A',
        isUserBlocked: user ? user.isActive === false : false,
        canUnblock: Boolean(user?._id && user.isActive === false),
        fraudTypeLabel: getFraudTypeLabel(raw.fraudType),
        voteReceiptNumber: raw.voteId?.receiptNumber || '',
        electionTitle: raw.electionId?.title || 'Unknown election'
      };
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      logs: formattedLogs
    });

  } catch (error) {
    console.error('Get fraud logs error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Resolve fraud log
// @route   PUT /api/admin/fraud-logs/:id/resolve
// @access  Private/Admin
exports.resolveFraudLog = async (req, res) => {
  try {
    const { notes } = req.body;

    const fraudLog = await FraudLog.findById(req.params.id);

    if (!fraudLog) {
      return res.status(404).json({ success: false, message: 'Fraud log not found' });
    }

    await fraudLog.markAsResolved(req.user.id, notes);

    res.status(200).json({
      success: true,
      message: 'Fraud log resolved successfully',
      fraudLog
    });

  } catch (error) {
    console.error('Resolve fraud log error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/activity-logs
// @access  Private/Admin
exports.getActivityLogs = async (req, res) => {
  try {
    const activities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('userId', 'email cnic role');

    if (!activities) {
      return res.status(200).json({ success: true, activities: [] });
    }

    const formattedActivities = activities.map(log => ({
      ...log.toObject(),
      userEmail: log.userId?.email || 'Unknown',
      userRole: log.userId?.role || 'unknown',
      actionDisplay: log.action === 'login' ? '🔓 Login' : 
                     log.action === 'logout' ? '🔐 Logout' :
                     log.action === 'register' ? '📝 Registration' :
                     log.action === 'vote' ? '🗳️ Vote Cast' :
                     log.action === 'fraud_detected' ? '⚠️ Fraud Detected' : '📌 Activity'
    }));

    res.status(200).json({
      success: true,
      count: formattedActivities.length,
      activities: formattedActivities
    });

  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/users/statistics
// @access  Private/Admin
exports.getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isActive: false });
    const fraudCount = await FraudLog.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    res.status(200).json({
      success: true,
      statistics: {
        totalUsers,
        blockedUsers,
        fraudCount,
        verifiedUsers,
        activeUsers: totalUsers - blockedUsers
      }
    });

  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Export election report
// @route   GET /api/admin/reports/:id
// @access  Private/Admin
exports.getElectionReport = async (req, res) => {
  try {
    const reportType = String(req.query.type || 'summary').toLowerCase();
    const allowedTypes = new Set(['summary', 'turnout', 'results', 'fraud']);
    if (!allowedTypes.has(reportType)) {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    const election = await Election.findById(req.params.id)
      .populate('candidates', 'name cnic email phone photo constituency biography education experience party status totalVotes')
      .populate({ path: 'candidates', populate: { path: 'party', select: 'name symbol color logo' } })
      .populate('parties', 'name symbol color logo')
      .populate({ path: 'results.candidateId', select: 'name party constituency education experience photo', populate: { path: 'party', select: 'name symbol color logo' } })
      .populate('results.partyId', 'name symbol color logo');

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    const candidateVoteMap = new Map(
      (election.results || []).map((entry) => [String(entry.candidateId?._id || entry.candidateId), entry])
    );

    const candidateRows = (election.candidates || [])
      .map((candidate) => {
        const result = candidateVoteMap.get(String(candidate._id)) || {};
        const votes = Number(result.votes || 0);
        const percentage = election.totalVotes > 0 ? ((votes / election.totalVotes) * 100).toFixed(2) : '0.00';
        return {
          name: candidate.name || 'Unknown',
          party: candidate.party?.name || 'Independent',
          constituency: candidate.constituency || election.constituency || '',
          education: candidate.education || '',
          experience: candidate.experience || '',
          votes,
          percentage
        };
      })
      .sort((left, right) => right.votes - left.votes);

    const fraudLogs = reportType === 'fraud' || reportType === 'summary'
      ? await FraudLog.find({ electionId: election._id })
        .populate('userId', 'name cnic email')
        .sort({ detectedAt: -1 })
      : [];

    const totalVotes = election.totalVotes || candidateRows.reduce((sum, row) => sum + row.votes, 0);
    const turnout = typeof election.turnoutPercentage === 'number'
      ? election.turnoutPercentage.toFixed(2)
      : election.eligibleVoters > 0
        ? ((totalVotes / election.eligibleVoters) * 100).toFixed(2)
        : '0.00';

    const lines = [];
    lines.push(`iVotePK Election Report`);
    lines.push(`Report Type,${csvCell(reportType)}`);
    lines.push(`Generated At,${csvCell(formatDateTime(new Date()))}`);
    lines.push(`Election Title,${csvCell(election.title)}`);
    lines.push(`Election Type,${csvCell(election.type)}`);
    lines.push(`Constituency,${csvCell(election.constituency)}`);
    lines.push(`Status,${csvCell(election.status)}`);
    lines.push(`Start Date,${csvCell(formatDateTime(election.startDate))}`);
    lines.push(`End Date,${csvCell(formatDateTime(election.endDate))}`);
    lines.push(`Eligible Voters,${csvCell(election.eligibleVoters)}`);
    lines.push(`Total Votes,${csvCell(totalVotes)}`);
    lines.push(`Turnout Percentage,${csvCell(turnout)}`);
    lines.push(`Linked Parties,${csvCell((election.parties || []).map((party) => party.name).join('; '))}`);
    lines.push('');
    lines.push('Candidate Results');
    lines.push(['Candidate', 'Party', 'Constituency', 'Education', 'Experience', 'Votes', 'Percentage'].map(csvCell).join(','));
    candidateRows.forEach((row) => {
      lines.push([
        row.name,
        row.party,
        row.constituency,
        row.education,
        row.experience,
        row.votes,
        row.percentage
      ].map(csvCell).join(','));
    });

    if (reportType === 'fraud' || reportType === 'summary') {
      lines.push('');
      lines.push('Fraud Logs');
      lines.push(['Detected At', 'Voter Name', 'CNIC', 'Fraud Type', 'Severity', 'Risk Score', 'Status'].map(csvCell).join(','));
      fraudLogs.forEach((log) => {
        lines.push([
          formatDateTime(log.detectedAt),
          log.userId?.name || log.userName || 'Unknown',
          log.userId?.cnic || log.userCnic || '',
          getFraudTypeLabel(log.fraudType),
          log.severity || '',
          log.riskScore ?? '',
          log.status || ''
        ].map(csvCell).join(','));
      });
    }

    const filename = `election_report_${safeReportSlug(reportType)}_${safeReportSlug(election.title)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(lines.join('\r\n'));
  } catch (error) {
    console.error('Get election report error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
