const Bill = require('../models/bill_model')

const getBill = async(req,res) => {
    const bills = await Bill.find({})
    res.json(bills)
}

module.exports = {getBill, }