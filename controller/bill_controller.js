const User = require('../models/bill_model')

const getBills = async(req,res) => {
    const users = await User.find()
    res.json(users)
}

/*const getUsersByEmail = async(req,res) => {
   const user = await User.findOne({name : req.params.name})
   console.log(req.params.name)
   if(!user){
    res.status(404).json({message: 'User not found'})
   }
}*/

const createBill = async(req, res) => {
    const newBill = req.body
    try {
        const bill = await User.create(newBill)
        res.status(201).json(bill)
    } catch (error) {
        res.status(500).json({message: error.message})
    } 
}

const deleteBill = async(req, res) => {
    const bill = await User.findOneAndDelete({name : req.params._id})
    if(!bill){
        res.status(404).json({message: 'Bill not found'})
    } else {
        res.status(200).json({message: 'Bill deleted'})
    }
}

module.exports = {getBills, createBill, deleteBill} //, getUsersByEmail, createUser, deleteUser}