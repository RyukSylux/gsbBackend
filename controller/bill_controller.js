const Bill = require('../models/bill_model')

const getBills = async(req,res) => {
    try {
    const {id, role} = req.user
        let bills
        if(role === 'admin'){
            bills = await Bill.find()
            return res.json(bills)
        }
        else{
            bills = await Bill.find({user: id})
            return res.json(bills)
        }
    }
    catch (error) {
        res.status(500).json({message: error.message})
    }
}

const getBillsById = async(req,res) => {
    try{
        const bill = await Bill.findOne({_id : req.params._id})
        if(!bill){
         res.status(404).json({message: 'Bill not found'})
        }else{
        res.json(bill)}}
        catch (error) {
             res.status(500).json({message: error.message})
         }
}

const createBill = async(req, res) => {
    
    try {
        const {date, amount, description, proof, status} = req.body
        const {id} = req.user

        let proofUrl = null
        if (req.file)
        {
            proofUrl = await uploadToS3(req.file)
        } else {
            throw new Error('Proof file is required', {cause: 400})
        }
        
        const bill = new Bill({
            date,
            amount,
            description,
            proof,
            status,
            user: id
        })

        await bill.save()
        res.status(201).json(bill)
    } catch (error) {
        res.status(500).json({messacvge: error.message})
    } 
}

const deleteBill = async(req, res) => {
    try {
        const bill = await Bill.findOneAndDelete({_id : req.params._id})
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

const updateBill = async(req, res) => {
    try {
        const user = await Bill.findOneAndUpdate({_id : req.params._id}, req.body, {new: true})
        if(!user){
            res.status(404).json({message: 'User not found'})
        } else {
            res.status(200).json(user)
        }
    }
    catch (error) {
        res.status(500).json({message: error.message})
    }}

module.exports = {getBills, createBill, deleteBill, updateBill, getBillsById}