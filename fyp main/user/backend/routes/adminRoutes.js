const express = require('express');
const {
  getElections,
  getElection,
  createElection,
  updateElection,
  deleteElection,
  getParties,
  createParty,
  updateParty,
  deleteParty,
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getUsers,
  updateUserStatus,
  resetUserVotes,
  resetAllVotes,
  getDashboardStats,
  getFraudLogs,
  resolveFraudLog,
  getActivityLogs,
  getUserStatistics,
  getElectionReport
  ,getPendingVoters, approveVoter
} = require('../controllers/adminController');
const { protect, authorize, requireMfa } = require('../middleware/auth');
const upload = require('../middleware/multerConfig');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));
router.use(requireMfa);

router.get('/stats', getDashboardStats);

router.route('/elections')
  .get(getElections)
  .post(createElection);

router.route('/elections/:id')
  .get(getElection)
  .put(updateElection)
  .delete(deleteElection);

router.route('/parties')
  .get(getParties)
  .post(upload.single('logo'), createParty);

router.route('/parties/:id')
  .put(updateParty)
  .delete(deleteParty);

router.route('/candidates')
  .get(getCandidates)
  .post(createCandidate);

router.route('/candidates/:id')
  .put(updateCandidate)
  .delete(deleteCandidate);

router.get('/users', getUsers);
router.get('/voters/pending', getPendingVoters);
router.put('/voters/:id/approve', approveVoter);
router.put('/users/reset-all-votes', resetAllVotes);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/reset-vote', resetUserVotes);

router.get('/fraud-logs', getFraudLogs);
router.put('/fraud-logs/:id/resolve', resolveFraudLog);

router.get('/activity-logs', getActivityLogs);
router.get('/users/statistics', getUserStatistics);
router.get('/reports/:id', getElectionReport);

module.exports = router;
