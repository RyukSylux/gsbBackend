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
        const bill = await Bill.findOne({_id : req.params._id})
        if(!bill){
         res.status(404).json({message: 'Bill not found'})
        }else{
        res.json(bill)}}
        catch (error) {
             res.status(500).json({message: error.message})
         }
}

/**
 * Crée une nouvelle facture
 * @function createBill
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.body - Le corps de la requête
 * @param {Object} req.body.metadata - Les métadonnées de la facture
 * @param {string} req.body.metadata.date - La date de la facture
 * @param {number} req.body.metadata.amount - Le montant de la facture
 * @param {string} req.body.metadata.description - La description de la facture
 * @param {string} req.body.metadata.status - Le statut de la facture
 * @param {string} req.body.metadata.type - Le type de la facture
 * @param {Object} req.file - Le fichier justificatif
 * @param {Object} req.user - L'utilisateur authentifié
 * @param {string} req.user.id - L'ID de l'utilisateur
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} La facture créée
 * @throws {Error} Erreur lors de la création de la facture
 */
const createBill = async(req, res) => {
    try {
        const {date, amount, description, status, type} = JSON.parse(req.body.metadata)
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
            return res.status(400).json({message: 'ID de facture invalide'});
        }

        const bill = await Bill.findByIdAndDelete(req.params._bill);  // On utilise _bill
        
        if(!bill) {
            return res.status(404).json({message: 'Bill not found'});
        }

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
 * Met à jour une facture
 * @function updateBill
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.params - Les paramètres de la requête
 * @param {string} req.params._id - L'ID de la facture à mettre à jour
 * @param {Object} req.body - Le corps de la requête
 * @param {Object} req.body.metadata - Les métadonnées de la facture
 * @param {Object} req.file - Le nouveau fichier justificatif (optionnel)
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} La facture mise à jour
 * @throws {Error} Erreur lors de la mise à jour
 */
const updateBill = async(req, res) => {
    try {

        const existingBill = await Bill.findById(req.params._id);
        if (!existingBill) {
            return res.status(404).json({message: 'Facture non trouvée'});
        }

        // On parse les metadata comme dans createBill
        const {date, amount, description, status, type} = JSON.parse(req.body.metadata);
        
        // On prépare l'objet de mise à jour
        const updateFields = {
            date,
            amount,
            description,
            status,
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
            return res.status(400).json({ message: 'Les IDs doivent être fournis dans un tableau' });
        }

        // Récupérer d'abord toutes les factures pour avoir les URLs des preuves
        const bills = await Bill.find({ _id: { $in: ids } });
        
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
        const result = await Bill.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Aucune facture trouvée' });
        }

        res.status(200).json({
            message: `${result.deletedCount} factures ont été supprimées avec succès`,
            deletedCount: result.deletedCount
        });
    }
    catch (error) {
        console.error('Erreur lors de la suppression multiple:', error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {getBills, createBill, deleteBill, updateBill, getBillsById, deleteManyBills}