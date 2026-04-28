/**
 * @fileoverview Routes pour l'authentification des utilisateurs
 * @module routes/authentication
 */

const express = require('express');
const router = express.Router();
const { authenticateUser, logout, verifyToken } = require('../controller/authentification_controller');

/**
 * Route POST pour l'authentification des utilisateurs
 * @name POST/authentication
 * @function
 * @memberof module:routes/authentication
 * @inner
 * @param {string} path - Chemin de la route '/'
 * @param {callback} authenticateUser - Gestionnaire de la route pour l'authentification
 */
router.post('/', authenticateUser);

/**
 * Route POST pour la déconnexion (suppression du cookie)
 * @name POST/logout
 * @function
 * @memberof module:routes/authentication
 * @inner
 * @param {string} path - Chemin de la route '/logout'
 * @param {callback} logout - Gestionnaire de la route pour la déconnexion
 */
router.post('/logout', logout);

/**
 * Route GET pour récupérer l'utilisateur actuel à partir du cookie
 * @name GET/me
 * @function
 * @memberof module:routes/authentication
 * @inner
 * @param {string} path - Chemin de la route '/me'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} controller - Retourne les infos de l'utilisateur décodé
 */
router.get('/me', verifyToken, (req, res) => {
    res.json(req.user);
});

module.exports = router;