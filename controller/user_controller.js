const User = require('../models/user_model')

const getUsers = async(req,res) => {
    try {
        const users = await User.find()
        res.json(users)
    }
    catch (error) {
        res.status(500).json({message: "Server error"})
    }
}

const getUsersByEmail = async(req,res) => {
    try {
        const { email } = req.query
        const user = await User.findOne({email})
        console.log(email)
        if(!user){
            throw new Error('User not found', {cause: 404})
        } else {
            res.json(user)
        }
    }
    catch (error) {
        if (error['cause'] === 404) {
            res.status(404).json({message: error.message})
        } else{
            res.status(500).json({message: "Server error"})
        }
    }
}

const updateUser = async(req, res) => {
    try {
        const { email } = req.query
        const { name, newEmail, password, role } = req.body
        const user = await User.findOneAndUpdate({email}, {name, email: newEmail, password, role}, {new: true})
        if(!user){
            res.status(404).json({message: 'User not found'})
        }
        else {
            res.status(200).json(user)
        }
    }
    catch (error) {
        if (error.code === 'User already exists') {
            res.status(409).json({message: 'User already exists'})
        }
        else if (error.name === 'ValidationError') {
            res.status(400).json({message: 'Invalid data'})
        } else {
            res.status(500).json({message: "Server error"})
        }
    }
}

const createUser = async(req, res) => {
    const newUser = req.body
    try {
        const user = await User.create(newUser)
        res.status(201).json(user)
    } catch (error) {
        if (error.code === 'User already exists') {
            res.status(409).json({message: 'User already exists'})
        } else {
            res.status(500).json({message: "Server error"})
        }
    } 
}

const deleteUser = async(req, res) => {
    try {
            const user = await User.findOneAndDelete({name : req.params.name})
            res.status(200).json({message: 'User deleted'})
        }
    catch (error) {
        res.status(500).json({message: "Server error"})
    }
}

module.exports = {getUsers, getUsersByEmail, createUser, updateUser, deleteUser}