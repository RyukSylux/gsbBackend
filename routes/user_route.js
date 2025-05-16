const express = require('express')
const router = express.Router()
const { getUsers, getUsersByEmail, createUser, deleteUser, updateUser } = require('../controller/user_controller')
const { verifyToken } = require('../controller/authentification_controller')

router.get('/', verifyToken, getUsers)

router.post('/', createUser)

router.get('/:email', verifyToken, getUsersByEmail)

router.delete('/:email', verifyToken, deleteUser)

router.put('/:email', verifyToken, updateUser)

module.exports = router