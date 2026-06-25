const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Party = require('../models/Party');
const Vote = require('../models/Vote');
const User = require('../models/User');
const {
  DISTRICTS,
  buildDistrictResponse,
  detectDistrictFromCnic,
  getDistrictByCode
} = require('../utils/halqaData');

const isVoter = (req) => req.user?.role === 'voter';

const getUserHalqaId = (req) => String(req.user?.halqaId || '').trim().toUpperCase();

const getRecordHalqaId = (record) => String(record?.halqaId || record?.constituency || '').trim().toUpperCase();

const buildHalqaQuery = (halqaId) => ({
  $or: [
    { halqaId },
    { constituency: halqaId }
  ]
});

const ensureVoterCanAccessHalqa = (req, record) => {
  if (!isVoter(req)) return true;
  const userHalqaId = getUserHalqaId(req);
  if (!userHalqaId) return false;
  return getRecordHalqaId(record) === userHalqaId;
};

exports.getDistricts = async (req, res) => {
  res.status(200).json({
    success: true,
    districts: DISTRICTS.map(buildDistrictResponse)
  });
};

exports.getHalqasByDistrict = async (req, res) => {
  const district = getDistrictByCode(req.params.districtCode);
  if (!district) {
    return res.status(404).json({ success: false, message: 'District not found for this CNIC prefix' });
  }

  return res.status(200).json({
    success: true,
    district: buildDistrictResponse(district),
    halqas: district.halqas
  });
};

exports.detectCnicDistrict = async (req, res) => {
  const district = detectDistrictFromCnic(req.params.cnicPrefix || req.query.cnic);
  if (!district) {
    return res.status(404).json({ success: false, message: 'District not found for this CNIC prefix' });
  }

  return res.status(200).json({
    success: true,
    district: buildDistrictResponse(district),
    halqas: district.halqas
  });
};

// @desc    Get all active elections
// @route   GET /api/elections
// @access  Public
exports.getActiveElections = async (req, res) => {
  try {
    const { status = 'active', type, constituency } = req.query;

    const query = { status };
    if (type) query.type = type;
    if (isVoter(req)) {
      const userHalqaId = getUserHalqaId(req);
      if (!userHalqaId) {
        return res.status(200).json({
          success: true,
          count: 0,
          registeredVoterCount: 0,
          elections: []
        });
      }
      Object.assign(query, buildHalqaQuery(userHalqaId));
    } else if (constituency) {
      query.constituency = constituency;
    }

    const elections = await Election.find(query)
      .populate('parties', 'name symbol logo color')
      .populate('candidates', 'name photo party constituency')
      .sort({ startDate: -1 });

    const registeredVoterCount = await User.countDocuments({
      role: 'voter',
      isActive: true,
      isVerified: true
    });

    res.status(200).json({
      success: true,
      count: elections.length,
      registeredVoterCount,
      elections: elections.map((election) => ({
        ...election.toObject(),
        registeredVoterCount
      }))
    });

  } catch (error) {
    console.error('Get active elections error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single election with details
// @route   GET /api/elections/:id
// @access  Public
exports.getElectionDetails = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate({
        path: 'candidates',
        populate: { path: 'party', select: 'name symbol logo color' }
      })
      .populate('parties', 'name symbol logo color description');

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    if (!ensureVoterCanAccessHalqa(req, election)) {
      return res.status(403).json({ success: false, message: 'This election is not available for your saved halqa.' });
    }

    const totalVotes = await Vote.countDocuments({ election: election._id });

    res.status(200).json({
      success: true,
      election: {
        ...election.toObject(),
        totalVotes
      }
    });

  } catch (error) {
    console.error('Get election details error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get election results
// @route   GET /api/elections/:id/results
// @access  Public
exports.getElectionResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate({
        path: 'results.candidateId',
        select: 'name photo cnic party',
        populate: { path: 'party', select: 'name symbol color' }
      });

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    res.status(200).json({
      success: true,
      results: {
        electionTitle: election.title,
        totalVotes: election.totalVotes,
        turnoutPercentage: election.turnoutPercentage,
        status: election.status,
        results: election.results.sort((a, b) => b.votes - a.votes)
      }
    });

  } catch (error) {
    console.error('Get election results error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all parties
// @route   GET /api/parties
// @access  Public
exports.getParties = async (req, res) => {
  try {
    const parties = await Party.find({ isActive: true })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: parties.length,
      parties
    });

  } catch (error) {
    console.error('Get parties error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single party details
// @route   GET /api/parties/:id
// @access  Public
exports.getPartyDetails = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);

    if (!party) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }

    const candidates = await Candidate.find({ party: party._id, isActive: true })
      .populate('elections', 'title type');

    res.status(200).json({
      success: true,
      party: {
        ...party.toObject(),
        candidates
      }
    });

  } catch (error) {
    console.error('Get party details error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get candidates by election
// @route   GET /api/elections/:electionId/candidates
// @access  Public
exports.getCandidatesByElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    if (!ensureVoterCanAccessHalqa(req, election)) {
      return res.status(200).json({
        success: true,
        count: 0,
        candidates: [],
        message: 'No candidates are available for your saved halqa in this election.'
      });
    }

    const candidateQuery = {
      _id: { $in: election.candidates },
      status: 'active'
    };

    if (isVoter(req)) {
      Object.assign(candidateQuery, buildHalqaQuery(getUserHalqaId(req)));
    }

    const candidates = await Candidate.find(candidateQuery).populate('party', 'name symbol logo color');

    res.status(200).json({
      success: true,
      count: candidates.length,
      candidates
    });

  } catch (error) {
    console.error('Get candidates by election error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get candidate details
// @route   GET /api/candidates/:id
// @access  Public
exports.getCandidateDetails = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('party', 'name symbol logo color')
      .populate('elections', 'title type startDate endDate');

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    if (!ensureVoterCanAccessHalqa(req, candidate)) {
      return res.status(403).json({ success: false, message: 'This candidate is not available for your saved halqa.' });
    }

    res.status(200).json({
      success: true,
      candidate
    });

  } catch (error) {
    console.error('Get candidate details error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all candidates
// @route   GET /api/public/candidates
// @access  Public
exports.getAllCandidates = async (req, res) => {
  try {
    const query = { status: 'active' };
    if (isVoter(req)) {
      const userHalqaId = getUserHalqaId(req);
      if (!userHalqaId) {
        return res.status(200).json({ success: true, count: 0, candidates: [] });
      }
      Object.assign(query, buildHalqaQuery(userHalqaId));
    }

    const candidates = await Candidate.find(query)
      .populate('party', 'name symbol logo color')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: candidates.length,
      candidates
    });

  } catch (error) {
    console.error('Get all candidates error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
