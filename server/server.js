/**
 * DarlingX Web Server
 * Гибридный сервер: API Backend + Static File Server
 * Сохраняет существующий сайт, добавляет серверную функциональность
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Импорт маршрутов
const quotesRoutes = require('./routes/quotes');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const oracleRoutes = require('./routes/oracle');
const apiRoutes = require('./routes/api');

// Импорт middleware
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// 🔧 MIDDLEWARE НАСТРОЙКИ
// ========================================

// Безопасность
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// CORS для API
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'https://darlingx.com'],
  credentials: true
}));

// Сжатие ответов
app.use(compression());

// Логирование
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting для API
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// 📁 СТАТИЧЕСКИЕ ФАЙЛЫ (ваш существующий сайт)
// ========================================

// Основные статические файлы (HTML, CSS, JS, изображения)
app.use(express.static(path.join(__dirname, '../'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
  etag: true,
  lastModified: true
}));

// ========================================
// 🔗 API МАРШРУТЫ
// ========================================

// API rate limiting
app.use('/api', apiLimiter);

// API маршруты
app.use('/api/quotes', quotesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/oracle', oracleRoutes);
app.use('/api', apiRoutes);

// ========================================
// 🌐 SPA FALLBACK (для чистых URL)
// ========================================

// Обработка чистых URL для существующих страниц
const spaRoutes = [
  '/books', '/book-details', '/posts', '/projects', '/lists', 
  '/cv', '/open-questions', '/quotes', '/project-detail', 
  '/my-time', '/offline', '/register'
];

spaRoutes.forEach(route => {
  app.get(route, (req, res) => {
    const htmlFile = route.substring(1) + '.html';
    res.sendFile(path.join(__dirname, '../', htmlFile));
  });
});

// Fallback для всех остальных маршрутов - возвращаем index.html
app.get('*', (req, res) => {
  // Проверяем, существует ли файл
  const filePath = path.join(__dirname, '../', req.path);
  if (require('fs').existsSync(filePath) && require('fs').statSync(filePath).isFile()) {
    res.sendFile(filePath);
  } else {
    // SPA fallback
    res.sendFile(path.join(__dirname, '../index.html'));
  }
});

// ========================================
// 🛠️ ОБРАБОТКА ОШИБОК
// ========================================

app.use(errorHandler);

// ========================================
// 🚀 ЗАПУСК СЕРВЕРА
// ========================================

app.listen(PORT, () => {
  logger.info(`🚀 DarlingX Server запущен на порту ${PORT}`);
  logger.info(`📁 Статические файлы: ${path.join(__dirname, '../')}`);
  logger.info(`🔗 API доступен по адресу: http://localhost:${PORT}/api`);
  logger.info(`🌐 Сайт доступен по адресу: http://localhost:${PORT}`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`🔧 Режим разработки активен`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM получен, завершение работы сервера...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT получен, завершение работы сервера...');
  process.exit(0);
});

module.exports = app; 