/**
 * @fileoverview Contrôleur gérant l'authentification et l'autorisation des utilisateurs
 * @module controllers/authentification
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '2h';
const JWT_EXPIRATION_REMEMBERED = '7d';

/**
 * Middleware vérifiant si l'utilisateur est un administrateur
 */
const isAdmin = (req, res, next) => {
    try {
        // STRATÉGIE HYBRIDE : Cookie d'abord, puis Header Authorization
        const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid session' });
            }
            req.user = decoded;
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        });

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
  
/**
 * Authentifie un utilisateur (Cookie + JSON Token pour compatibilité Mac/Safari)
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
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const expiresIn = rememberMe ? JWT_EXPIRATION_REMEMBERED : JWT_EXPIRATION;
    
    const token = jwt.sign({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        description: user.description
    }, JWT_SECRET, { expiresIn });

    const ms = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;

    // 1. Envoi dans le cookie (Sécurité)
    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'None', 
        maxAge: ms,
        path: '/'
    });

    // 2. Envoi dans le JSON (Fallback pour Mac/Safari)
    res.json({
        message: 'Login successful',
        token: token, // <-- Fallback
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
 * Vérifie la validité du token (Hybride)
 */
const verifyToken = (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Session expired' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid session' });
        }
        req.user = decoded;
        next();
    });
}

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