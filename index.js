/**
 * @fileoverview Point d'entrée principal de l'application Express
 * @module index
 */

const express = require('express')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express()
const port = 3000

require('dotenv').config()

/**
 * Configuration CORS spécifique pour autoriser les cookies (credentials)
 * Note : origin ne peut pas être '*' quand credentials est à true.
 */
app.use(cors({
  origin: process.env.FRONT_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());

/**
 * Variables d'environnement pour la connexion MongoDB
 */
const MONGO_URI = process.env.MONGO_URI
const MONGO_USER = process.env.MONGO_USER
const MONGO_PASSWORD = process.env.MONGO_PASSWORD

/**
 * Configuration et connexion à la base de données MongoDB
 */
const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://'+MONGO_USER+':'+MONGO_PASSWORD+'@'+MONGO_URI)
const db = mongoose.connection
db.on('error', (err) => {console.log('Error connecting to MongoDB', err)})
db.on('open', () => {console.log('connected to MongoDB')})



/**
 * Import des routes
 */
const userRouter = require('./routes/user_route')
const billRouter = require('./routes/bill_route')
const authenticationRouter = require('./routes/authentication_route')

/**
 * Configuration des routes de l'API
 */
app.use('/api/users', userRouter)
app.use('/api/bills', billRouter)
app.use('/api/login', authenticationRouter)

/**
 * Route racine
 * @name GET /
 * @function
 */
app.get('/',(req,res) => {
    res.send('<h1>Bienvenue sur l\'API GSB</h1>')
})

/**
 * Démarrage du serveur
 */
app.listen(port, () =>{
    console.log(`Serveur démarré sur http://127.0.0.1:${port}`)
})