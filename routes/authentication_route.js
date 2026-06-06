/**
 * Ce routeur gère les endpoints liés à la session utilisateur :
 * la connexion (login), la déconnexion (logout) et la récupération du profil connecté.
 * 
 * @fileoverview Routes pour l'authentification des utilisateurs
 * @module routes/authentication
 */

const express = require('express');
const router = express.Router();

// Importation des contrôleurs et middlewares d'authentification associés
const { authenticateUser, logout, verifyToken } = require('../controller/authentification_controller');

/**
 * Route POST pour la connexion (authentification)
 * 
 * Reçoit l'email, le mot de passe et l'option de persistance (rememberMe) dans req.body.
 * Si valide, génère un jeton JWT retourné dans un cookie HTTP-Only et en réponse JSON.
 * 
 * @name POST /api/login/
 * @function
 * @memberof module:routes/authentication
 * @inner
 * @param {string} path - Chemin racine '/'
 * @param {callback} authenticateUser - Contrôleur de connexion
 */
router.post('/', authenticateUser);

/**
 * Route POST pour la déconnexion
 * 
 * Efface le cookie HTTP-Only 'token' stocké sur le navigateur du client.
 * 
 * @name POST /api/login/logout
 * @function
 * @memberof module:routes/authentication
 * @inner
 * @param {string} path - Chemin '/logout'
 * @param {callback} logout - Contrôleur de déconnexion
 */
router.post('/logout', logout);

/**
 * Route GET pour récupérer l'identité de l'utilisateur connecté (Vérification de session)
 * 
 * Flux de traitement :
 * 1. La requête passe d'abord par le middleware `verifyToken`.
 * 2. `verifyToken` extrait le JWT du cookie ou du header, valide la signature et expire,
 *    décode les données de l'utilisateur (id, rôle, name, email) et les injecte dans `req.user`.
 * 3. Si valide, la fonction finale renvoie simplement l'objet `req.user` décodé sous forme de JSON.
 * 
 * @name GET /api/login/me
 * @function
 * @memberof module:routes/authentication
 * @inner
 * @param {string} path - Chemin '/me'
 * @param {callback} verifyToken - Middleware d'interception et de validation du JWT
 * @param {callback} controller - Fonction fléchée de réponse renvoyant req.user
 */
router.get('/me', verifyToken, (req, res) => {
    // Renvoie les données décodées et persistées dans req.user par le middleware
    res.json(req.user);
});

module.exports = router;