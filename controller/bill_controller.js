/**
 * Ce contrôleur gère la création des factures (avec téléversement vers AWS S3),
 * leur lecture (avec filtrage par rôle), leur mise à jour, leur suppression
 * (individuelle et multiple, avec nettoyage de S3), ainsi que la génération de statistiques via l'agrégation.
 * 
 * @fileoverview Contrôleur gérant les opérations CRUD sur les factures (notes de frais)
 * @module controllers/bill
 */

const Bill = require('../models/bill_model')
const User = require('../models/user_model')
const { uploadToS3, deleteFromS3 } = require('../utils/s3')

/**
 * Récupère les factures de la base de données
 * 
 * Logique de sécurité et filtrage :
 * - Si le rôle de l'utilisateur connecté est 'admin' :
 *   1. Récupère TOUTES les factures enregistrées en BDD.
 *   2. Pour chaque facture, recherche asynchronement les détails de son propriétaire (email, name)
 *      dans la collection User pour simplifier l'affichage côté Front.
 *      On utilise `Promise.all` pour exécuter ces requêtes parallèlement et optimiser les temps de réponse.
 * - Si l'utilisateur est un utilisateur classique/commercial :
 *   1. Filtre et récupère uniquement les factures dont le champ `user` correspond à son ID JWT.
 * 
 * @function getBills
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.user - Informations de l'utilisateur authentifié (injecté par le middleware)
 * @param {string} req.user.id - L'ID de l'utilisateur
 * @param {string} req.user.role - Le rôle de l'utilisateur ('admin' ou autre)
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object[]>} Liste des factures sérialisées
 * @throws {Error} Code statut 500 en cas d'erreur avec la base de données
 */
const getBills = async (req, res) => {
    try {
        const { id, role } = req.user
        let bills

        // 1. Logique réservée aux Administrateurs
        if (role === 'admin') {
            // Récupère toutes les factures sans exception
            bills = await Bill.find({})

            // Enrichissement asynchrone des factures avec l'e-mail et le nom de l'utilisateur
            const billsWithEmail = await Promise.all(bills.map(async (bill) => {
                // Recherche uniquement les champs nécessaires de l'utilisateur
                const user = await User.findOne({ _id: bill.user }, { _id: 0, email: 1, name: 1 })
                return {
                    ...bill.toObject(), // Convertit le document Mongoose en objet JS classique
                    email: user ? user.email : null,
                    name: user ? user.name : null
                }
            }))
            return res.json(billsWithEmail)
        }
        // 2. Logique pour les Commerciaux / Utilisateurs simples
        else {
            // Récupère uniquement les factures de l'utilisateur connecté
            bills = await Bill.find({ user: id })
            return res.json(bills)
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

/**
 * Récupère les détails d'une facture spécifique à partir de son ID
 * 
 * Logique de sécurité :
 * 1. Recherche la facture en base. Si elle n'existe pas, renvoie 404.
 * 2. Vérifie les habilitations : un utilisateur normal ne peut pas consulter
 *    les factures d'un tiers. S'il n'est pas admin ET que le propriétaire de la facture
 *    ne correspond pas à son ID, l'accès est bloqué (403 Forbidden).
 * 
 * @function getBillsById
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.params - Paramètres de l'URL
 * @param {string} req.params._id - L'ID unique Mongoose de la facture
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} La facture trouvée
 * @throws {Error} Code statut 500 en cas de bug de BDD
 */
const getBillsById = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params._id)
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' })
        }

        // Sécurité : Seul le propriétaire ou un administrateur peut voir les détails
        if (req.user.role !== 'admin' && bill.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        res.json(bill)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

/**
 * @typedef {Object} BillMetadata
 * @property {string} date - La date de la facture
 * @property {number} amount - Le montant de la facture
 * @property {string} description - La description de la facture
 * @property {string} status - Le statut de la facture ('pending', 'not-paid', 'paid', 'refunded')
 * @property {string} type - Le type de la facture
 * @property {string} category - La catégorie de la facture
 */

/**
 * Crée une nouvelle facture (Création de note de frais + Upload justificatif)
 * 
 * Processus détaillé :
 * 1. Extraction et parsing du champ textuel `metadata` envoyé en JSON String
 *    (nécessaire car la requête est au format multipart/form-data pour l'upload).
 * 2. Récupération de l'ID utilisateur connecté depuis le jeton décodé.
 * 3. Validation de la présence du justificatif binaire (req.file). Si absent, lève une erreur.
 * 4. Transfert asynchrone du justificatif vers le cloud AWS S3 via l'utilitaire `uploadToS3`.
 * 5. Instanciation du modèle Mongoose avec les métadonnées et l'URL S3 reçue.
 * 6. Sauvegarde en BDD et retour de l'objet créé avec le statut 201 (Created).
 * 
 * @function createBill
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {BillMetadata} req.body.metadata - Les métadonnées (Format JSON String stringifié)
 * @param {Object} req.file - Le fichier image justificatif injecté par Multer (champ 'proof')
 * @param {Object} req.user - L'utilisateur authentifié décodé
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} La facture créée avec son URL de preuve
 * @throws {Error} Erreur lors de l'upload S3 ou validation
 */
const createBill = async (req, res) => {
    try {
        // Le frontend envoie les métadonnées sérialisées sous forme de chaîne JSON
        const { date, amount, description, status, type, category } = JSON.parse(req.body.metadata)
        const { id } = req.user

        let proofUrl = null
        // Vérifie si Multer a bien intercepté le fichier justificatif
        if (req.file) {
            // Upload du fichier en mémoire directement vers le bucket S3
            proofUrl = await uploadToS3(req.file)
        } else {
            // Le justificatif est une obligation légale pour le remboursement des frais
            throw new Error('Proof file is required', { cause: 400 });
        }

        // Création du document avec l'URL du document sur S3
        const bill = new Bill({
            date,
            amount,
            description,
            proof: proofUrl, // Lien absolu AWS S3
            status,
            category: category || 'Autre',
            type,
            user: id // Liaison avec l'utilisateur créateur
        })

        await bill.save()
        res.status(201).json(bill)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

/**
 * Supprime une facture individuelle (Base de données et fichier S3)
 * 
 * Processus détaillé :
 * 1. Validation syntaxique de l'ID via Regex pour vérifier que c'est un ObjectId MongoDB valide (24 caractères hexadécimaux).
 * 2. Recherche de la facture. Si inexistante -> 404.
 * 3. Sécurité : Un utilisateur simple ne peut supprimer que sa propre facture.
 *    Les administrateurs peuvent supprimer n'importe laquelle. En cas de non-respect -> 403 Forbidden.
 * 4. Suppression du document de la base MongoDB.
 * 5. Nettoyage de l'espace de stockage cloud : Si une URL de preuve est présente,
 *    déclenche la suppression asynchrone du fichier associé dans AWS S3.
 *    Note : Les erreurs d'effacement S3 ne bloquent pas le flux principal mais sont loggées pour la maintenance.
 * 
 * @function deleteBill
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.params - Paramètres URL
 * @param {string} req.params._bill - L'ID de la facture à effacer
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} Message de confirmation de suppression
 * @throws {Error} Code statut 500 si crash système
 */
const deleteBill = async (req, res) => {
    try {
        // Vérifie la validité du format de l'identifiant pour éviter des erreurs internes de Mongoose
        if (!req.params._bill || !req.params._bill.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid bill ID' });
        }

        const bill = await Bill.findById(req.params._bill);

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Sécurité : Seul le propriétaire ou un administrateur peut supprimer
        if (req.user.role !== 'admin' && bill.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Suppression de la BDD MongoDB
        await bill.deleteOne();

        // Suppression en cascade du justificatif physique hébergé sur AWS S3
        if (bill.proof) {
            try {
                await deleteFromS3(bill.proof);
            } catch (error) {
                // Log l'erreur sans bloquer la réponse car le document BDD est déjà supprimé
                console.error(`Erreur lors de la suppression du fichier S3 pour la facture ${bill._id}:`, error);
            }
        }

        res.status(200).json({
            message: 'Bill deleted',
            deletedBill: bill._id
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Met à jour une facture existante (Réservé aux Administrateurs pour approbation/remboursement)
 * 
 * Processus détaillé :
 * 1. Recherche de la facture. Si non trouvée -> 404.
 * 2. Sécurité : Restriction stricte aux utilisateurs ayant le rôle 'admin'.
 * 3. Parsing des nouvelles métadonnées envoyées en multipart/form-data.
 * 4. Si un nouveau fichier justificatif est fourni (req.file), il est téléversé sur S3 et remplace
 *    l'ancienne URL.
 * 5. Applique les modifications en base via `findByIdAndUpdate` avec l'opérateur `$set`.
 * 
 * @function updateBill
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.params - Paramètres URL
 * @param {string} req.params._id - L'ID de la facture à modifier
 * @param {BillMetadata} req.body.metadata - Les données de mise à jour (JSON String)
 * @param {Object} [req.file] - Le nouveau fichier justificatif de remplacement (Optionnel)
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} La facture mise à jour
 * @throws {Error} Erreur de parsing ou d'accès BDD
 */
const updateBill = async (req, res) => {
    try {
        const existingBill = await Bill.findById(req.params._id);
        if (!existingBill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Sécurité : Seul un administrateur est habilité à modifier une facture (ex: validation de frais)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Désérialisation des métadonnées
        const { date, amount, description, status, type, category } = JSON.parse(req.body.metadata);

        // Construction de l'objet de modification
        const updateFields = {
            date,
            amount,
            description,
            status,
            category,
            type
        };

        // Si le justificatif a été changé par l'administrateur, on télécharge la nouvelle version
        if (req.file) {
            const proofUrl = await uploadToS3(req.file);
            updateFields.proof = proofUrl;
        }

        // Mise à jour de la facture en retournant la nouvelle version modifiée (new: true)
        const updatedBill = await Bill.findByIdAndUpdate(
            req.params._id,
            { $set: updateFields },
            { new: true }
        );

        res.status(200).json(updatedBill);
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({ message: error.message });
    }
}

/**
 * Supprime plusieurs factures en bloc (sécurisé)
 * 
 * Processus détaillé et sécurité :
 * 1. Validation que le corps de requête fournit bien un tableau d'identifiants.
 * 2. Construction de la requête de sélection :
 *    - Si l'utilisateur connecté est administrateur, il peut supprimer tous les IDs demandés.
 *    - S'il s'agit d'un utilisateur standard, on restreint la requête en ajoutant la contrainte `user: req.user.id`.
 *      Cela garantit qu'il ne pourra jamais supprimer des factures appartenant à d'autres utilisateurs,
 *      même s'il en injecte les IDs de manière frauduleuse.
 * 3. Récupération des documents cibles pour collecter les URLs des fichiers sur S3.
 * 4. Suppression en boucle de tous les fichiers physiques associés sur AWS S3.
 * 5. Lancement de la requête `deleteMany` pour effacer les factures de MongoDB en une seule opération.
 * 
 * @function deleteManyBills
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} req.body - Corps de la requête
 * @param {string[]} req.body.ids - Liste des IDs de factures à supprimer
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object>} Bilan de l'opération (nombre d'éléments supprimés)
 * @throws {Error} Erreur lors du nettoyage S3 ou BDD
 */
const deleteManyBills = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids)) {
            return res.status(400).json({ message: 'IDs must be provided as an array' });
        }

        // Filtre de sécurité : Si l'utilisateur n'est pas admin, on limite la suppression à ses propres factures
        const query = { _id: { $in: ids } };
        if (req.user.role !== 'admin') {
            query.user = req.user.id;
        }

        // Récupère d'abord toutes les factures autorisées pour extraire les URLs de justificatifs
        const bills = await Bill.find(query);

        // Boucle pour supprimer les fichiers stockés sur S3
        for (const bill of bills) {
            if (bill.proof) {
                try {
                    await deleteFromS3(bill.proof);
                } catch (error) {
                    console.error(`Erreur lors de la suppression du fichier S3 pour la facture ${bill._id}:`, error);
                }
            }
        }

        // Suppression des documents de la base de données MongoDB
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
 * Récupère les statistiques de factures agrégées (Réservé aux Administrateurs)
 * 
 * Explication détaillée du framework d'agrégation MongoDB utilisé :
 * 
 * L'agrégation s'effectue via un pipeline (tableau d'étapes ordonnées) transmis à la base de données :
 * 
 * Étape 1 : Le stage `$group` (Regroupement)
 * ----------------------------------------
 * - `_id` : C'est la clé de regroupement. Ici, on crée un identifiant composé (un objet) avec :
 *     * `status: "$status"` : Regroupe les documents ayant le même statut (ex: 'pending', 'paid').
 *     * `category: "$category"` : Sous-regroupe au sein de chaque statut par catégorie (ex: 'Transport', 'Repas').
 * - `totalAmount: { $sum: "$amount" }` : Pour chaque groupe formé, MongoDB parcourt les documents
 *   et additionne la valeur numérique du champ `amount`. C'est un équivalent du `SUM(amount)` en SQL.
 * - `count: { $sum: 1 }` : Pour chaque document entrant dans le groupe, on ajoute +1 au compteur.
 *   C'est l'équivalent du `COUNT(*)` en SQL.
 * 
 * Étape 2 : Le stage `$sort` (Tri des résultats)
 * ----------------------------------------------
 * Une fois les groupes formés et calculés, le tableau de résultats est trié :
 * - `"_id.status": 1` : Tri par ordre alphabétique croissant sur le statut (1 = croissant, A-Z).
 * - `totalAmount: -1` : Au sein d'un même statut, trie par montant total décroissant (-1 = décroissant, du plus cher au moins cher).
 * 
 * @function getStats
 * @async
 * @param {Object} req - L'objet requête Express
 * @param {Object} res - L'objet réponse Express
 * @returns {Promise<Object[]>} Données statistiques agrégées (ex: [{ _id: { status: 'pending', category: 'Repas' }, totalAmount: 150, count: 3 }])
 * @throws {Error} Code statut 500 en cas de problème lors de l'exécution de la requête MongoDB
 */
const getStats = async (req, res) => {
    try {
        // Exécution du pipeline d'agrégation MongoDB sur la collection Bill
        const stats = await Bill.aggregate([
            {
                // ÉTAPE 1 : Regrouper les factures par couple unique (Statut + Catégorie)
                $group: {
                    // Clé d'agrégation
                    _id: {
                        status: "$status",     // Regroupement par statut
                        category: "$category"  // Regroupement par catégorie
                    },
                    // Opérateurs d'accumulateur
                    totalAmount: { $sum: "$amount" }, // Calcule la somme cumulée des montants de ce groupe
                    count: { $sum: 1 }                 // Compte le nombre de factures dans ce groupe
                }
            },
            {
                // ÉTAPE 2 : Trier les résultats obtenus
                $sort: {
                    "_id.status": 1,   // Tri ascendant par statut (ex: 'not-paid' avant 'paid')
                    totalAmount: -1    // Tri descendant par montant total (les plus grosses dépenses en premier)
                }
            }
        ]);

        // Retourne le tableau des résultats d'agrégation au format JSON
        res.json(stats);
    } catch (error) {
        // En cas d'erreur de connexion ou de syntaxe MongoDB, renvoie un code 500
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getBills, createBill, deleteBill, updateBill, getBillsById, deleteManyBills, getStats }