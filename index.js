/**
 * Ce fichier configure le serveur HTTP Express, gère les connexions à la base de données MongoDB,
 * définit les règles de sécurité CORS et de cookies, et branche les différents routeurs de l'API.
 * 
 * @fileoverview Point d'entrée principal de l'application Express
 * @module index
 */

const express = require('express')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express()
const port = 3000

// Charge les variables d'environnement définies dans le fichier .env à la racine
require('dotenv').config()

/**
 * Configuration CORS (Cross-Origin Resource Sharing) spécifique
 * 
 * Cette configuration est cruciale pour permettre les appels depuis le frontend.
 * Les origines autorisées sont récupérées depuis la variable d'environnement FRONT_URL.
 * Si non définie, elle se rabat sur le port par défaut de Vite (5173) en local et 127.0.0.1.
 * 
 * Note très importante de sécurité : 
 * Lorsque credentials est à 'true' (nécessaire pour envoyer/recevoir des cookies HTTP-Only de session),
 * l'origine CORS ne peut pas être un joker '*'. Elle doit correspondre explicitement à l'origine de la requête.
 */
const allowedOrigins = process.env.FRONT_URL
  ? process.env.FRONT_URL.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: allowedOrigins,      // Origines autorisées à communiquer avec l'API
  credentials: true,           // Autorise l'envoi de cookies sécurisés dans les requêtes CORS
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Méthodes HTTP autorisées
  allowedHeaders: ['Content-Type', 'Authorization']     // En-têtes acceptés du client
}));

// Middleware pour parser/analyser les cookies envoyés par le client (notamment pour req.cookies.token)
app.use(cookieParser());

// Middleware pour parser les corps de requêtes au format JSON (req.body devient accessible pour le JSON)
app.use(express.json());

/**
 * Variables d'environnement pour la connexion MongoDB.
 * Récupère les identifiants et l'adresse de la base MongoDB Atlas ou locale.
 */
const MONGO_URI = process.env.MONGO_URI
const MONGO_USER = process.env.MONGO_USER
const MONGO_PASSWORD = process.env.MONGO_PASSWORD

/**
 * Configuration et connexion à la base de données MongoDB via la bibliothèque ODM Mongoose.
 * La chaîne de connexion assemble dynamiquement les informations d'authentification.
 */
const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://'+MONGO_USER+':'+MONGO_PASSWORD+'@'+MONGO_URI)
const db = mongoose.connection

// Enregistrement des écouteurs d'événements sur la connexion à la base de données
db.on('error', (err) => {
    // Déclenché en cas d'erreur de connexion ou de coupure de liaison avec MongoDB
    console.log('Error connecting to MongoDB', err)
})
db.on('open', () => {
    // Déclenché une fois que la connexion initiale est établie avec succès
    console.log('connected to MongoDB')
})

/**
 * Importation des routeurs de l'application
 * Chaque module contient les endpoints spécifiques à un domaine fonctionnel.
 */
const userRouter = require('./routes/user_route')
const billRouter = require('./routes/bill_route')
const authenticationRouter = require('./routes/authentication_route')

/**
 * Configuration des préfixes de routes pour l'API
 * Redirige les requêtes vers le routeur adéquat selon le chemin demandé.
 */
app.use('/api/users', userRouter)         // Gestion des utilisateurs (CRUD, mot de passe)
app.use('/api/bills', billRouter)         // Gestion des factures (CRUD, upload, stats)
app.use('/api/login', authenticationRouter) // Authentification (login, logout, session /me)

/**
 * Route racine de l'API permettant de vérifier rapidement si le serveur répond en production.
 * @name GET /
 * @function
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
app.get('/',(req,res) => {
    res.send('<h1>Bienvenue sur l\'API GSB</h1>')
})

/**
 * Démarrage de l'écoute du serveur HTTP Express sur le port configuré.
 */
app.listen(port, () =>{
    console.log(`Serveur démarré sur http://127.0.0.1:${port}`)
})