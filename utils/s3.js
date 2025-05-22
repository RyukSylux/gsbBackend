/**
 * @fileoverview Utilitaires pour l'interaction avec Amazon S3
 * @module utils/s3
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

/**
 * Configuration AWS depuis les variables d'environnement
 */
AWS.config.update({
    region: 'eu-west-3',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

/**
 * @constant {string} BUCKET_NAME - Nom du bucket S3
 */
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

/**
 * Télécharge un fichier vers S3
 * @function uploadToS3
 * @async
 * @param {Object} file - Le fichier à télécharger
 * @param {string} file.originalname - Nom original du fichier
 * @param {Buffer} file.buffer - Contenu du fichier
 * @returns {Promise<string>} URL du fichier téléchargé
 * @throws {Error} Erreur lors du téléchargement
 */
const uploadToS3 = async (file) => {
    try{
        const fileExtension = file.originalname.split('.').pop();
        const key = `${uuidv4()}.${fileExtension}`;

        const params = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file.buffer
        };
       const uploadData = await s3.upload(params).promise();
       console.log("File uploaded successfully at", uploadData.Location);
       return uploadData.Location; // Return the URL of the uploaded file
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw new Error("Failed to upload file to S3");
    }
}

/**
 * Supprime un fichier de S3
 * @function deleteFromS3
 * @async
 * @param {string} fileUrl - URL du fichier à supprimer
 * @returns {Promise<boolean>} true si la suppression a réussi
 * @throws {Error} Erreur lors de la suppression
 */
const deleteFromS3 = async (fileUrl) => {
    try {
        // Extraire le nom du fichier de l'URL
        const key = fileUrl.split('/').pop();
        
        const params = {
            Bucket: BUCKET_NAME,
            Key: key
        };

        await s3.deleteObject(params).promise();
        console.log("File deleted successfully from S3:", key);
        return true;
    } catch (error) {
        console.error("Error deleting file from S3:", error);
        throw new Error("Failed to delete file from S3");
    }
}

module.exports = { uploadToS3, deleteFromS3 }