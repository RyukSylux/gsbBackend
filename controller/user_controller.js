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
        // Check if the email query parameter is provided
        const email = req.query.email ? {email: req.query.email} : {}
        const users = await User.find(email)
        if(!users){
            throw new Error('User not found', {cause: 404})
        } else {
            res.json(users)
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
        return res.status(201).json(user)
    } catch (error) {
        if (error.code === 'User already exists') {
            return res.status(409).json({message: 'User already exists'})
        } else {
            return res.status(500).json({message: "Server error"})
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

const loginUser = async(req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.findOne({email, password})
        if(!user){
            res.status(401).json({message: 'Invalid email or password'})
        } if (user.password !== sha256(password) + process.env.SALT) {
            res.status(401).json({message: 'Invalid email or password'})
        }
        const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
        res.status(200).json({ token });
    }
    catch (error) {
        res.status(500).json({message: "Server error"})
    }
}

module.exports = {getUsers, getUsersByEmail, createUser, updateUser, deleteUser, loginUser} //, getUsersByEmail, createUser, deleteUser}