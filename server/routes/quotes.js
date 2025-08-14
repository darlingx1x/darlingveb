/**
 * Quotes API Routes
 * Заменяет существующие PHP endpoints для цитат
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const Quote = require('../models/GitHubQuote');

const router = express.Router();

// ========================================
// 📖 ПОЛУЧЕНИЕ ЦИТАТ
// ========================================

/**
 * GET /api/quotes
 * Получить все цитаты (заменяет get-quotes.php)
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, author, search } = req.query;
    
    // Построение условий поиска
    const whereClause = {};
    if (author) {
      whereClause.author = { [Quote.sequelize.Op.like]: `%${author}%` };
    }
    if (search) {
      whereClause[Quote.sequelize.Op.or] = [
        { text: { [Quote.sequelize.Op.like]: `%${search}%` } },
        { author: { [Quote.sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    
    const quotes = await Quote.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    logger.info(`Цитаты получены: ${quotes.rows.length} из ${quotes.count}`);

    res.json({
      status: 'success',
      quotes: quotes.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(quotes.count / limit),
        totalQuotes: quotes.count,
        hasNext: offset + quotes.rows.length < quotes.count,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Ошибка при получении цитат:', error);
    next(new AppError('Ошибка при получении цитат', 500));
  }
});

// ========================================
// ➕ ДОБАВЛЕНИЕ ЦИТАТЫ
// ========================================

/**
 * POST /api/quotes
 * Добавить новую цитату (заменяет submit-quote.php)
 */
router.post('/', [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Текст цитаты должен быть от 1 до 1000 символов'),
  body('author')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Автор должен быть от 1 до 100 символов')
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

    const { text, author } = req.body;

    // Создание новой цитаты
    const newQuote = await Quote.create({
      text: text.trim(),
      author: author.trim(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`Новая цитата добавлена: ID ${newQuote.id}`);

    res.status(201).json({
      status: 'success',
      message: 'Цитата успешно добавлена',
      quote: {
        id: newQuote.id,
        text: newQuote.text,
        author: newQuote.author,
        createdAt: newQuote.createdAt
      }
    });

  } catch (error) {
    logger.error('Ошибка при добавлении цитаты:', error);
    next(new AppError('Ошибка при добавлении цитаты', 500));
  }
});

// ========================================
// 🔍 ПОЛУЧЕНИЕ ОДНОЙ ЦИТАТЫ
// ========================================

/**
 * GET /api/quotes/:id
 * Получить конкретную цитату по ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const quote = await Quote.findByPk(id);
    
    if (!quote) {
      return next(new AppError('Цитата не найдена', 404));
    }

    res.json({
      status: 'success',
      quote
    });

  } catch (error) {
    logger.error('Ошибка при получении цитаты:', error);
    next(new AppError('Ошибка при получении цитаты', 500));
  }
});

// ========================================
// ✏️ ОБНОВЛЕНИЕ ЦИТАТЫ (только для админов)
// ========================================

/**
 * PUT /api/quotes/:id
 * Обновить цитату (требует аутентификации)
 */
router.put('/:id', authenticateToken, [
  body('text')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Текст цитаты должен быть от 1 до 1000 символов'),
  body('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Автор должен быть от 1 до 100 символов')
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, author } = req.body;

    const quote = await Quote.findByPk(id);
    
    if (!quote) {
      return next(new AppError('Цитата не найдена', 404));
    }

    // Обновляем только переданные поля
    if (text) quote.text = text.trim();
    if (author) quote.author = author.trim();
    
    await quote.save();

    logger.info(`Цитата обновлена: ID ${id}`);

    res.json({
      status: 'success',
      message: 'Цитата успешно обновлена',
      quote
    });

  } catch (error) {
    logger.error('Ошибка при обновлении цитаты:', error);
    next(new AppError('Ошибка при обновлении цитаты', 500));
  }
});

// ========================================
// 🗑️ УДАЛЕНИЕ ЦИТАТЫ (только для админов)
// ========================================

/**
 * DELETE /api/quotes/:id
 * Удалить цитату (требует аутентификации)
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const quote = await Quote.findByPk(id);
    
    if (!quote) {
      return next(new AppError('Цитата не найдена', 404));
    }

    await quote.destroy();

    logger.info(`Цитата удалена: ID ${id}`);

    res.json({
      status: 'success',
      message: 'Цитата успешно удалена'
    });

  } catch (error) {
    logger.error('Ошибка при удалении цитаты:', error);
    next(new AppError('Ошибка при удалении цитаты', 500));
  }
});

// ========================================
// 🎲 СЛУЧАЙНАЯ ЦИТАТА
// ========================================

/**
 * GET /api/quotes/random/one
 * Получить случайную цитату
 */
router.get('/random/one', async (req, res, next) => {
  try {
    const quote = await Quote.findOne({
      order: Quote.sequelize.random()
    });

    if (!quote) {
      return next(new AppError('Цитаты не найдены', 404));
    }

    res.json({
      status: 'success',
      quote
    });

  } catch (error) {
    logger.error('Ошибка при получении случайной цитаты:', error);
    next(new AppError('Ошибка при получении случайной цитаты', 500));
  }
});

// ========================================
// 📊 СТАТИСТИКА ЦИТАТ
// ========================================

/**
 * GET /api/quotes/stats/overview
 * Получить статистику цитат
 */
router.get('/stats/overview', async (req, res, next) => {
  try {
    const totalQuotes = await Quote.count();
    const todayQuotes = await Quote.count({
      where: {
        createdAt: {
          [Quote.sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Топ авторов
    const topAuthors = await Quote.findAll({
      attributes: [
        'author',
        [Quote.sequelize.fn('COUNT', Quote.sequelize.col('id')), 'count']
      ],
      group: ['author'],
      order: [[Quote.sequelize.fn('COUNT', Quote.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      status: 'success',
      stats: {
        totalQuotes,
        todayQuotes,
        topAuthors
      }
    });

  } catch (error) {
    logger.error('Ошибка при получении статистики:', error);
    next(new AppError('Ошибка при получении статистики', 500));
  }
});

module.exports = router; 