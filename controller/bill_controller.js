const Bill = require('../models/bill_model')

const getBills = async (req, res) => {
    try{
        const {id, role } = req.user
        let bills
        if (role === 'admin'){
            bills = await Bill.find()
        }
        else {
            bills = await Bill.find({user: id})
        }
        res.status(200).json(bills)
    }catch (error) {
            res.status(500).json({message: "Server error"})
        }
};


const createBill = async(req, res) => {
    try {
        const { date, amount, description, status, type } = req.body
        const {id} = req.user
    
        const bill = new Bill({ date, amount, proof, description, user: id, status, type })
        await bill.save()
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