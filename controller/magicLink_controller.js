const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const MagicLink = require('../models/magicLinkToken_model');
const User = require('../models/user_model')
require('dotenv').config();

const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const createMagicLink = async(req, res) => {
    try {
        const user = await User.findOne({email: req.params.email})
            if (!user) {
                return res.status(404).json({message: 'Utilisateur non trouvé'})
            }

        const token = new MagicLink({
            userID: user._id,
            token: uuidv4(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        await token.save();
        const magicLinkUrl = `${process.env.FRONT_URL}${token.token}`;
        return res.status(201).json({
            message: 'Magic link created successfully',
            magicLink: magicLinkUrl,
            token: token.token
        });
    }
    catch (error) {
        console.error('Erreur lors de la création du magic link:', error);
        res.status(500).json({message: error.message});
    }
}

const verifyMagicLink = async(req, res) => {
    try {
        const { token } = req.body;

        const magicLink = await MagicLink.findOne({ token });

        if (!magicLink) {
            return res.status(404).json({ message: 'Magic link not found' });
        }
        if (magicLink.used) {
            return res.status(400).json({ message: 'Magic link has already been used' });
        }
        if (magicLink.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Magic link has expired' });
        }
        else
        {
            magicLink.used = true;
            magicLink.usedAt = new Date();
            await magicLink.save();
            const user = await User.findOne({_id: magicLink.userID})
            const expiresIn = JWT_EXPIRATION;
                
            const tokenJwt = jwt.sign({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                description: user.description
            }, JWT_SECRET, { expiresIn });
            
            res.status(200).json({
            message: 'Magic link verified successfully',
            userID: magicLink.userID,
            token: tokenJwt,
            expiresIn,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                description: user.description
            }
        })
     } 
    }
    catch (error) {
        console.error('Erreur lors de la vérification du magic link:', error);
        res.status(500).json({ message: error.message });
    }
}


module.exports = {createMagicLink, verifyMagicLink}
