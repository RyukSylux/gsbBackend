/**
 * Ce module gère les opérations d'inscription, de lecture (avec filtrage sécurisé),
 * d'édition de profil (changement d'email, de nom, de mot de passe haché) et
 * de suppression de compte en cascade (nettoyage des notes de frais associées et des pièces justificatives sur S3).
 * 
 * @fileoverview Contrôleur pour la gestion des comptes utilisateurs
 * @module controllers/user
 */

const User = require('../models/user_model')
const Bill = require('../models/bill_model')
const { deleteFromS3 } = require('../utils/s3')
const bcrypt = require('bcryptjs')
require('dotenv').config();

// Note : JWT_SALT n'est plus nécessaire ici car Bcrypt gère son propre sel.

/**
 * Récupère la liste des utilisateurs (avec restriction de sécurité)
 * 
 * Logique de sécurité :
 * - Un administrateur peut lister tous les utilisateurs ou filtrer par email.
 * - Un utilisateur classique (non-admin) :
 *   - Doit obligatoirement renseigner son propre email dans les paramètres de requête.
 *   - S'il tente de lister tout le monde ou de cibler un email tiers, il reçoit une erreur 403 Forbidden.
 * 
 * @async
 * @function getUsers
 * @param {Object} req - Requête Express
 * @param {Object} req.query - Paramètres de requête de l'URL (?email=...)
 * @param {string} [req.query.email] - Email optionnel pour filtrer les utilisateurs
 * @param {Object} req.user - Utilisateur connecté décodé du JWT
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>} - Renvoie la liste des utilisateurs en JSON
 */
const getUsers = async(req,res) => {
    try {
        const queryEmail = req.query.email
        const isAdmin = req.user.role === 'admin'

        // Sécurité : Si l'utilisateur connecté n'est pas admin, il doit obligatoirement demander ses propres infos
        if (!isAdmin) {
            if (!queryEmail || queryEmail !== req.user.email) {
                return res.status(403).json({ message: 'Forbidden' })
            }
        }

        // Applique le filtre d'email s'il est spécifié, sinon récupère tout (réservé aux admins)
        const filter = queryEmail ? {email: queryEmail} : {}
        const users = await User.find(filter)
        res.json(users)
    }
    catch (error) {
        res.status(500).json({message: "Server error"})
    }
}

/**
 * Récupère un utilisateur par son adresse email (Sécurisé)
 * 
 * Logique de sécurité :
 * - Autorisé uniquement pour les Administrateurs ou le Propriétaire du compte ciblé.
 * - Renvoie 403 en cas de violation d'habilitation.
 * 
 * @async
 * @function getUsersByEmail
 * @param {Object} req - Requête Express
 * @param {Object} req.query - Paramètres de requête de l'URL (?email=...)
 * @param {string} req.query.email - Email de l'utilisateur à rechercher
 * @param {Object} req.user - Utilisateur connecté décodé du JWT
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>} - Renvoie l'utilisateur trouvé en JSON
 */
const getUsersByEmail = async(req,res) => {
    try {
        const email = req.query.email
        
        // Sécurité : Admin ou Propriétaire du compte uniquement
        if (req.user.role !== 'admin' && req.user.email !== email) {
            return res.status(403).json({ message: 'Forbidden' })
        }

        const users = await User.find({email})
        if(users.length === 0){
            // Erreur levée si aucun utilisateur n'est associé à cet e-mail
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
 * Met à jour les informations d'un compte utilisateur
 * 
 * Processus détaillé et règles de sécurité :
 * 1. Détermine la cible via le paramètre de route `:email`.
 * 2. Sécurité : Un utilisateur simple ne peut modifier que son propre compte.
 *    Les administrateurs peuvent modifier n'importe quel compte. Rejette 403 sinon.
 * 3. Recherche de l'utilisateur cible dans MongoDB.
 * 4. Changement de mot de passe :
 *    - Si l'utilisateur connecté n'est pas admin, il doit obligatoirement fournir son mot de passe
 *      actuel (`currentPassword`) pour des raisons évidentes de sécurité.
 *    - On compare `currentPassword` avec le hash de la BDD. En cas d'erreur -> 401 Unauthorized.
 * 5. Préparation des données de mise à jour (`updateData`) :
 *    - Seuls les administrateurs peuvent modifier le `role` (évite qu'un utilisateur ne s'auto-promuve commercial ou admin).
 *    - Les champs email (nouveau), nom et description sont optionnels.
 * 6. Hashage du mot de passe : Si un nouveau mot de passe (`newPassword`) est fourni,
 *    on génère un sel Bcrypt et on le hache.
 * 7. Enregistrement en base via `findOneAndUpdate` :
 *    - `new: true` retourne la version mise à jour du document.
 *    - `runValidators: true` force le respect des règles de schéma Mongoose.
 * 8. Sécurité de réponse : Supprime le mot de passe du document retourné avant l'envoi HTTP.
 * 
 * @async
 * @function updateUser
 * @param {Object} req - Requête Express
 * @param {Object} req.params - Paramètres de route de l'URL
 * @param {string} req.params.email - Email de l'utilisateur ciblé
 * @param {Object} req.body - Données de mise à jour reçues
 * @param {string} [req.body.currentPassword] - Mot de passe actuel (requis pour les non-admins)
 * @param {string} [req.body.newPassword] - Nouveau mot de passe à appliquer
 * @param {string} [req.body.role] - Nouveau rôle ('admin', 'commercial', 'user') - Admin uniquement
 * @param {string} [req.body.newEmail] - Nouvelle adresse e-mail
 * @param {string} [req.body.name] - Nouveau nom d'utilisateur
 * @param {string} [req.body.description] - Nouvelle description
 * @param {Object} req.user - Utilisateur connecté décodé du JWT
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>} - Renvoie l'utilisateur mis à jour sans son mot de passe
 */
const updateUser = async(req, res) => {
    try {
        const email = req.params.email;
        const {currentPassword, newPassword, role, newEmail, name, description} = req.body;
        const isAdmin = req.user.role === 'admin'; 
        
        // Sécurité : Un utilisateur non-admin ne peut modifier que son propre compte
        if (!isAdmin && req.user.email !== email) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Vérifier si l'utilisateur existe en BDD
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Si l'utilisateur n'est pas admin et qu'il veut changer le mot de passe, vérifier l'ancien
        if (newPassword && !isAdmin) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid current password' });
            }
        }

        // Préparer les données de mise à jour
        const targetEmail = newEmail || req.body.email;
        const updateData = {
            ...(isAdmin && role && { role }), // Seul l'admin a le droit de modifier le rôle
            ...(targetEmail && { email: targetEmail }),
            ...(name && { name }),
            ...(description && { description })
        };

        // Si aucun champ à mettre à jour et aucun changement de mot de passe demandé
        if (Object.keys(updateData).length === 0 && !newPassword) {
            return res.status(400).json({ message: 'No data provided for update' });
        }

        // Si un nouveau mot de passe est fourni, le hasher avec Bcrypt
        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        // Mettre à jour l'utilisateur en appliquant les validateurs de schéma
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            updateData,
            { new: true, runValidators: true }
        );

        // Sécurité : Ne pas renvoyer le mot de passe (même haché) dans la réponse JSON
        const userResponse = updatedUser.toObject();
        delete userResponse.password;
        
        res.status(200).json(userResponse);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Crée un nouvel utilisateur (Formulaire d'inscription)
 * 
 * Sécurité essentielle :
 * Bien que la route soit publique, on force systématiquement le champ `role` à 'user'.
 * Cela empêche qu'un attaquant n'envoie une requête HTTP contenant `"role": "admin"`
 * pour s'octroyer des privilèges d'administration lors de son inscription.
 * Le mot de passe sera automatiquement haché par le hook `pre('save')` du modèle User.
 * 
 * @async
 * @function createUser
 * @param {Object} req - Requête Express
 * @param {Object} req.body - Données d'inscription (name, email, password, etc.)
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>} - Renvoie l'utilisateur créé (sans mot de passe)
 * @throws {Error} - Erreur de validation ou e-mail doublon
 */
const createUser = async(req, res) => {    
    try {
        // On isole le rôle reçu pour l'ignorer et force le rôle à 'user'
        const { role, ...userData } = req.body
        const newUser = {
            ...userData,
            role: 'user' // Forçage de sécurité
        }
        
        const user = await User.create(newUser)
        
        // Sécurité : Masquage du mot de passe haché dans le retour
        const userResponse = user.toObject()
        delete userResponse.password
        return res.status(201).json(userResponse)
    } catch (error) {
        // Gestion propre de l'erreur d'unicité (défini dans le hook pré-sauvegarde)
        if (error.message === 'User already exists' || error.code === 11000) {
            return res.status(409).json({message: 'User already exists'})
        } else {
            console.log('Erreur lors de la création de l\'utilisateur:', error)
            return res.status(500).json({message: "Server error"})
        }
    } 
}

/**
 * Supprime un utilisateur et toutes ses données associées (Cascade complète)
 * 
 * Processus détaillé :
 * 1. Sécurité : Un utilisateur simple ne peut supprimer que son propre compte.
 *    Les administrateurs peuvent supprimer n'importe quel compte. Rejette 403 sinon.
 * 2. Recherche de l'utilisateur pour récupérer son `_id` MongoDB interne.
 * 3. Récupération de l'ensemble des factures liées à cet utilisateur (`Bill.find({user: user._id})`).
 * 4. Nettoyage cloud S3 : Supprime un par un tous les fichiers de pièces justificatives
 *    sur AWS S3 liés aux factures de cet utilisateur.
 * 5. Suppression BDD : Supprime toutes les factures de l'utilisateur de la base de données.
 * 6. Suppression finale : Supprime le compte utilisateur de MongoDB.
 * 
 * @async
 * @function deleteUser
 * @param {Object} req - Requête Express
 * @param {Object} req.params - Paramètres de route URL
 * @param {string} req.params.email - Email du compte à supprimer
 * @param {Object} req.user - Utilisateur connecté décodé du JWT
 * @param {Object} res - Réponse Express
 * @returns {Promise<void>} - Renvoie un message confirmant le nettoyage complet
 */
const deleteUser = async(req, res) => {
    try {
        const email = req.params.email;
        const isAdmin = req.user.role === 'admin';

        // Sécurité : Seul l'admin ou le propriétaire peut supprimer le compte
        if (!isAdmin && req.user.email !== email) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Recherche préalable
        const user = await User.findOne({email: email})
        if (!user) {
            return res.status(404).json({message: 'User not found'})
        }

        // Récupérer toutes les factures de l'utilisateur pour avoir les URLs des preuves S3
        const bills = await Bill.find({user: user._id})
        
        // Supprimer les fichiers dans AWS S3 en boucle
        for (const bill of bills) {
            if (bill.proof) {
                try {
                    await deleteFromS3(bill.proof)
                } catch (error) {
                    console.error(`Erreur lors de la suppression du fichier S3 pour la facture ${bill._id}:`, error)
                }
            }
        }

        // Supprimer toutes les factures associées à l'utilisateur de la base MongoDB
        await Bill.deleteMany({user: user._id})

        // Supprime enfin l'utilisateur de la base MongoDB
        await User.findOneAndDelete({email: email})
        
        res.status(200).json({
            message: 'User and associated bills deleted successfully',
            deletedBillsCount: bills.length
        })
    }
    catch (error) {
        console.error('Erreur lors de la suppression:', error)
        res.status(500).json({message: "Server error"})
    }
}

module.exports = {getUsers, getUsersByEmail, createUser, updateUser, deleteUser}