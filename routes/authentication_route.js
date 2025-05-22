/**
 * @fileoverview Routes pour l'authentification des utilisateurs
 * @module routes/authentication
 */

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../controller/authentification_controller');

/**
 * Route POST pour l'authentification des utilisateurs
 * @name POST/authentication
 * @function
 * @memberof module:routes/authentication
 * @inner
 * @param {string} path - Chemin de la route '/'
 * @param {callback} middleware - Gestionnaire de la route pour l'authentification
 */
router.post('/', authenticateUser);

module.exports = router;