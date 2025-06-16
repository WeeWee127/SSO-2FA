const User = require('../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Налаштування Twilio
const twilioClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Налаштування Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Генерація одноразового коду
function generate2FACode() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-значний код
}

// Реєстрація нового користувача
exports.register = async (req, res) => {
    try {
        const { email, password, phoneNumber } = req.body;

        // Перевірка чи існує користувач
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Створення нового користувача
        const user = new User({ email, password, phoneNumber });
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
                sms2FAEnabled: user.sms2FAEnabled,
                email2FAEnabled: user.email2FAEnabled,
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

        // Перевірка 2FA (в порядку пріоритету)
        if (user.twoFactorEnabled) { // TOTP 2FA
            return res.json({
                requires2FA: true,
                method: 'TOTP',
                userId: user._id
            });
        } else if (user.sms2FAEnabled && user.phoneNumber) { // SMS 2FA
            const code = generate2FACode();
            user.twoFactorTempCode = code;
            user.twoFactorCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // Код дійсний 5 хвилин
            await user.save();

            await twilioClient.messages.create({
                body: `Your 2FA code is ${code}`,
                from: process.env.TWILIO_PHONE,
                to: user.phoneNumber,
            });

            return res.json({
                requires2FA: true,
                method: 'SMS',
                userId: user._id
            });
        } else if (user.email2FAEnabled) { // Email 2FA
            const code = generate2FACode();
            user.twoFactorTempCode = code;
            user.twoFactorCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // Код дійсний 5 хвилин
            await user.save();

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Your 2FA Code',
                text: `Your 2FA code is ${code}`,
            };
            await transporter.sendMail(mailOptions);

            return res.json({
                requires2FA: true,
                method: 'EMAIL',
                userId: user._id
            });
        }

        // Генерація JWT токена (якщо 2FA не потрібна)
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
                sms2FAEnabled: user.sms2FAEnabled,
                email2FAEnabled: user.email2FAEnabled,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Перевірка TOTP коду (існуюча функція)
exports.verifyOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Перевірка TOTP коду
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
                sms2FAEnabled: user.sms2FAEnabled,
                email2FAEnabled: user.email2FAEnabled,
                role: user.role
            }
        });
    } catch (error) {
        console.error('TOTP Verification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Нова функція для перевірки SMS/Email OTP
exports.verifyNewOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.twoFactorTempCode || user.twoFactorTempCode !== otp) {
            return res.status(401).json({ error: 'Invalid OTP code' });
        }

        if (user.twoFactorCodeExpires && user.twoFactorCodeExpires < new Date()) {
            return res.status(401).json({ error: 'OTP code has expired' });
        }

        // Очищаємо тимчасовий код після успішної перевірки
        user.twoFactorTempCode = undefined;
        user.twoFactorCodeExpires = undefined;
        await user.save();

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
                sms2FAEnabled: user.sms2FAEnabled,
                email2FAEnabled: user.email2FAEnabled,
                role: user.role
            }
        });

    } catch (error) {
        console.error('New OTP Verification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Функція для налаштування (увімкнення/вимкнення) SMS 2FA
exports.setupSms2FA = async (req, res) => {
    try {
        const { enable, phoneNumber } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (enable && !phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required to enable SMS 2FA' });
        }

        user.sms2FAEnabled = enable;
        if (enable) {
            user.phoneNumber = phoneNumber;
        } else {
            user.phoneNumber = undefined;
        }
        await user.save();

        res.json({ status: `SMS 2FA ${enable ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error('Setup SMS 2FA error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Функція для налаштування (увімкнення/вимкнення) Email 2FA
exports.setupEmail2FA = async (req, res) => {
    try {
        const { enable } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.email2FAEnabled = enable;
        await user.save();

        res.json({ status: `Email 2FA ${enable ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error('Setup Email 2FA error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Налаштування TOTP 2FA (існуюча функція)
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
        console.error('TOTP Setup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Підтвердження TOTP 2FA (існуюча функція)
exports.confirm2FA = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user.userId);

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

        user.twoFactorEnabled = true;
        await user.save();

        res.json({ status: '2FA enabled' });
    } catch (error) {
        console.error('TOTP Confirmation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Вихід з системи
exports.logout = async (req, res) => {
    res.json({ status: 'logged out' });
};

// Зміна пароля
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
        console.error('Change Password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Вимкнення TOTP 2FA
exports.disable2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.twoFactorSecret = undefined;
        user.twoFactorEnabled = false;
        await user.save();
        res.json({ status: 'TOTP 2FA вимкнено' });
    } catch (error) {
        console.error('Disable TOTP 2FA error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Отримання списку всіх користувачів (тільки для адміна)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password -twoFactorSecret');
        res.json({ users });
    } catch (error) {
        console.error('Get All Users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}; 