/**
 * General API Routes
 * Общие API endpoints
 */

const express = require('express');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// ========================================
// 🏠 ГЛАВНАЯ СТРАНИЦА API
// ========================================

/**
 * GET /api
 * Информация об API
 */
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'DarlingX API Server',
    version: '1.0.0',
    endpoints: {
      quotes: '/api/quotes',
      auth: '/api/auth',
      admin: '/api/admin',
      oracle: '/api/oracle'
    },
    documentation: '/api/docs'
  });
});

// ========================================
// 📊 СТАТУС СЕРВЕРА
// ========================================

/**
 * GET /api/health
 * Проверка здоровья сервера
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ========================================
// 📝 ЛОГИ
// ========================================

/**
 * GET /api/logs
 * Получить логи (только для разработки)
 */
router.get('/logs', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return next(new AppError('Logs endpoint not available in production', 403));
  }

  // Здесь можно добавить логику получения логов
  res.json({
    status: 'success',
    message: 'Logs endpoint (development only)',
    logs: []
  });
});

// ========================================
// 🔧 КОНФИГУРАЦИЯ
// ========================================

/**
 * GET /api/config
 * Получить публичную конфигурацию
 */
router.get('/config', (req, res) => {
  res.json({
    status: 'success',
    config: {
      features: {
        quotes: true,
        oracle: true,
        auth: true,
        admin: true
      },
      limits: {
        quotesPerPage: 50,
        maxQuoteLength: 1000,
        maxAuthorLength: 100
      },
      version: '1.0.0'
    }
  });
});

module.exports = router; 