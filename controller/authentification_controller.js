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
            return res.status(401).json({ message: 'Authentification requise' });
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Session expirée ou invalide' });
            }
            req.user = decoded;
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Droits administrateur requis' });
            }
            next();
        });

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
  
/**
 * Authentifie un utilisateur (Cookie + JSON Token pour compatibilité Mac/Safari)
 */
const authenticateUser = async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({ message: 'Identifiants invalides' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Identifiants invalides' });
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
        message: 'Connexion réussie',
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
        return res.status(401).json({ message: 'Session expirée' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Session invalide' });
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
    res.json({ message: 'Déconnexion réussie' });
}

module.exports = { isAdmin, authenticateUser, verifyToken, logout }