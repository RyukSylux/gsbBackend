/**
 * Ce fichier définit la structure d'une facture stockée dans MongoDB via Mongoose.
 * 
 * @fileoverview Modèle Mongoose pour les factures (Frais de notes de frais)
 * @module models/bill
 */

const mongoose = require('mongoose')

/**
 * Schéma Mongoose pour les factures (bills)
 * 
 * Ce schéma représente un enregistrement de note de frais ou justificatif.
 * Il comprend des contraintes d'intégrité, des valeurs par défaut et des énumérations pour les statuts.
 * 
 * @typedef {Object} BillSchema
 * @property {string} date - Date d'émission de la facture (saisie par l'utilisateur)
 * @property {number} amount - Montant de la facture (en euros, obligatoire)
 * @property {string} description - Description textuelle (ex: "Déjeuner client")
 * @property {Date} createdAt - Horodatage de création de la ligne (défaut: maintenant)
 * @property {string} proof - URL absolue pointant vers le justificatif stocké sur AWS S3
 * @property {string} category - Catégorie de la dépense
 * @property {string} status - Statut de traitement ('pending', 'not-paid', 'paid', 'refunded')
 * @property {mongoose.Types.ObjectId} user - Identifiant de l'utilisateur Mongoose qui a soumis la facture
 */
const billSchema = new mongoose.Schema({
    // Date de facturation fournie par le commercial/utilisateur
    date: {
        type: String,
        required: true // Rend la date obligatoire lors de la création
    },
    // Montant total TTC de la facture
    amount: {
        type: Number,
        required: true // Champ obligatoire
    },
    // Détail ou commentaire libre sur la dépense
    description: {
        type: String,
        default: 'Aucune description', // Fallback si non renseigné
    },
    // Date d'enregistrement dans le système
    createdAt:{
        type: Date,
        default : Date.now, // Définit automatiquement la date courante à l'insertion
        required : true,
    },
    // Lien/URL S3 vers la preuve d'achat (image du reçu, ticket, etc.)
    proof: {
        type: String,
        required: true // Obligatoire pour justifier le remboursement
    },    
    // Catégorisation de la dépense
    category: {
        type: String,
        default: 'Autre' // Valeur par défaut
    },
    // Cycle de vie/Statut de la demande de remboursement
    status: {
        type: String,
        required: true,
        default: 'pending', // Commande initialement en attente d'approbation
        enum: ['pending', 'not-paid', 'paid', 'refunded'] // Limite les valeurs acceptées en BDD
    },
    // Référence de relation (Clé étrangère SQL-like) vers le modèle User
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Associe l'identifiant au modèle Mongoose 'User'
        required: true // Chaque facture doit obligatoirement être rattachée à un utilisateur
    }
}, {
    // Génère automatiquement les champs "createdAt" et "updatedAt" gérés par Mongoose
    timestamps: true
})

// Compile et exporte le modèle Mongoose 'Bill' basé sur le schéma défini
module.exports = mongoose.model('Bill', billSchema)