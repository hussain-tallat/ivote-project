const Analytics = require('../models/Analytics');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const FraudLog = require('../models/FraudLog');

const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinElection', async (electionId) => {
      try {
        socket.join(`election-${electionId}`);
        console.log(`Client ${socket.id} joined election ${electionId}`);

        const election = await Election.findById(electionId)
          .populate('results.candidateId', 'name photo')
          .populate('results.partyId', 'name symbol color');

        if (election) {
          socket.emit('electionData', {
            electionId,
            totalVotes: election.totalVotes,
            results: election.results,
            turnoutPercentage: election.turnoutPercentage
          });
        }
      } catch (error) {
        console.error('Join election error:', error);
        socket.emit('error', { message: 'Failed to join election' });
      }
    });

    socket.on('leaveElection', (electionId) => {
      socket.leave(`election-${electionId}`);
      console.log(`Client ${socket.id} left election ${electionId}`);
    });

    socket.on('requestAnalytics', async (electionId) => {
      try {
        const analytics = await Analytics.findOne({ electionId })
          .sort({ timestamp: -1 });

        const fraudLogs = await FraudLog.find({
          electionId,
          isResolved: false
        }).countDocuments();

        const totalVotes = await Vote.countDocuments({ election: electionId });

        socket.emit('analyticsData', {
          electionId,
          totalVotes,
          analytics: analytics || {},
          fraudAlerts: fraudLogs
        });
      } catch (error) {
        console.error('Analytics request error:', error);
        socket.emit('error', { message: 'Failed to fetch analytics' });
      }
    });

    socket.on('joinAdminDashboard', () => {
      socket.join('admin-dashboard');
      console.log(`Admin client ${socket.id} joined dashboard`);
    });

    socket.on('leaveAdminDashboard', () => {
      socket.leave('admin-dashboard');
      console.log(`Admin client ${socket.id} left dashboard`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  const emitVoteUpdate = async (electionId) => {
    try {
      const election = await Election.findById(electionId)
        .populate('results.candidateId', 'name photo')
        .populate('results.partyId', 'name symbol color');

      if (election) {
        io.to(`election-${electionId}`).emit('voteUpdate', {
          electionId,
          totalVotes: election.totalVotes,
          results: election.results,
          turnoutPercentage: election.turnoutPercentage,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Emit vote update error:', error);
    }
  };

  const emitFraudAlert = async (fraudLog) => {
    try {
      io.to('admin-dashboard').emit('fraudAlert', {
        id: fraudLog._id,
        userId: fraudLog.userId,
        electionId: fraudLog.electionId,
        fraudType: fraudLog.fraudType,
        severity: fraudLog.severity,
        riskScore: fraudLog.riskScore,
        description: fraudLog.description,
        detectedAt: fraudLog.detectedAt
      });
    } catch (error) {
      console.error('Emit fraud alert error:', error);
    }
  };

  const updateAnalytics = async (electionId) => {
    try {
      const election = await Election.findById(electionId)
        .populate('results.candidateId', 'name')
        .populate('results.partyId', 'name');

      if (!election) return;

      const votes = await Vote.find({ election: electionId });
      const fraudLogs = await FraudLog.find({ electionId });

      const partyVotes = {};
      const candidateVotes = {};

      votes.forEach(vote => {
        const partyId = vote.party.toString();
        const candidateId = vote.candidate.toString();

        partyVotes[partyId] = (partyVotes[partyId] || 0) + 1;
        candidateVotes[candidateId] = (candidateVotes[candidateId] || 0) + 1;
      });

      const partyWiseVotes = Object.keys(partyVotes).map(partyId => {
        const party = election.results.find(r => r.partyId._id.toString() === partyId)?.partyId;
        return {
          partyId,
          partyName: party?.name || 'Unknown',
          votes: partyVotes[partyId],
          percentage: (partyVotes[partyId] / election.totalVotes) * 100
        };
      });

      const candidateWiseVotes = Object.keys(candidateVotes).map(candidateId => {
        const candidate = election.results.find(r => r.candidateId._id.toString() === candidateId)?.candidateId;
        return {
          candidateId,
          candidateName: candidate?.name || 'Unknown',
          votes: candidateVotes[candidateId],
          percentage: (candidateVotes[candidateId] / election.totalVotes) * 100
        };
      });

      const fraudMetrics = {
        totalFraudAttempts: fraudLogs.length,
        flaggedVotes: await Vote.countDocuments({ election: electionId, isFlagged: true }),
        fraudPercentage: (fraudLogs.length / election.totalVotes) * 100,
        commonFraudTypes: []
      };

      const analyticsData = {
        electionId,
        timestamp: new Date(),
        totalVotes: election.totalVotes,
        turnoutRate: election.turnoutPercentage,
        partyWiseVotes,
        candidateWiseVotes,
        fraudMetrics,
        uniqueVoters: votes.length
      };

      await Analytics.create(analyticsData);

      io.to(`election-${electionId}`).emit('analyticsUpdate', analyticsData);

    } catch (error) {
      console.error('Update analytics error:', error);
    }
  };

  return {
    emitVoteUpdate,
    emitFraudAlert,
    updateAnalytics
  };
};

module.exports = setupSocketIO;
