/**
 * @fileoverview Routes pour la gestion des factures
 * @module routes/bill
 */

const express = require('express')
const router = express.Router()
const { getBills, createBill, deleteBill, getBillsById, updateBill, deleteManyBills } = require('../controller/bill_controller')
const { verifyToken } = require('../controller/authentification_controller')
const upload = require('../middleware/upload')

/**
 * Route GET pour obtenir toutes les factures
 * @name GET/bills
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin de la route '/'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} getBills - Gestionnaire pour récupérer toutes les factures
 */
router.get('/', verifyToken, getBills)

/**
 * Route GET pour obtenir une facture par son ID
 * @name GET/bills/:id
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin de la route '/:_id'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} getBillsById - Gestionnaire pour récupérer une facture par ID
 */
router.get('/:_id', verifyToken, getBillsById)

/**
 * Route POST pour créer une nouvelle facture
 * @name POST/bills
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin de la route '/'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} upload.single - Middleware pour le téléchargement de fichier
 * @param {callback} createBill - Gestionnaire pour créer une facture
 */
router.post('/', verifyToken, upload.single('proof'), createBill)

/**
 * Route DELETE pour supprimer plusieurs factures
 * @name DELETE/bills/many
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin de la route '/many'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} deleteManyBills - Gestionnaire pour supprimer plusieurs factures
 */
router.delete('/many', verifyToken, deleteManyBills)

/**
 * Route DELETE pour supprimer une facture
 * @name DELETE/bills/:bill
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin de la route '/:_bill'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} deleteBill - Gestionnaire pour supprimer une facture
 */
router.delete('/:_bill', verifyToken, deleteBill)

/**
 * Route PUT pour mettre à jour une facture
 * @name PUT/bills/:id
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin de la route '/:_id'
 * @param {callback} verifyToken - Middleware de vérification du token
 * @param {callback} upload.single - Middleware pour le téléchargement de fichier
 * @param {callback} updateBill - Gestionnaire pour mettre à jour une facture
 */
router.put('/:_id', verifyToken, upload.single('proof'), updateBill)

module.exports = router