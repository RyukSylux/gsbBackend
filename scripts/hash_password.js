/**
 * @fileoverview Script utilitaire pour générer un hash Bcrypt à partir d'un mot de passe en clair.
 * Usage: node scripts/hash_password.js "votre_mot_de_passe"
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.error('Erreur : Veuillez fournir un mot de passe en argument.');
    console.log('Usage : node scripts/hash_password.js "votre_mot_de_passe"');
    process.exit(1);
}

const hashPassword = async (plainText) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(plainText, salt);
        console.log('\n--- Générateur de Hash Bcrypt ---');
        console.log('Mot de passe en clair :', plainText);
        console.log('Hash (à copier dans MongoDB) :', hash);
        console.log('--------------------------------\n');
    } catch (error) {
        console.error('Erreur lors du hachage :', error);
    }
};

hashPassword(password);
