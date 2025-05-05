const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../controller/authentification_controller');

router.post('/login', authenticateUser);

module.exports = router;