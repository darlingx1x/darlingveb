/**
 * Authentication Routes
 * Заменяет существующие PHP endpoints для аутентификации
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { generateToken } = require('../middleware/auth');
const User = require('../models/GitHubUser');

const router = express.Router();

// ========================================
// 🔐 РЕГИСТРАЦИЯ
// ========================================

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 */
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Имя пользователя должно быть от 3 до 30 символов')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Имя пользователя может содержать только буквы, цифры и подчеркивания'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен быть не менее 6 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать хотя бы одну букву, одну заглавную букву и одну цифру')
], async (req, res, next) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Проверка существования пользователя
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Пользователь с таким именем или email уже существует'
      });
    }

    // Хеширование пароля
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создание пользователя
    const newUser = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Генерация токена
    const token = generateToken(newUser);

    logger.info(`Новый пользователь зарегистрирован: ${username}`);

    res.status(201).json({
      status: 'success',
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    logger.error('Ошибка при регистрации:', error);
    next(new AppError('Ошибка при регистрации', 500));
  }
});

// ========================================
// 🔑 ВХОД
// ========================================

/**
 * POST /api/auth/login
 * Вход пользователя
 */
router.post('/login', [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Введите имя пользователя или email'),
  body('password')
    .notEmpty()
    .withMessage('Введите пароль')
], async (req, res, next) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Поиск пользователя
    const user = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Неверное имя пользователя или пароль'
      });
    }

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Неверное имя пользователя или пароль'
      });
    }

    // Проверка активности аккаунта
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Аккаунт заблокирован'
      });
    }

    // Обновление времени последнего входа
    await user.update({
      lastLoginAt: new Date(),
      lastLoginIp: req.ip
    });

    // Генерация токена
    const token = generateToken(user);

    logger.info(`Пользователь вошел в систему: ${user.username}`);

    res.json({
      status: 'success',
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('Ошибка при входе:', error);
    next(new AppError('Ошибка при входе', 500));
  }
});

// ========================================
// 🔓 ВЫХОД
// ========================================

/**
 * POST /api/auth/logout
 * Выход пользователя (заменяет logout.php)
 */
router.post('/logout', async (req, res) => {
  // В JWT аутентификации сервер не хранит токены,
  // поэтому выход происходит на клиенте путем удаления токена
  logger.info('Пользователь вышел из системы');
  
  res.json({
    status: 'success',
    message: 'Выход выполнен успешно'
  });
});

// ========================================
// 👤 ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
// ========================================

/**
 * GET /api/auth/profile
 * Получить профиль текущего пользователя
 */
router.get('/profile', async (req, res, next) => {
  try {
    // Получаем пользователя из токена (если есть)
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Не авторизован'
      });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Пользователь не найден'
      });
    }

    res.json({
      status: 'success',
      user
    });

  } catch (error) {
    logger.error('Ошибка при получении профиля:', error);
    next(new AppError('Ошибка при получении профиля', 500));
  }
});

// ========================================
// 🔄 ОБНОВЛЕНИЕ ПРОФИЛЯ
// ========================================

/**
 * PUT /api/auth/profile
 * Обновить профиль пользователя
 */
router.put('/profile', [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email'),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Введите текущий пароль для изменения')
], async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Не авторизован'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Пользователь не найден'
      });
    }

    // Обновление email
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Email уже используется'
        });
      }
      user.email = email.toLowerCase();
    }

    // Обновление пароля
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Введите текущий пароль'
        });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Неверный текущий пароль'
        });
      }

      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      user.password = await bcrypt.hash(newPassword, saltRounds);
    }

    await user.save();

    logger.info(`Профиль обновлен: ${user.username}`);

    res.json({
      status: 'success',
      message: 'Профиль обновлен успешно',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('Ошибка при обновлении профиля:', error);
    next(new AppError('Ошибка при обновлении профиля', 500));
  }
});

// ========================================
// 🔍 ПРОВЕРКА ТОКЕНА
// ========================================

/**
 * GET /api/auth/verify
 * Проверить валидность токена
 */
router.get('/verify', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Недействительный токен'
      });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Пользователь не найден или заблокирован'
      });
    }

    res.json({
      status: 'success',
      message: 'Токен действителен',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('Ошибка при проверке токена:', error);
    next(new AppError('Ошибка при проверке токена', 500));
  }
});

module.exports = router; 