const Bill = require('../models/bill_model')

const getBills = async(req,res) => {
    try {
        const bills = await Bill.find()
        res.json(bills)
    }
    catch (error) {
        res.status(500).json({message: error.message})
    }
}

const createBill = async(req, res) => {
    const newBill = req.body
    try {
        const bill = await Bill.create(newBill)
        res.status(201).json(bill)
    } catch (error) {
        res.status(500).json({message: error.message})
    } 
}

const deleteBill = async(req, res) => {
    try {
        const bill = await Bill.findOneAndDelete({name : req.params._bill})
        if(!bill){
            res.status(404).json({message: 'Bill not found'})
        } else {
            res.status(200).json({message: 'Bill deleted'})
        }
    }
    catch (error) {
        res.status(500).json({message: error.message})
    }
}

module.exports = {getBills, createBill, deleteBill} //, getUsersByEmail, createUser, deleteUser}