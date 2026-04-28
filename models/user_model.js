/**
 * @fileoverview Modèle Mongoose pour les utilisateurs
 * @module models/user
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config();

// JWT_SALT n'est plus nécessaire ici car bcrypt gère son propre sel

/**
 * Schéma Mongoose pour les utilisateurs
 * @typedef {Object} UserSchema
 * @property {string} name - Nom de l'utilisateur
 * @property {string} email - Email de l'utilisateur (unique)
 * @property {string} description - Description de l'utilisateur
 * @property {string} password - Mot de passe hashé de l'utilisateur
 * @property {string} role - Rôle de l'utilisateur ('user' ou 'admin')
 */
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required : true,
        unique: true,
    },
    password:{
        type: String,
        required : true,
    },
    createdAt:{
        type: Date,
        default : Date.now,
        required : true,
    },      
    role:{
        type: String,
        default: 'user',
        enum: ['admin', 'commercial', 'user']
    }
})

userSchema.pre('save', async function (next) {
    try {
        const existingUser = await this.constructor.findOne({ email: this.email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hachage avec Bcrypt (10 rounds par défaut si on ne précise pas, mais on le met explicitement)
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); 
    }
});

const User = mongoose.model('User', userSchema)

module.exports = User