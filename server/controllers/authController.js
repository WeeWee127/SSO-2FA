const User = require('../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Реєстрація нового користувача
exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Перевірка чи існує користувач
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Створення нового користувача
        const user = new User({ email, password });
        await user.save();

        // Генерація JWT токена
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                createdAt: user.createdAt,
                twoFactorEnabled: user.twoFactorEnabled,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Вхід користувача
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Пошук користувача
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Перевірка паролю
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Якщо 2FA активована
        if (user.twoFactorEnabled) {
            return res.json({
                requires2FA: true,
                userId: user._id
            });
        }

        // Генерація JWT токена
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                createdAt: user.createdAt,
                twoFactorEnabled: user.twoFactorEnabled,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Перевірка OTP коду
exports.verifyOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: otp
        });

        if (!verified) {
            return res.status(401).json({ error: 'Invalid OTP code' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                createdAt: user.createdAt,
                twoFactorEnabled: user.twoFactorEnabled,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Налаштування 2FA
exports.setup2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Якщо секрет вже є, не генеруємо новий!
        let secret = user.twoFactorSecret;
        let otpauth_url;
        if (!secret) {
            const generated = speakeasy.generateSecret({
                name: `SSO-2FA:${user.email}`
            });
            secret = generated.base32;
            otpauth_url = generated.otpauth_url;
            user.twoFactorSecret = secret;
            await user.save();
        } else {
            otpauth_url = speakeasy.otpauthURL({
                secret,
                label: `SSO-2FA:${user.email}`,
                encoding: 'base32'
            });
        }

        const qrCodeImage = await QRCode.toDataURL(otpauth_url);

        res.json({
            secret,
            qrCodeImage
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Підтвердження 2FA
exports.confirm2FA = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Додаю логування для діагностики
        console.log('OTP:', otp);
        console.log('User:', user.email, user.twoFactorSecret);

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: otp
        });

        if (!verified) {
            return res.status(401).json({ error: 'Invalid OTP code' });
        }

        user.twoFactorEnabled = true;
        await user.save();

        res.json({ status: '2FA enabled' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Вихід з системи
exports.logout = async (req, res) => {
    // В даному випадку просто відправляємо успішну відповідь,
    // оскільки JWT токени не зберігаються на сервері
    res.json({ status: 'logged out' });
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Старий пароль невірний' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ status: 'Пароль успішно змінено' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.disable2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.twoFactorSecret = undefined;
        user.twoFactorEnabled = false;
        await user.save();
        res.json({ status: '2FA вимкнено' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password -twoFactorSecret');
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}; 