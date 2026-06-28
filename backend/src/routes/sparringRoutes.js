const express = require('express');
const router = express.Router();
const sparringController = require('../controllers/sparringController');

router.post('/create', sparringController.createRoom);

module.exports = router;
