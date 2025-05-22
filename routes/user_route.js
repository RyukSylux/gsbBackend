/**
 * @fileoverview Routes pour la gestion des utilisateurs
 * @module routes/user
 */

const express = require('express')
const router = express.Router()
const { getUsers, getUsersByEmail, createUser, deleteUser, updateUser } = require('../controller/user_controller')
const { verifyToken } = require('../controller/authentification_controller')

/**
 * Route GET pour obtenir tous les utilisateurs
 * @name GET/users
 * @function
 * @memberof module:routes/user
 * @inner
 * @param {string} path - Chemin de la route '/'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} getUsers - Gestionnaire pour récupérer tous les utilisateurs
 */
router.get('/', verifyToken, getUsers)

/**
 * Route POST pour créer un nouvel utilisateur
 * @name POST/users
 * @function
 * @memberof module:routes/user
 * @inner
 * @param {string} path - Chemin de la route '/'
 * @param {callback} createUser - Gestionnaire pour créer un utilisateur
 */
router.post('/', createUser)

/**
 * Route GET pour obtenir un utilisateur par son email
 * @name GET/users/:email
 * @function
 * @memberof module:routes/user
 * @inner
 * @param {string} path - Chemin de la route '/:email'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} getUsersByEmail - Gestionnaire pour récupérer un utilisateur par email
 */
router.get('/:email', verifyToken, getUsersByEmail)

/**
 * Route DELETE pour supprimer un utilisateur
 * @name DELETE/users/:email
 * @function
 * @memberof module:routes/user
 * @inner
 * @param {string} path - Chemin de la route '/:email'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} deleteUser - Gestionnaire pour supprimer un utilisateur
 */
router.delete('/:email', verifyToken, deleteUser)

/**
 * Route PUT pour mettre à jour un utilisateur
 * @name PUT/users/:email
 * @function
 * @memberof module:routes/user
 * @inner
 * @param {string} path - Chemin de la route '/:email'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} updateUser - Gestionnaire pour mettre à jour un utilisateur
 */
router.put('/:email', verifyToken, updateUser)

module.exports = router