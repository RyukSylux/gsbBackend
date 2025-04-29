const mongoose = require('mongoose')

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
    },
    bills:{
        type: [mongoose.Schema.Types.ObjectId],
        ref : 'Bills',
    },
})

userSchema.pre('save', function(next) {
   const existingUser = this.constructor.findOne({ email: this.email });
   if (existingUser) {
       throw new Error('Email already exists');
   }
    next();
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