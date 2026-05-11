/**
 * @fileoverview Modèle Mongoose pour les factures
 * @module models/bill
 */

const mongoose = require('mongoose')

/**
 * Schéma Mongoose pour les factures
 * @typedef {Object} BillSchema
 * @property {string} date - Date de la facture (Format ISO ou String)
 * @property {number} amount - Montant de la facture
 * @property {string} description - Description de la facture
 * @property {string} proof - URL du justificatif dans S3
 * @property {string} category - Catégorie de la facture ('Transport', 'Hébergement', 'Repas', 'Autre')
 * @property {string} status - Statut ('pending', 'not-paid', 'paid', 'refunded')
 * @property {mongoose.Types.ObjectId} user - Référence vers l'utilisateur propriétaire
 * @property {Date} createdAt - Date de création en base
 */
const billSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: 'Aucune description',
    },
    createdAt:{
        type: Date,
        default : Date.now,
        required : true,
    },
    proof: {
        type: String,
        required: true
    },    
    category: {
        type: String,
        default: 'Autre'
    },
    status: {
        type: String,
        required: true,
        default: 'pending',
        enum: ['pending', 'not-paid', 'paid', 'refunded']
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