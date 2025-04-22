const User = require('../models/user_model')

const createUser = async (req, res) => {
    const { name, email, password, role } = req.body
    const user = new User({ name, email, password, role})
    await user.save()
    res.status(201).json(user)

}

const getUsers = async(req,res) => {
    const users = await User.find({})
    res.json(users)
}

module.exports = {getUsers, createUser}