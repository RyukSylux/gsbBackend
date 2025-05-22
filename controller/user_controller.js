/**
 * @fileoverview Contrôleur pour la gestion des utilisateurs
 * @module controllers/user
 */

const User = require('../models/user_model')
const sha256 = require('js-sha256')
require('dotenv').config();

const JWT_SALT = process.env.JWT_SALT || 'salt'

/**
 * Récupère tous les utilisateurs ou filtre par email
 * @async
 * @function getUsers
 * @param {Object} req - Requête Express
 * @param {Object} req.query - Paramètres de requête
 * @param {string} [req.query.email] - Email optionnel pour filtrer les utilisateurs
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>} - Renvoie la liste des utilisateurs
 */
const getUsers = async(req,res) => {
    try {
        const email = req.query.email ? {email: req.query.email} : {}
        const users = await User.find(email)
        res.json(users)
    }
    catch (error) {
        res.status(500).json({message: "Server error"})
    }
}

/**
 * Récupère un utilisateur par son email
 * @async
 * @function getUsersByEmail
 * @param {Object} req - Requête Express
 * @param {Object} req.query - Paramètres de requête
 * @param {string} req.query.email - Email de l'utilisateur à rechercher
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>} - Renvoie l'utilisateur trouvé
 */
const getUsersByEmail = async(req,res) => {
    try {
        // Check if the email query parameter is provided
        const email = req.query.email
        const users = await User.find({email})
        if(!users){
            throw new Error('User not found', {cause: 404})
        } else {
            res.json(users)
        }
    }
    catch (error) {
        if (error['cause'] === 404) {
            res.status(404).json({message: error.message})
        } else{
            res.status(500).json({message: "Server error"})
        }
    }
}

/**
 * Met à jour les informations d'un utilisateur
 * @async
 * @function updateUser
 * @param {Object} req - Requête Express
 * @param {Object} req.params - Paramètres de route
 * @param {string} req.params.email - Email de l'utilisateur à mettre à jour
 * @param {Object} req.body - Données de mise à jour
 * @param {string} [req.body.currentPassword] - Mot de passe actuel (requis pour non-admin)
 * @param {string} [req.body.newPassword] - Nouveau mot de passe
 * @param {string} [req.body.role] - Nouveau rôle
 * @param {string} [req.body.newEmail] - Nouvel email
 * @param {string} [req.body.name] - Nouveau nom
 * @param {string} [req.body.description] - Nouvelle description
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>} - Renvoie l'utilisateur mis à jour
 */
const updateUser = async(req, res) => {
    try {
        const email = req.params.email;
        const {currentPassword, newPassword, role, newEmail, name, description} = req.body;
        const isAdmin = req.user.role === 'admin'; // On récupère le rôle de l'utilisateur qui fait la requête
        
        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Si l'utilisateur n'est pas admin et qu'il veut changer le mot de passe, vérifier l'ancien
        if (newPassword && !isAdmin) {
            // Hash du mot de passe actuel pour comparaison
            const hashedCurrentPassword = sha256(currentPassword + JWT_SALT);
            if (hashedCurrentPassword !== user.password) {
                return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
            }
        }

        // Préparer les données de mise à jour
        const updateData = {
            ...(role && { role }),
            ...(newEmail && { email: newEmail }),
            ...(name && { name }),
            ...(description && { description })
        };

        // Si un nouveau mot de passe est fourni, le hasher
        if (newPassword) {
            updateData.password = sha256(newPassword + JWT_SALT);
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            updateData,
            { new: true }
        );

        // Ne pas renvoyer le mot de passe dans la réponse
        const userResponse = updatedUser.toObject();
        delete userResponse.password;
        
        res.status(200).json(userResponse);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Crée un nouvel utilisateur
 * @async
 * @function createUser
 * @param {Object} req - Requête Express
 * @param {Object} req.body - Données du nouvel utilisateur
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>} - Renvoie l'utilisateur créé
 * @throws {Error} - Erreur si l'utilisateur existe déjà
 */
const createUser = async(req, res) => {
    const newUser = req.body
    try {
        const user = await User.create(newUser)
        return res.status(201).json(user)
    } catch (error) {
        if (error.code === 'User already exists') {
            return res.status(409).json({message: 'User already exists'})
        } else {
            return res.status(500).json({message: "Server error"})
        }
    } 
}

/**
 * Supprime un utilisateur par son email
 * @async
 * @function deleteUser
 * @param {Object} req - Requête Express
 * @param {Object} req.params - Paramètres de route
 * @param {string} req.params.email - Email de l'utilisateur à supprimer
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>} - Renvoie un message de confirmation
 */
const deleteUser = async(req, res) => {
    try {
            const user = await User.findOneAndDelete({email : req.params.email})
            res.status(200).json({message: 'User deleted'})
        }
    catch (error) {
        res.status(500).json({message: "Server error"})
    }
}

module.exports = {getUsers, getUsersByEmail, createUser, updateUser, deleteUser}