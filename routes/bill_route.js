const express = require('express')
const router = express.Router()
const { getBills, createBill, deleteBill } = require('../controller/bill_controller')
const { authenticateUser } = require('../controller/authentification_controller')

router.get('/', authenticateUser, getBills)

router.post('/', authenticateUser, createBill)

router.delete('/:_bill', authenticateUser, deleteBill)

module.exports = router