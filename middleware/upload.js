/**
 * @fileoverview Configuration du middleware Multer pour le téléchargement de fichiers
 * @module middleware/upload
 */

const multer = require('multer');

/**
 * Configuration du stockage en mémoire pour Multer
 * @constant {Object} storage
 */
const storage = multer.memoryStorage();

/**
 * Fonction de filtrage des fichiers
 * @function fileFilter
 * @param {Object} req - Objet de requête Express
 * @param {Object} file - Information sur le fichier téléchargé
 * @param {function} cb - Fonction de callback
 * @returns {void}
 */
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}

/**
 * Configuration de Multer avec les options définies
 * @constant {Object} upload
 * @property {Object} storage - Configuration du stockage
 * @property {function} fileFilter - Fonction de filtrage des fichiers
 * @property {Object} limits - Limites de taille de fichier (5 MB)
 */
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
}); 

module.exports = upload;