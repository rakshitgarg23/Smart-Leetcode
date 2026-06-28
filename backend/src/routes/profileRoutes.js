const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/:username', profileController.getProfile);
router.get('/:username/heatmap', profileController.getHeatmap);

module.exports = router;
