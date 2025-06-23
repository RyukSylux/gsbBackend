const mongoose = require('mongoose')

const magicLinkToken = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    usedAt:{
        type: Date,
        default : Date.now,
        required : true,
    },
    used: {
        type: Boolean,
        required: true,
        default: false
    },
    expiresAt:{
        type: Date,
        default : Date.now + 15 * 60 * 1000, // 15 minutes
        required : true,
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('MagicLink', magicLinkToken)