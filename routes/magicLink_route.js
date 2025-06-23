const express = require('express')
const router = express.Router()
const { createMagicLink, verifyMagicLink } = require('../controller/magicLink_controller')

router.get('/', createMagicLink)
router.post('/validate-magic-link', verifyMagicLink)

module.exports = router
