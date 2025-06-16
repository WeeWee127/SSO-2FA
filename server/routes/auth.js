const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Ліміт для аутентифікаційних маршрутів
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 хвилин
    max: 10, // максимум 10 спроб з одного IP
    message: { error: 'Забагато спроб. Спробуйте пізніше.' }
});

// Реєстрація
router.post('/register', authLimiter, authController.register);

// Вхід
router.post('/login', authLimiter, authController.login);

// Перевірка TOTP OTP
router.post('/verify-otp', authLimiter, authController.verifyOTP);

// Перевірка нового OTP (для SMS/Email)
router.post('/verify-new-otp', authLimiter, authController.verifyNewOTP);

// Налаштування TOTP 2FA (потрібна авторизація)
router.get('/setup-2fa', auth, authController.setup2FA);

// Підтвердження TOTP 2FA (потрібна авторизація)
router.post('/confirm-2fa', auth, authController.confirm2FA);

// Налаштування SMS 2FA (потрібна авторизація)
router.post('/setup-sms-2fa', auth, authController.setupSms2FA);

// Налаштування Email 2FA (потрібна авторизація)
router.post('/setup-email-2fa', auth, authController.setupEmail2FA);

// Вихід (потрібна авторизація)
router.post('/logout', auth, authController.logout);

// Зміна пароля (потрібна авторизація)
router.post('/change-password', auth, authController.changePassword);

// Вимкнення TOTP 2FA (потрібна авторизація)
router.post('/disable-2fa', auth, authController.disable2FA);

// Отримання списку всіх користувачів (тільки для адміна)
router.get('/users', auth, isAdmin, authController.getAllUsers);

module.exports = router; 