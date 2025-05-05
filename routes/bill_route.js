const express = require('express')
const router = express.Router()
const { getBills, createBill, deleteBill, getBillsById, updateBill } = require('../controller/bill_controller')
const { verifyToken } = require('../controller/authentification_controller')

router.get('/',verifyToken, getBills)

router.get('/:_id',verifyToken, getBillsById)

router.post('/',verifyToken, createBill)

router.delete('/:_bill',verifyToken, deleteBill)

router.put('/:_id',verifyToken, updateBill)

module.exports = router