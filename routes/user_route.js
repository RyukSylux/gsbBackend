const express = require('express')
const router = express.Router()
const { getUsers, getUsersByEmail, createUser, deleteUser, updateUser } = require('../controllers/user_controller.js')

router.get('/', getUsers)

router.get('/:email', getUsersByEmail)

router.post('/', createUser)

router.delete('/:name', deleteUser)

router.put('/:email', updateUser)

module.exports = router