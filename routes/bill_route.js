const express = require('express')
const router = express.Router()
const { getBills, createBill, deleteBill } = require('../controllers/bill_controller.js')


router.get('/', getBills)

//router.get('/:email', getUsersByEmail)

router.post('/', createBill)

router.delete('/:_bill', deleteBill)

module.exports = router