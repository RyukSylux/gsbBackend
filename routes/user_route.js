/**
 * Ce routeur fournit les points de terminaison pour administrer les comptes utilisateurs.
 * La plupart des opérations nécessitent une authentification active (JWT valide) et implémentent des gardes.
 * 
 * @fileoverview Routes pour la gestion des utilisateurs
 * @module routes/user
 */

const express = require('express')
const router = express.Router()

// Importation des fonctions du contrôleur utilisateur
const { getUsers, getUsersByEmail, createUser, deleteUser, updateUser } = require('../controller/user_controller')

// Importation du middleware d'authentification pour sécuriser l'accès aux routes
const { verifyToken, isAdmin } = require('../controller/authentification_controller')

/**
 * Route GET pour récupérer les utilisateurs
 * 
 * Accès : Utilisateur connecté.
 * Comportement : Les utilisateurs simples doivent obligatoirement passer leur propre e-mail
 * en paramètre de requête (?email=...) pour consulter uniquement leurs informations.
 * Les administrateurs peuvent appeler cette route sans paramètre pour lister tout le monde.
 * 
 * @name GET /api/users/
 * @function
 * @memberof module:routes/user
 * @inner
 * @param {string} path - Chemin '/'
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} getUsers - Contrôleur de recherche/listing
 */
router.get('/', verifyToken, getUsers)

/**
 * Route POST pour créer un nouvel utilisateur (Inscription)
 * 
 * Accès : Public (pas de middleware `verifyToken` ici car c'est le formulaire d'inscription).
 * Sécurité : Le contrôleur `createUser` force le rôle à 'user' pour interdire toute auto-promulgation en admin.
 * 
 * @name POST /api/users/
 * @function
 * @memberof module:routes/user
 * @inner
 * @param {string} path - Chemin '/'
 * @param {callback} createUser - Contrôleur de création de compte
 */
router.post('/', createUser)

/**
 * Route GET pour obtenir un utilisateur spécifique par son adresse e-mail
 * 
 * Accès : Administrateur OU propriétaire de l'adresse e-mail (vérifié dans le contrôleur).
 * 
 * @name GET /api/users/:email
 * @function
 * @memberof module:routes/user
 * @inner
 * @param {string} path - Chemin '/:email'
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} getUsersByEmail - Contrôleur de récupération unitaire
 */
router.get('/:email', verifyToken, getUsersByEmail)

/**
 * Route DELETE pour supprimer un utilisateur
 * 
 * Accès : Administrateur OU propriétaire du compte.
 * Comportement : Supprime également toutes les factures de l'utilisateur et leurs fichiers sur AWS S3 en cascade.
 * 
 * @name DELETE /api/users/:email
 * @function
 * @memberof module:routes/user
 * @inner
 * @param {string} path - Chemin '/:email'
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} deleteUser - Contrôleur de suppression en cascade
 */
router.delete('/:email', verifyToken, deleteUser)

/**
 * Route PUT pour mettre à jour les informations d'un compte utilisateur
 * 
 * Accès : Administrateur OU propriétaire du compte.
 * Champs concernés : Nom, email, mot de passe (avec hachage), rôle (uniquement modifiable par l'admin).
 * 
 * @name PUT /api/users/:email
 * @function
 * @memberof module:routes/user
 * @inner
 * @param {string} path - Chemin '/:email'
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} updateUser - Contrôleur de modification
 */
router.put('/:email', verifyToken, updateUser)

module.exports = router