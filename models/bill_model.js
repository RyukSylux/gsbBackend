/**
 * @fileoverview Modèle Mongoose pour les factures
 * @module models/bill
 */

const mongoose = require('mongoose')

/**
 * Schéma Mongoose pour les factures
 * @typedef {Object} BillSchema
 * @property {Date} date - Date de la facture
 * @property {number} amount - Montant de la facture
 * @property {string} description - Description de la facture
 * @property {string} proof - URL du justificatif dans S3
 * @property {string} status - Statut de la facture ('En attente', 'Validé', 'Refusé')
 * @property {string} type - Type de la facture ('Restaurant', 'Transport', etc.)
 * @property {mongoose.Schema.Types.ObjectId} user - Référence vers l'utilisateur
 */
const billSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    proof: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['En attente', 'Validé', 'Refusé'],
        default: 'En attente'
    },
    type: {
        type: String,
        required: true,
        enum: ['Restaurant', 'Transport', 'Hébergement', 'Formation', 'Autre']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Bill', billSchema)