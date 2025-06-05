// Додаємо функціонал для інтеграції з іншими сервісами
const integrateWithExternalService = (serviceName) => {
  console.log(`Інтеграція з сервісом: ${serviceName}`);
  // Тут можна додати логіку для інтеграції з іншими сервісами
};

// Функція для реєстрації нового користувача
const registerUser = async (email, password) => {
  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return await response.json();
};

// Функція для входу користувача
const loginUser = async (email, password) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return await response.json();
};

// Функція для перевірки OTP
const verifyOTP = async (userId, otp) => {
  const response = await fetch('/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, otp }),
  });
  return await response.json();
};

// Функція для налаштування 2FA
const setup2FA = async (token) => {
  const response = await fetch('/auth/setup-2fa', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};

// Функція для підтвердження 2FA
const confirm2FA = async (token, otp) => {
  const response = await fetch('/auth/confirm-2fa', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ otp }),
  });
  return await response.json();
};

// Функція для виходу користувача
const logoutUser = async (token) => {
  const response = await fetch('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
};

// Інтеграція функцій для роботи з API SSO з 2FA
const handleRegister = async () => {
  const result = await registerUser('user@example.com', 'StrongPassword123');
  console.log('Реєстрація:', result);
};

const handleLogin = async () => {
  const result = await loginUser('user@example.com', 'StrongPassword123');
  console.log('Вхід:', result);
};

const handleVerifyOTP = async () => {
  const result = await verifyOTP('123', '482193');
  console.log('Перевірка OTP:', result);
};

const handleSetup2FA = async () => {
  const result = await setup2FA('JWT_TOKEN_HERE');
  console.log('Налаштування 2FA:', result);
};

const handleConfirm2FA = async () => {
  const result = await confirm2FA('JWT_TOKEN_HERE', '193284');
  console.log('Підтвердження 2FA:', result);
};

const handleLogout = async () => {
  const result = await logoutUser('JWT_TOKEN_HERE');
  console.log('Вихід:', result);
};

// Приклад використання
integrateWithExternalService('Інтернет-магазин');
// registerUser('user@example.com', 'StrongPassword123');
// loginUser('user@example.com', 'StrongPassword123');
// verifyOTP('123', '482193');
// setup2FA('JWT_TOKEN_HERE');
// confirm2FA('JWT_TOKEN_HERE', '193284');
// logoutUser('JWT_TOKEN_HERE');

// Виклик функцій для тестування
handleRegister();
handleLogin();
handleVerifyOTP();
handleSetup2FA();
handleConfirm2FA();
handleLogout(); 