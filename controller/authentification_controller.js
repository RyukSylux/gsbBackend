/**
 * Ce contrôleur implémente l'émission de JWT, la vérification de session (middleware),
 * la stratégie hybride Cookie HTTP-Only + Authorization Header (pour la compatibilité Safari / Mac),
 * ainsi que le contrôle d'accès de rôle administrateur.
 * 
 * @fileoverview Contrôleur gérant l'authentification et l'autorisation des utilisateurs
 * @module controllers/authentification
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Récupération de la clé secrète JWT et des durées de validité par défaut
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '2h';
const JWT_EXPIRATION_REMEMBERED = '7d'; // Durée prolongée si "Se souvenir de moi" est coché

/**
 * Middleware vérifiant si l'utilisateur connecté possède le rôle 'admin'
 * 
 * Processus détaillé :
 * 1. STRATÉGIE HYBRIDE : Récupère le token JWT en priorité depuis les cookies sécurisés.
 *    Si absent, tente de l'extraire du Header Authorization (format: Bearer <token>).
 * 2. Si aucun token n'est trouvé, bloque la requête avec un statut 401 (Non authentifié).
 * 3. Valide le token avec jwt.verify() et la clé secrète.
 * 4. Si la signature ou l'expiration est invalide, renvoie un statut 403 (Session invalide).
 * 5. Si valide, injecte les infos décodées dans req.user et vérifie que role === 'admin'.
 * 6. Si l'utilisateur n'est pas admin, bloque la requête avec un statut 403 (Accès interdit/Forbidden).
 * 7. Si tout est correct, passe au middleware ou contrôleur suivant via next().
 * 
 * @function isAdmin
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {function} next - Callback de chaînage Express
 * @returns {void}
 */
const isAdmin = (req, res, next) => {
    try {
        // Extraction du token (hybride cookie ou en-tête d'autorisation)
        const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Vérification de la validité du token
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid session' });
            }
            // Injection du payload du token décodé dans l'objet req
            req.user = decoded;
            
            // Vérification stricte du rôle
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Forbidden' });
            }
            
            // Poursuite vers le prochain handler
            next();
        });

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
  
/**
 * Authentifie un utilisateur (Login)
 * 
 * Processus détaillé :
 * 1. Recherche l'utilisateur dans MongoDB via son adresse e-mail.
 * 2. Si introuvable, renvoie une réponse générique 401 pour éviter le "user enumeration" (fuite d'informations).
 * 3. Compare le mot de passe reçu en clair avec le mot de passe haché stocké en BDD via `bcrypt.compare()`.
 * 4. Si incorrect, renvoie une erreur 401.
 * 5. Détermine la durée de validité du jeton selon la case "rememberMe" (2h ou 7j).
 * 6. Signe un nouveau jeton JWT contenant le payload utilisateur (id, name, email, role, description).
 * 7. Envoie le token dans un Cookie HTTP-Only :
 *    - httpOnly: true -> Protège contre les attaques XSS (le script client JS ne peut pas lire le cookie).
 *    - secure: true -> Transmis uniquement sur HTTPS.
 *    - sameSite: 'None' -> Nécessaire pour les requêtes cross-origin entre domaines différents (Front/Back séparés).
 * 8. Renvoie également le token et les données utilisateur en JSON (Fallback) :
 *    - Safari et macOS ont des politiques restrictives sur les cookies tiers. 
 *      Le renvoi direct dans le JSON permet au frontend de le stocker en localStorage au besoin.
 * 
 * @async
 * @function authenticateUser
 * @param {Object} req - Requête Express
 * @param {Object} req.body - Données de connexion
 * @param {string} req.body.email - Email de l'utilisateur
 * @param {string} req.body.password - Mot de passe
 * @param {boolean} [req.body.rememberMe] - Option 'Se souvenir de moi'
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>}
 */
const authenticateUser = async (req, res) => {
    const { email, password, rememberMe } = req.body;
    
    // Recherche de l'utilisateur par e-mail
    const user = await User.findOne({ email });

    // Sécurité : même erreur si l'utilisateur n'existe pas ou si le mot de passe est faux
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Comparaison asynchrone sécurisée du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Gestion dynamique de l'expiration du token
    const expiresIn = rememberMe ? JWT_EXPIRATION_REMEMBERED : JWT_EXPIRATION;
    
    // Signature du token JWT avec les données utiles de session (payload)
    const token = jwt.sign({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        description: user.description
    }, JWT_SECRET, { expiresIn });

    // Calcul de l'expiration du cookie en millisecondes
    const ms = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;

    // 1. Envoi sécurisé dans le cookie HTTP-Only
    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'None', 
        maxAge: ms,
        path: '/'
    });

    // 2. Envoi direct dans la réponse JSON (Fallback pour Mac/Safari)
    res.json({
        message: 'Login successful',
        token: token, // <-- Fallback de secours
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            description: user.description
        }
    });
}
  
/**
 * Middleware de vérification du jeton d'authentification (Vérification de session globale)
 * 
 * Extrait le token des cookies ou de l'en-tête Authorization.
 * Si valide, injecte les données décodées dans req.user pour que les routes suivantes y accèdent.
 * 
 * @function verifyToken
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {function} next - Callback de chaînage Express
 * @returns {void}
 */
const verifyToken = (req, res, next) => {
    // Extraction hybride
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Session expired' });
    }

    // Validation du token JWT
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid session' });
        }
        // Injection du profil connecté dans la requête
        req.user = decoded;
        next();
    });
}

/**
 * Déconnecte l'utilisateur
 * 
 * Processus détaillé :
 * Supprime le cookie 'token' côté client en le remplaçant par un cookie expiré,
 * en conservant exactement les mêmes attributs de sécurité (path, secure, sameSite, httpOnly)
 * pour forcer le navigateur à l'écraser.
 * 
 * @function logout
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {void}
 */
const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/'
    });
    res.json({ message: 'Logout successful' });
}

module.exports = { isAdmin, authenticateUser, verifyToken, logout }