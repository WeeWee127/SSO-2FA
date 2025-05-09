const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    clientId: {
        type: String,
        required: true,
        unique: true
    },
    clientSecret: {
        type: String,
        required: true
    },
    redirectUri: {
        type: String,
        required: true
    },
    requiresTwoFactor: {
        type: Boolean,
        default: true
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Application', applicationSchema); 