/**
 * @fileoverview Contrôleur gérant l'authentification et l'autorisation des utilisateurs
 * @module controllers/authentification
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * @constant {string} JWT_SECRET - Clé secrète pour signer les tokens JWT
 * @default 'your_jwt_secret_key'
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// JWT_SALT n'est plus nécessaire pour les mots de passe avec Bcrypt

/**
 * @constant {string} JWT_EXPIRATION - Durée de validité par défaut des tokens JWT
 * @default '24h'
 */
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * @constant {string} JWT_EXPIRATION_REMEMBERED - Durée de validité des tokens JWT avec "Rester connecté"
 * @default '7d'
 */
const JWT_EXPIRATION_REMEMBERED = '7d';

/**
 * Middleware vérifiant si l'utilisateur est un administrateur
 * @function isAdmin
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} res - L'objet réponse Express
 * @param {Function} next - La fonction middleware suivante
 * @returns {void}
 * @throws {Error} Erreur si l'authentification échoue
 */
const isAdmin = (req, res, next) => {
    try{
      const token = req.headers['authorization']?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Token manquant' });
      }
  
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: 'Token invalide' });
        }
        req.user = decoded;
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Accès refusé' });
        }
        next();
      });
  
    }catch (error) {
      res.status(500).json({message: error.message})
    }
  }
  
  
  /**
 * Authentifie un utilisateur et génère un token JWT
 * @function authenticateUser
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.body - Le corps de la requête
 * @param {string} req.body.email - L'email de l'utilisateur
 * @param {string} req.body.password - Le mot de passe de l'utilisateur
 * @param {boolean} [req.body.rememberMe=false] - Option "Rester connecté"
 * @param {Object} res - L'objet réponse Express
 * @returns {Object} Objet contenant le token JWT et les informations utilisateur
 * @throws {Error} Erreur si l'authentification échoue
 */
const authenticateUser = async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email });
  
    if(!user){
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  
    // Utiliser une expiration de 7 jours si rememberMe est true
    const expiresIn = rememberMe ? JWT_EXPIRATION_REMEMBERED : JWT_EXPIRATION;
    
    const token = jwt.sign({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        description: user.description
    }, JWT_SECRET, { expiresIn });
    
    res.json({
        token,
        expiresIn, // Ajouter l'expiration dans la réponse pour le front
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
 * Vérifie la validité du token JWT
 * @function verifyToken
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} res - L'objet réponse Express
 * @param {Function} next - La fonction middleware suivante
 * @returns {void}
 * @throws {Error} Erreur si le token est invalide ou manquant
 */
const verifyToken = (req, res, next) =>{
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }
  
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Token invalide' });
      }
      req.user = decoded;
      next();
    });
  }
  
  
  module.exports = {isAdmin, authenticateUser, verifyToken}