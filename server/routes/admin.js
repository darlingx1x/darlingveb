/**
 * Admin Routes
 * API для админ-панели с GitHub базой данных
 */

const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const Quote = require('../models/GitHubQuote');
const User = require('../models/GitHubUser');

const router = express.Router();

// Все маршруты требуют аутентификации и прав администратора
router.use(authenticateToken);
router.use(requireAdmin);

// ========================================
// 📊 ДАШБОРД АДМИНА
// ========================================

/**
 * GET /api/admin/dashboard
 * Получить данные для админ-дашборда
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    // Статистика цитат
    const totalQuotes = await Quote.count();
    const todayQuotes = await Quote.count({
      where: {
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Статистика пользователей
    const totalUsers = await User.count();
    const todayUsers = await User.count({
      where: {
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Последние цитаты
    const recentQuotesResult = await Quote.findAll({
      limit: 10
    });
    const recentQuotes = recentQuotesResult.rows.map(quote => ({
      id: quote.id,
      text: quote.text,
      author: quote.author,
      createdAt: quote.createdAt,
      ip: quote.ip
    }));

    // Последние пользователи
    const recentUsersResult = await User.findAll({
      limit: 10
    });
    const recentUsers = recentUsersResult.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));

    res.json({
      status: 'success',
      dashboard: {
        quotes: {
          total: totalQuotes,
          today: todayQuotes
        },
        users: {
          total: totalUsers,
          today: todayUsers
        },
        recentQuotes,
        recentUsers
      }
    });

  } catch (error) {
    logger.error('Ошибка получения данных дашборда:', error);
    next(new AppError('Ошибка получения данных дашборда', 500));
  }
});

// ========================================
// 👥 УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
// ========================================

/**
 * GET /api/admin/users
 * Получить список всех пользователей
 */
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let users = await User.findAll();
    
    // Фильтрация по поиску
    if (search) {
      users = users.filter(user => 
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Сортировка по дате создания (новые сначала)
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Пагинация
    const offset = (page - 1) * limit;
    const paginatedUsers = users.slice(offset, offset + parseInt(limit));

    res.json({
      status: 'success',
      users: paginatedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(users.length / limit),
        totalUsers: users.length
      }
    });

  } catch (error) {
    logger.error('Ошибка получения пользователей:', error);
    next(new AppError('Ошибка получения пользователей', 500));
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Изменить статус пользователя
 */
router.put('/users/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(parseInt(id));
    if (!user) {
      return next(new AppError('Пользователь не найден', 404));
    }

    await User.update({ isActive }, { where: { id: parseInt(id) } });

    logger.info(`Статус пользователя изменен: ${user.username} -> ${isActive ? 'активен' : 'заблокирован'}`);

    res.json({
      status: 'success',
      message: `Пользователь ${isActive ? 'активирован' : 'заблокирован'}`,
      user: {
        id: user.id,
        username: user.username,
        isActive: isActive
      }
    });

  } catch (error) {
    logger.error('Ошибка изменения статуса пользователя:', error);
    next(new AppError('Ошибка изменения статуса пользователя', 500));
  }
});

// ========================================
// 📝 УПРАВЛЕНИЕ ЦИТАТАМИ
// ========================================

/**
 * GET /api/admin/quotes
 * Получить все цитаты для модерации
 */
router.get('/quotes', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    
    let quotes = await Quote.findAll();
    
    // Фильтрация по статусу
    if (status === 'pending') {
      quotes = quotes.filter(quote => !quote.isApproved);
    } else if (status === 'approved') {
      quotes = quotes.filter(quote => quote.isApproved);
    }
    
    // Сортировка по дате создания (новые сначала)
    quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Пагинация
    const offset = (page - 1) * limit;
    const paginatedQuotes = quotes.slice(offset, offset + parseInt(limit));

    res.json({
      status: 'success',
      quotes: paginatedQuotes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(quotes.length / limit),
        totalQuotes: quotes.length
      }
    });

  } catch (error) {
    logger.error('Ошибка получения цитат для модерации:', error);
    next(new AppError('Ошибка получения цитат', 500));
  }
});

/**
 * PUT /api/admin/quotes/:id/approve
 * Одобрить цитату
 */
router.put('/quotes/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await Quote.findByPk(parseInt(id));
    if (!quote) {
      return next(new AppError('Цитата не найдена', 404));
    }

    await Quote.update({ isApproved: true }, { where: { id: parseInt(id) } });

    logger.info(`Цитата одобрена: ID ${id}`);

    res.json({
      status: 'success',
      message: 'Цитата одобрена',
      quote: {
        id: quote.id,
        text: quote.text,
        author: quote.author,
        isApproved: true
      }
    });

  } catch (error) {
    logger.error('Ошибка одобрения цитаты:', error);
    next(new AppError('Ошибка одобрения цитаты', 500));
  }
});

/**
 * DELETE /api/admin/quotes/:id
 * Удалить цитату
 */
router.delete('/quotes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await Quote.findByPk(parseInt(id));
    if (!quote) {
      return next(new AppError('Цитата не найдена', 404));
    }

    await Quote.destroy({ where: { id: parseInt(id) } });

    logger.info(`Цитата удалена администратором: ID ${id}`);

    res.json({
      status: 'success',
      message: 'Цитата удалена'
    });

  } catch (error) {
    logger.error('Ошибка удаления цитаты:', error);
    next(new AppError('Ошибка удаления цитаты', 500));
  }
});

// ========================================
// 📈 СТАТИСТИКА И АНАЛИТИКА
// ========================================

/**
 * GET /api/admin/analytics
 * Получить аналитику
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    
    // Получаем статистику цитат
    const quotesStats = await Quote.getStats();
    
    // Получаем статистику пользователей
    const usersStats = await User.getStats();
    
    // Получаем все цитаты для анализа по дням
    const allQuotes = await Quote.findAll();
    
    // Расчет периода
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Статистика цитат по дням
    const quotesByDay = {};
    allQuotes.forEach(quote => {
      const quoteDate = new Date(quote.createdAt);
      if (quoteDate >= startDate) {
        const dateKey = quoteDate.toISOString().split('T')[0];
        quotesByDay[dateKey] = (quotesByDay[dateKey] || 0) + 1;
      }
    });

    const quotesStatsArray = Object.entries(quotesByDay).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      status: 'success',
      analytics: {
        period,
        quotesStats: quotesStatsArray,
        topAuthors: quotesStats.topAuthors,
        userStats: usersStats,
        quoteStats: quotesStats
      }
    });

  } catch (error) {
    logger.error('Ошибка получения аналитики:', error);
    next(new AppError('Ошибка получения аналитики', 500));
  }
});

module.exports = router; 