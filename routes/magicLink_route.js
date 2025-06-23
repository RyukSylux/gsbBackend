const express = require('express')
const router = express.Router()
const { createMagicLink, verifyMagicLink } = require('../controller/magicLink_controller')

router.post('/validate-magic-link', verifyMagicLink)
router.get('/:email', createMagicLink)

module.exports = router
