const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../controller/authentification_controller');

router.post('/', authenticateUser);

module.exports = router;