const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: false // Не обов'язково, якщо користувач не хоче SMS 2FA
    },
    twoFactorSecret: {
        type: String,
        required: false
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false // Загальний прапор для TOTP 2FA
    },
    sms2FAEnabled: {
        type: Boolean,
        default: false
    },
    email2FAEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorTempCode: {
        type: String,
        required: false
    },
    twoFactorCodeExpires: {
        type: Date,
        required: false
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
});

// Хешування паролю перед збереженням
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Метод для перевірки паролю
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 