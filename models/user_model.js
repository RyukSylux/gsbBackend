const mongoose = require('mongoose')
const sha256 = require('js-sha256')
require('dotenv').config();

const JWT_SALT = process.env.JWT_SALT || 'salt'

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required : true,
        unique: true,
    },
    description:{
        type: String,
        required : true,
        default : 'Aucune description'
    },
    password:{
        type: String,
        required : true,
    },
    createdAt:{
        type: Date,
        default : Date.now,
        required : true,
    },
    role:{
        type: String,
        required : true,
    }
})

userSchema.pre('save', async function (next) {
    try {
        const existingUser = await this.constructor.findOne({ email: this.email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const secret = JWT_SALT;
        this.password = sha256(this.password + secret);
        next();
    } catch (error) {
        next(error); 
    }
});

const User = mongoose.model('User', userSchema)

module.exports = User