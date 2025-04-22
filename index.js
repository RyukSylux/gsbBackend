const express = require('express')
const app = express()
const port = 3000

const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://ryuk:ryuk@cluster0.q8tp4.mongodb.net/gsb')
const db = mongoose.connection
db.on('error', (err) => {console.log('Error connecting to MongoDB', err)})
db.on('open', () => {console.log('connected to MongoDB')})

app.use(express.json())

app.get('/',(req,res) => {
    res.send('<h1>ESPèCE DE PD</h1>')
})

app.listen(port, () =>{
    console.log(`frr c'est sur http://127.0.0.1:${port}`)
})