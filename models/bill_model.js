const mongoose = require('mongoose')

const billSchema = new mongoose.Schema({
    date:{
        type: String,
        required: true,
    },
    amount:{
        type: Number,
        required : true,
    },
    proof:{
        type: String,
        required : true,
    },
    description:{
        type: String,
        required : true,
        default : 'Aucune description'
    },
    status:{
        type: String,
        required : true,
    },
    createdAt:{
        type: Date,
        default : Date.now,
        required : true,
    },
})

billSchema.pre('save', function(next) {
    const existingBill = this.constructor.findOne({ id: this._id });
    if (existingBill) {
        throw new Error('Bill already exists');
    }
    next();
})

const Bill = mongoose.model('Bill', billSchema)

module.exports = Bill