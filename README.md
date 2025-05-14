# Система SSO з двофакторною аутентифікацією

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/WeeWee127/SSO-2FA.svg)](https://github.com/WeeWee127/SSO-2FA/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/WeeWee127/SSO-2FA.svg)](https://github.com/WeeWee127/SSO-2FA/issues)

Цей проект — система Single Sign-On (SSO) з двофакторною аутентифікацією (2FA) для веб-додатків. Підтримує сучасний UI, ролі користувачів (user/admin), зміну пароля, налаштування 2FA, адмін-панель.

---

## Функціональність
- Єдина система входу (SSO) для всіх підключених додатків
- Двофакторна аутентифікація (2FA, TOTP, Google Authenticator)
- JWT токени для авторизації
- Ролі користувачів (user, admin)
- Адмін-панель (перегляд користувачів)
- Зміна пароля, вимкнення/увімкнення 2FA
- Сучасний інтерфейс (Material UI, світла/темна тема)

---

## Технології
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Frontend:** React.js, Material-UI, Axios
- **Безпека:** JWT, bcrypt, speakeasy (TOTP)

---

## Встановлення та запуск

### 1. Клонування репозиторію
```bash
git clone [URL репозиторію]
cd [назва_папки_проекту]
```

### 2. Встановлення залежностей
- **Бекенд:**
  ```bash
  npm install
  ```
- **Фронтенд:**
  ```bash
  cd client
  npm install
  cd ..
  ```

### 3. Налаштування змінних середовища
Створіть файл `.env` у корені проекту:
```
MONGODB_URI=mongodb://localhost:27017/sso
JWT_SECRET=your_jwt_secret
PORT=5001
```
- `MONGODB_URI` — адреса вашої MongoDB (локально або Atlas)
- `JWT_SECRET` — секрет для підпису JWT
- `PORT` — порт для бекенду (за замовчуванням 5001)

### 4. Запуск проекту
- **Для розробки (одночасно сервер і клієнт):**
  ```bash
  npm run dev:full
  ```
- **Тільки сервер:**
  ```bash
  npm run dev
  ```
- **Тільки клієнт:**
  ```bash
  npm run client
  ```

---

## Структура проекту
```
├── client/                 # React frontend (src/, public/)
├── server/                 # Node.js backend
│   ├── config/            # Конфігурація
│   ├── controllers/       # Контролери (authController.js)
│   ├── middleware/        # Middleware (auth.js)
│   ├── models/            # Mongoose моделі (User.js, Application.js)
│   └── routes/            # API маршрути (auth.js)
├── .env                   # Змінні середовища
├── package.json           # Скрипти та залежності
└── README.md
```

---

## Додатково
- Для першого запуску переконайтесь, що MongoDB запущена локально або доступна через Atlas.
- Для створення першого адміністратора змініть поле `role` на `admin` у колекції `users` через MongoDB Compass.
- Для 2FA використовуйте Google Authenticator або аналогічний додаток.

---

## Ліцензія
MIT 