/**
 * Ce fichier gère le stockage cloud des pièces justificatives de factures
 * en s'interfaçant avec le service Amazon Web Services (AWS) S3.
 * 
 * @fileoverview Utilitaires pour l'interaction avec Amazon S3 (AWS SDK v3)
 * @module utils/s3
 */

// Importation des classes nécessaires du SDK AWS v3 pour S3
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// L'utilitaire @aws-sdk/lib-storage gère les uploads complexes de manière optimale (par blocs / streams)
const { Upload } = require('@aws-sdk/lib-storage');
// Utilisé pour générer des identifiants uniques universels pour les clés des fichiers
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

/**
 * Configuration et instanciation du client S3 v3
 * Utilise les variables d'environnement pour s'authentifier de manière sécurisée.
 */
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-north-1', // Région AWS par défaut
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,     // Clé d'accès publique AWS
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // Clé secrète privée AWS
    }
});

/**
 * @constant {string} BUCKET_NAME - Nom du bucket S3 cible configuré dans le fichier .env
 */
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

/**
 * Télécharge un fichier vers S3 de façon asynchrone
 * 
 * Processus détaillé :
 * 1. Extraction de l'extension du fichier d'origine.
 * 2. Génération d'une clé (nom de fichier) unique via un UUIDv4 pour éviter toute collision dans le bucket.
 * 3. Utilisation de l'outil intelligent `Upload` du SDK AWS v3 qui gère automatiquement
 *    le fractionnement du fichier s'il est volumineux (Multipart Upload).
 * 4. Retourne l'adresse URL absolue publique du fichier stocké après confirmation de réussite.
 * 
 * @function uploadToS3
 * @async
 * @param {Object} file - Le fichier envoyé via Multer
 * @param {string} file.originalname - Nom original du fichier (ex: 'recu.jpg')
 * @param {Buffer} file.buffer - Tampon contenant les données binaires du fichier en mémoire
 * @param {string} file.mimetype - Type MIME du fichier (ex: 'image/jpeg')
 * @returns {Promise<string>} URL du fichier téléchargé dans le cloud S3
 * @throws {Error} Erreur si la communication avec AWS S3 échoue
 */
const uploadToS3 = async (file) => {
    try {
        // Extrait l'extension après le dernier point (ex: 'png')
        const fileExtension = file.originalname.split('.').pop();
        // Construit le nom unique finale dans S3 (ex: '123e4567-e89b-12d3-a456-426614174000.png')
        const key = `${uuidv4()}.${fileExtension}`;

        // Initialisation de la tâche d'upload
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: key,
                Body: file.buffer,          // Le buffer binaire stocké par Multer en mémoire vive
                ContentType: file.mimetype  // Important : permet au navigateur d'afficher l'image directement plutôt que de la télécharger
            }
        });

        // Exécution de l'upload et attente de la réponse d'AWS
        const result = await upload.done();
        console.log("File uploaded successfully at", result.Location);
        return result.Location; // Renvoie l'URL absolue du fichier (ex: https://bucket.s3.region.amazonaws.com/uuid.png)
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw new Error("Failed to upload file to S3");
    }
}

/**
 * Supprime un fichier stocké sur AWS S3
 * 
 * Processus détaillé :
 * 1. Extraction du nom de fichier unique (la clé S3) de l'URL absolue stockée en base de données.
 * 2. Création de la commande de suppression DeleteObjectCommand en désignant le Bucket et la Clé.
 * 3. Envoi de la commande de suppression au client S3.
 * 
 * @function deleteFromS3
 * @async
 * @param {string} fileUrl - URL absolue du fichier à supprimer
 * @returns {Promise<boolean>} true si la suppression s'est bien déroulée
 * @throws {Error} Erreur si la suppression échoue
 */
const deleteFromS3 = async (fileUrl) => {
    try {
        // L'URL est de type : https://bucket.s3.region.amazonaws.com/nom-du-fichier.ext
        // On récupère uniquement le dernier segment (nom-du-fichier.ext) qui constitue la clé (Key) de l'objet dans S3.
        const key = fileUrl.split('/').pop();
        
        // Instanciation de la commande de suppression du SDK v3
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        // Envoi effectif de la commande à l'API AWS
        await s3Client.send(command);
        console.log("File deleted successfully from S3:", key);
        return true;
    } catch (error) {
        console.error("Error deleting file from S3:", error);
        throw new Error("Failed to delete file from S3");
    }
}

module.exports = { uploadToS3, deleteFromS3 }