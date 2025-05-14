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

// Перевірка OTP
router.post('/verify-otp', authLimiter, authController.verifyOTP);

// Налаштування 2FA (потрібна авторизація)
router.get('/setup-2fa', auth, authController.setup2FA);

// Підтвердження 2FA (потрібна авторизація)
router.post('/confirm-2fa', auth, authController.confirm2FA);

// Вихід (потрібна авторизація)
router.post('/logout', auth, authController.logout);

// Зміна пароля (потрібна авторизація)
router.post('/change-password', auth, authController.changePassword);

// Вимкнення 2FA (потрібна авторизація)
router.post('/disable-2fa', auth, authController.disable2FA);

// Отримання списку всіх користувачів (тільки для адміна)
router.get('/users', auth, isAdmin, authController.getAllUsers);

module.exports = router; 