const mongoose = require('mongoose')
const sha256 = require('js-sha256')
const { JWT_SECRET } = process.env

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

userSchema.pre('save', function(next) {
    try{
   const existingUser = this.constructor.findOne({ email: this.email });
   if (existingUser) {
       throw new Error('Email already exists');
   }

   const secret = JWT_SECRET || "secret";
   this.password = sha256(this.password + secret);
    next();
}catch (error) {
        next(error);
    }
})

userSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.email) {
        const existingUser = this.constructor.findOne({ email: update.email });
        if (existingUser) {
            throw new Error('Email already exists');
        }
    }
    next();
})

const User = mongoose.model('User', userSchema)

module.exports = User