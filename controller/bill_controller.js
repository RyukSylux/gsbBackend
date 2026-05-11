/**
 * @fileoverview Contrôleur gérant les opérations CRUD sur les factures
 * @module controllers/bill
 */

const Bill = require('../models/bill_model')
const User = require('../models/user_model')
const { uploadToS3, deleteFromS3 } = require('../utils/s3')

/**
 * Récupère toutes les factures
 * @function getBills
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.user - L'utilisateur authentifié
 * @param {string} req.user.id - L'ID de l'utilisateur
 * @param {string} req.user.role - Le rôle de l'utilisateur
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object[]>} Liste des factures
 * @throws {Error} Erreur lors de la récupération des factures
 */
const getBills = async(req,res) => {
    try {
        const {id, role} = req.user
        let bills
        if(role === 'admin'){
            bills = await Bill.find({})
            const billsWithEmail = await Promise.all(bills.map(async (bill) => {
                const user = await User.findOne({_id: bill.user}, {_id: 0, email: 1, name: 1})
                return {
                    ...bill.toObject(),
                    email: user ? user.email : null,
                    name: user ? user.name : null
                }
            }))
            return res.json(billsWithEmail)
        } else {
            bills = await Bill.find({user: id})
            return res.json(bills)
        }
    }
    catch (error) {
        res.status(500).json({message: error.message})
    }
}

/**
 * Récupère une facture par son ID
 * @function getBillsById
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.params - Les paramètres de la requête
 * @param {string} req.params._id - L'ID de la facture
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} La facture trouvée
 * @throws {Error} Erreur si la facture n'est pas trouvée
 */
const getBillsById = async(req,res) => {
    try{
        const bill = await Bill.findById(req.params._id)
        if(!bill){
            return res.status(404).json({message: 'Bill not found'})
        }

        // Sécurité : Seul le propriétaire ou un admin peut voir les détails
        if (req.user.role !== 'admin' && bill.user.toString() !== req.user.id) {
            return res.status(403).json({message: 'Forbidden'});
        }

        res.json(bill)
    }
        catch (error) {
             res.status(500).json({message: error.message})
         }
}

/**
 * @typedef {Object} BillMetadata
 * @property {string} date - La date de la facture
 * @property {number} amount - Le montant de la facture
 * @property {string} description - La description de la facture
 * @property {string} status - Le statut de la facture ('pending', 'not-paid', 'paid', 'refunded')
 * @property {string} type - Le type de la facture (ex: 'Frais de déplacement', 'Repas', etc.)
 * @property {string} category - La catégorie de la facture ('Transport', 'Hébergement', 'Repas', 'Autre')
 */

/**
 * Crée une nouvelle facture
 * @function createBill
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {BillMetadata} req.body.metadata - Les métadonnées (Format JSON String)
 * @param {Object} req.file - Le fichier justificatif (Champ 'proof')
 * @param {string} req.user.id - L'ID de l'utilisateur authentifié
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} La facture créée
 * @throws {Error} Erreur lors de la création de la facture
 */
const createBill = async(req, res) => {
    try {
        const {date, amount, description, status, type, category} = JSON.parse(req.body.metadata)
        const {id} = req.user

        let proofUrl = null
        if (req.file)
        {
            proofUrl = await uploadToS3(req.file)
        } else {
            throw new Error('Proof file is required', {cause: 400});
        }
        
        const bill = new Bill({
            date,
            amount,
            description,
            proof : proofUrl,
            status,
            category: category || 'Autre',
            type,
            user: id
        })

        await bill.save()
        res.status(201).json(bill)
    } catch (error) {
        res.status(500).json({message: error.message})
    } 
}

/**
 * Supprime une facture
 * @function deleteBill
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.params - Les paramètres de la requête
 * @param {string} req.params._id - L'ID de la facture à supprimer
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} Message de confirmation
 * @throws {Error} Erreur lors de la suppression
 */
const deleteBill = async(req, res) => {
    try {
        if (!req.params._bill || !req.params._bill.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({message: 'Invalid bill ID'});
        }

        const bill = await Bill.findById(req.params._bill);
        
        if(!bill) {
            return res.status(404).json({message: 'Bill not found'});
        }

        // Sécurité : Seul le propriétaire ou un admin peut supprimer
        if (req.user.role !== 'admin' && bill.user.toString() !== req.user.id) {
            return res.status(403).json({message: 'Forbidden'});
        }

        await bill.deleteOne();

        // On supprime le fichier de preuve de S3
        if (bill.proof) {
            try {
                await deleteFromS3(bill.proof);
            } catch (error) {
                console.error(`Erreur lors de la suppression du fichier S3 pour la facture ${bill._id}:`, error);
            }
        }

        res.status(200).json({
            message: 'Bill deleted',
            deletedBill: bill._id
        });
    }
    catch (error) {
        res.status(500).json({message: error.message});
    }
}

/**
 * Met à jour une facture existante
 * @function updateBill
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {string} req.params._id - L'ID de la facture à modifier
 * @param {BillMetadata} req.body.metadata - Les métadonnées (Format JSON String)
 * @param {Object} req.file - Le nouveau fichier justificatif (Optionnel)
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} La facture mise à jour
 * @throws {Error} Erreur lors de la mise à jour
 */
const updateBill = async(req, res) => {
    try {

        const existingBill = await Bill.findById(req.params._id);
        if (!existingBill) {
            return res.status(404).json({message: 'Bill not found'});
        }

        // Sécurité : Seul le propriétaire ou un admin peut modifier
        if (req.user.role !== 'admin' && existingBill.user.toString() !== req.user.id) {
            return res.status(403).json({message: 'Forbidden'});
        }

        // On parse les metadata comme dans createBill
        const {date, amount, description, status, type, category} = JSON.parse(req.body.metadata);
        
        // On prépare l'objet de mise à jour
        const updateFields = {
            date,
            amount,
            description,
            status,
            category,
            type
        };

        // Si on a un nouveau fichier, on l'upload sur S3
        if (req.file) {
            const proofUrl = await uploadToS3(req.file);
            updateFields.proof = proofUrl;
        }

        const updatedBill = await Bill.findByIdAndUpdate(
            req.params._id,
            { $set: updateFields },
            { new: true }
        );

        res.status(200).json(updatedBill);
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({message: error.message});
    }
}

/**
 * Supprime plusieurs factures
 * @function deleteManyBills
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.body - Le corps de la requête
 * @param {string[]} req.body.ids - Liste des IDs des factures à supprimer
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} Résultat de la suppression
 * @throws {Error} Erreur lors de la suppression multiple
 */
const deleteManyBills = async(req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids)) {
            return res.status(400).json({ message: 'IDs must be provided as an array' });
        }

        // Filtre de sécurité : Si pas admin, on ne peut supprimer que ses propres factures
        const query = { _id: { $in: ids } };
        if (req.user.role !== 'admin') {
            query.user = req.user.id;
        }

        // Récupérer d'abord toutes les factures autorisées pour avoir les URLs des preuves
        const bills = await Bill.find(query);
        
        // Supprimer les fichiers dans S3
        for (const bill of bills) {
            if (bill.proof) {
                try {
                    await deleteFromS3(bill.proof);
                } catch (error) {
                    console.error(`Erreur lors de la suppression du fichier S3 pour la facture ${bill._id}:`, error);
                }
            }
        }

        // Supprimer les factures de la base de données
        const result = await Bill.deleteMany(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No bills found' });
        }

        res.status(200).json({
            message: `${result.deletedCount} bills deleted successfully`,
            deletedCount: result.deletedCount
        });
    }
    catch (error) {
        console.error('Erreur lors de la suppression multiple:', error);
        res.status(500).json({ message: error.message });
    }
}

/**
 * Récupère les statistiques des factures par statut
 * @function getStats
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object[]>} Statistiques par statut
 */
const getStats = async (req, res) => {
    try {
        const stats = await Bill.aggregate([
            {
                $group: {
                    _id: {
                        status: "$status",
                        category: "$category"
                    },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.status": 1, totalAmount: -1 } }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {getBills, createBill, deleteBill, updateBill, getBillsById, deleteManyBills, getStats}