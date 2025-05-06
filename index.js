const express = require('express')
const app = express()
const port = 3000
require('dotenv').config()

const MONGO_URI = process.env.MONGO_URI
const MONGO_USER = process.env.MONGO_USER
const MONGO_PASSWORD = process.env.MONGO_PASSWORD

const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://'+MONGO_USER+':'+MONGO_PASSWORD+'@'+MONGO_URI)
const db = mongoose.connection
db.on('error', (err) => {console.log('Error connecting to MongoDB', err)})
db.on('open', () => {console.log('connected to MongoDB')})

app.use(express.json())
const userRouter = require('./routes/user_route')
const billRouter = require('./routes/bill_route')
const authenticationRouter = require('./routes/authentication_route')

app.use('/api/users', userRouter)
app.use('/api/bills', billRouter)
app.use('/api/login', authenticationRouter)

app.get('/',(req,res) => {
    res.send('<h1>ESPèCE DE PD</h1>')
})

app.listen(port, () =>{
    console.log(`ma bite c'est sur http://127.0.0.1:${port}`)
})