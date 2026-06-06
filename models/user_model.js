/**
 * Ce fichier définit la structure d'un compte utilisateur (Commercial, Admin, etc.)
 * et implémente des hooks de cycle de vie (middlewares) Mongoose pour la sécurité.
 * 
 * @fileoverview Modèle Mongoose pour les utilisateurs
 * @module models/user
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config();

// Note : La clé JWT_SALT n'est plus nécessaire ici car Bcrypt gère son propre sel intégré dans le hash final.

/**
 * Schéma Mongoose pour les utilisateurs
 * 
 * Définit les champs, les types de données, les contraintes et l'unicité
 * des comptes de la base de données.
 * 
 * @typedef {Object} UserSchema
 * @property {string} name - Nom complet de l'utilisateur
 * @property {string} email - Email unique servant d'identifiant de connexion
 * @property {string} password - Mot de passe haché de l'utilisateur
 * @property {Date} createdAt - Date d'inscription
 * @property {string} role - Niveau d'habilitation ('admin', 'commercial', 'user')
 */
const userSchema = new mongoose.Schema({
    // Nom ou prénom de l'utilisateur
    name:{
        type: String,
        required: true,
    },
    // Adresse email, doit être unique dans tout le système
    email:{
        type: String,
        required : true,
        unique: true, // Crée un index d'unicité MongoDB pour rejeter les doublons
    },
    // Mot de passe (qui sera haché avant stockage)
    password:{
        type: String,
        required : true,
    },
    // Date de création du compte utilisateur
    createdAt:{
        type: Date,
        default : Date.now, // Valeur par défaut : date actuelle
        required : true,
    },      
    // Rôle déterminant les droits d'accès aux ressources
    role:{
        type: String,
        default: 'user', // Rôle de base par défaut
        enum: ['admin', 'commercial', 'user'] // Sécurité : Limite les valeurs autorisées
    }
})

/**
 * Middleware Mongoose pré-sauvegarde (pre-save hook)
 * 
 * S'exécute automatiquement avant la création ou la mise à jour (via .save()) d'un document User.
 * 
 * Rôles clés :
 * 1. Vérification d'unicité applicative : Recherche si un utilisateur avec le même e-mail existe déjà.
 *    (Complète l'index d'unicité physique de MongoDB).
 * 2. Sécurité des mots de passe : Si le mot de passe est défini/modifié, il génère un sel Bcrypt
 *    et remplace le mot de passe en clair par sa version hachée unidirectionnelle.
 * 
 * @param {function} next - Callback Mongoose pour passer à l'étape suivante de la sauvegarde
 */
userSchema.pre('save', async function (next) {
    try {
        // 1. Recherche d'un utilisateur existant avec la même adresse e-mail
        const existingUser = await this.constructor.findOne({ email: this.email });
        if (existingUser) {
            // Lève une erreur si l'e-mail est déjà attribué
            throw new Error('User already exists');
        }

        // 2. Hachage sécurisé du mot de passe avec Bcrypt
        // Bcrypt génère un "salt" (sel) unique à 10 rounds pour renforcer le chiffrement
        const salt = await bcrypt.genSalt(10);
        // Remplace le mot de passe en clair par la version hachée sécurisée
        this.password = await bcrypt.hash(this.password, salt);
        
        // Poursuit la procédure de sauvegarde Mongoose
        next();
    } catch (error) {
        // Transmet l'erreur à Mongoose pour bloquer la sauvegarde et remonter l'exception au contrôleur
        next(error); 
    }
});

// Compile le modèle à partir du schéma
const User = mongoose.model('User', userSchema)

module.exports = User