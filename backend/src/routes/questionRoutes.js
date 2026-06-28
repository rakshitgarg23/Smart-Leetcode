const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

router.get('/', questionController.getQuestions);
router.get('/recommend', questionController.getRecommendation);
router.get('/:id', questionController.getQuestionById);

module.exports = router;
