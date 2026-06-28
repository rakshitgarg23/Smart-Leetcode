const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');

router.post('/submit', codeController.submitCode);
router.post('/hint', codeController.generateHint);

module.exports = router;
