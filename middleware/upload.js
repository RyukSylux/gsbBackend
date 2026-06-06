/**
 * Ce fichier configure le middleware Multer qui intercepte les requêtes HTTP multipart/form-data
 * contenant des fichiers (comme les pièces justificatives des factures) avant d'exécuter la route finale.
 * 
 * @fileoverview Configuration du middleware Multer pour le téléchargement de fichiers
 * @module middleware/upload
 */

// Importation de Multer, bibliothèque de gestion d'upload de fichiers
const multer = require('multer');

/**
 * Configuration du stockage en mémoire pour Multer
 * 
 * Choix technique : memoryStorage()
 * Au lieu d'écrire le fichier sur le disque dur local du serveur (ce qui poserait problème
 * sur des architectures serverless ou distribuées), le fichier est chargé temporairement
 * en mémoire sous la forme d'un objet Buffer accessible via `req.file.buffer`.
 * Cela nous permet de le transférer directement vers AWS S3 ensuite sans laisser de trace locale.
 * 
 * @constant {Object} storage
 */
const storage = multer.memoryStorage();

/**
 * Fonction de filtrage des fichiers pour valider le type de fichier envoyé
 * 
 * Cette fonction sert de garde-fou de sécurité :
 * Elle vérifie que le type MIME du fichier commence bien par 'image/' (par exemple image/jpeg, image/png).
 * Si le fichier n'est pas une image, la requête est rejetée en passant une erreur au callback.
 * 
 * @function fileFilter
 * @param {Object} req - Objet de requête Express
 * @param {Object} file - Information sur le fichier téléchargé fourni par Multer
 * @param {string} file.mimetype - Type de fichier (ex: 'image/png')
 * @param {function} cb - Fonction de callback pour signaler l'acceptation ou le rejet
 * @returns {void}
 */
const fileFilter = (req, file, cb) => {
  // Accepter uniquement les fichiers dont le mimetype commence par image/
  if (!file.mimetype.startsWith('image/')) {
    // Rejeter le fichier avec une erreur explicite
    return cb(new Error('Only image files are allowed!'), false);
  }
  // Accepter le fichier en passant null pour l'erreur et true pour l'autorisation
  cb(null, true);
}

/**
 * Configuration finale de Multer avec les options définies
 * 
 * Définit :
 * - Le stockage mémoire.
 * - Le filtre d'images.
 * - Une limite de taille stricte de 5 Mo (5 * 1024 * 1024 octets) pour éviter de saturer
 *   la mémoire vive du serveur avec des fichiers trop lourds.
 * 
 * @constant {Object} upload
 * @property {Object} storage - Stockage configuré (mémoire)
 * @property {function} fileFilter - Filtre de type de fichier
 * @property {Object} limits - Contraintes système (ex: fileSize)
 */
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // Limite fixée à 5 Mo
  }
}); 

module.exports = upload;