const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

router.post('/save', interviewController.saveInterview);
router.get('/candidate/:username', interviewController.getCandidateInterviews);
router.get('/interviewer/:username', interviewController.getInterviewerInterviews);

module.exports = router;
