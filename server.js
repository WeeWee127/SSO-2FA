require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const authRoutes = require('./server/routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(passport.initialize());

// Підключення до MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Підключено до MongoDB'))
.catch(err => console.error('Помилка підключення до MongoDB:', err));

// Маршрути
app.use('/auth', authRoutes);

// Базовий маршрут
app.get('/', (req, res) => {
    res.json({ message: 'SSO з 2FA API працює' });
});

// Порт сервера
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
}); 