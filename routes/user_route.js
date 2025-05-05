const express = require('express')
const router = express.Router()
const { getUsers, getUsersByEmail, createUser, deleteUser, updateUser } = require('../controller/user_controller')
const { veryfyToken } = require('../controller/authentification_controller')

router.get('/', veryfyToken, getUsers)

router.post('/', createUser)

router.get('/:email', veryfyToken, getUsersByEmail)

router.delete('/:name', veryfyToken, deleteUser)

router.put('/:email', veryfyToken, updateUser)

module.exports = router