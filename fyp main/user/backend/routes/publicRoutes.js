const express = require('express');
const {
  getActiveElections,
  getElectionDetails,
  getElectionResults,
  getParties,
  getPartyDetails,
  getCandidatesByElection,
  getCandidateDetails,
  getAllCandidates,
  getDistricts,
  getHalqasByDistrict,
  detectCnicDistrict
} = require('../controllers/electionController');
const { chatWithVoter } = require('../controllers/chatbotController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/elections', optionalAuth, getActiveElections);
router.get('/elections/:id', optionalAuth, getElectionDetails);
router.get('/elections/:id/results', getElectionResults);
router.get('/elections/:electionId/candidates', optionalAuth, getCandidatesByElection);

router.get('/districts', getDistricts);
router.get('/districts/:districtCode/halqas', getHalqasByDistrict);
router.get('/cnic-district/:cnicPrefix', detectCnicDistrict);

router.get('/parties', getParties);
router.get('/parties/:id', getPartyDetails);

router.get('/candidates/:id', optionalAuth, getCandidateDetails);
router.get('/candidates', optionalAuth, getAllCandidates);
router.post('/chat', chatWithVoter);

module.exports = router;
