const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const sha256 = require('js-sha256');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const JWT_SALT = process.env.JWT_SALT || 'salt';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

const authenticateUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.password !== sha256(password + JWT_SALT)) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
}

const veryfyToken = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1]; // Assuming the token is sent in the Authorization header as

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.userId = decoded;
        next();
    });
}

const isAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne(email); // Recherche par email
        if (user && user.role === 'admin') {
            return true; // L'utilisateur est admin
        }
        return false; // L'utilisateur n'est pas admin
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false; // En cas d'erreur, on considère que l'utilisateur n'est pas admin
    }
};

module.exports = { authenticateUser, veryfyToken, isAdmin};