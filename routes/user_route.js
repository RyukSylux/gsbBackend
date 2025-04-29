const express = require('express')
const router = express.Router()
const { getUsers, getUsersByEmail, createUser, deleteUser } = require('../controllers/user_controller.js')


router.get('/', getUsers)

router.get('/:email', getUsersByEmail)

router.post('/', createUser)

router.delete('/:name', deleteUser)

module.exports = router