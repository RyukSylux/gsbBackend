/**
 * Ce routeur expose les points d'entrée CRUD pour la création, consultation,
 * modification, suppression (individuelle et de masse) des factures, ainsi que l'accès aux statistiques.
 * 
 * @fileoverview Routes pour la gestion des factures (notes de frais)
 * @module routes/bill
 */

const express = require('express')
const router = express.Router()

// Importation des contrôleurs de gestion des factures
const { getBills, createBill, deleteBill, getBillsById, updateBill, deleteManyBills, getStats } = require('../controller/bill_controller')

// Importation des middlewares de sécurité (authentification et autorisation administrative)
const { verifyToken, isAdmin } = require('../controller/authentification_controller')

// Importation du middleware Multer configuré pour intercepter les uploads d'images en mémoire
const upload = require('../middleware/upload')

/**
 * Route GET pour l'obtention de toutes les factures
 * 
 * Accès : Tout utilisateur authentifié.
 * Comportement : Le contrôleur `getBills` filtre automatiquement. Si l'utilisateur est admin,
 * il renvoie toutes les factures de la BDD. Sinon, il ne renvoie que ses propres factures.
 * 
 * @name GET /api/bills/
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin '/'
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} getBills - Contrôleur de récupération
 */
router.get('/', verifyToken, getBills)

/**
 * Route GET pour obtenir les statistiques globales des factures
 * 
 * Accès : Restreint aux Administrateurs uniquement (`isAdmin`).
 * Comportement : Retourne des données agrégées (sommes, décomptes) regroupées par statut et catégorie.
 * 
 * @name GET /api/bills/stats
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin '/stats'
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} isAdmin - Contrôle d'accès administrateur
 * @param {callback} getStats - Contrôleur d'agrégation de statistiques
 */
router.get('/stats', verifyToken, isAdmin, getStats)

/**
 * Route GET pour obtenir une facture spécifique par son identifiant unique
 * 
 * Accès : Utilisateur connecté propriétaire de la facture OU administrateur (sécurisé dans le contrôleur).
 * 
 * @name GET /api/bills/:_id
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin '/:_id' (ID Mongoose de la facture)
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} getBillsById - Contrôleur de recherche
 */
router.get('/:_id', verifyToken, getBillsById)

/**
 * Route POST pour créer une nouvelle facture
 * 
 * Accès : Tout utilisateur connecté.
 * Middleware particulier : `upload.single('proof')`
 * Intercepte la clé 'proof' du corps multipart/form-data. Il vérifie que c'est une image de moins de 5Mo,
 * l'extrait et l'ajoute sous forme de buffer dans `req.file`. Les autres champs (metadata JSON) restent dans `req.body.metadata`.
 * 
 * @name POST /api/bills/
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin '/'
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} upload.single - Middleware Multer de traitement du fichier image
 * @param {callback} createBill - Contrôleur de création et d'upload S3
 */
router.post('/', verifyToken, upload.single('proof'), createBill)

/**
 * Route DELETE pour supprimer plusieurs factures simultanément (suppression en masse)
 * 
 * Accès : Tout utilisateur connecté (filtrage de sécurité interne pour ne supprimer que ses propres factures si non-admin).
 * Corps attendu : `{ "ids": ["id1", "id2", ...] }`
 * 
 * @name DELETE /api/bills/many
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin '/many'
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} deleteManyBills - Contrôleur de suppression en bloc
 */
router.delete('/many', verifyToken, deleteManyBills)

/**
 * Route DELETE pour supprimer une facture individuelle
 * 
 * Accès : Propriétaire connecté de la facture ou administrateur.
 * Comportement : Supprime également la pièce justificative stockée sur AWS S3.
 * 
 * @name DELETE /api/bills/:_bill
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin '/:_bill' (Identifiant unique de la facture)
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} deleteBill - Contrôleur de suppression unitaire
 */
router.delete('/:_bill', verifyToken, deleteBill)

/**
 * Route PUT pour modifier une facture existante
 * 
 * Accès : Restreint aux administrateurs (contrôlé dans le contrôleur).
 * Middleware particulier : `upload.single('proof')` pour autoriser le remplacement optionnel
 * du justificatif d'origine stocké sur S3 par un nouveau.
 * 
 * @name PUT /api/bills/:_id
 * @function
 * @memberof module:routes/bill
 * @inner
 * @param {string} path - Chemin '/:_id' (ID Mongoose de la facture)
 * @param {callback} verifyToken - Interception et validation JWT
 * @param {callback} upload.single - Middleware Multer optionnel pour le justificatif
 * @param {callback} updateBill - Contrôleur de mise à jour
 */
router.put('/:_id', verifyToken, upload.single('proof'), updateBill)

module.exports = router