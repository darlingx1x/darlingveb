/**
 * Start Script для DarlingX Server
 * Инициализация и запуск сервера
 */

const githubDB = require('./config/github-db');
const { logger } = require('./utils/logger');

async function initializeServer() {
  logger.info('🚀 Инициализация DarlingX Server...');

  try {
    // Тестируем подключение к GitHub базе данных
    logger.info('🔍 Проверка подключения к GitHub базе данных...');
    const dbConnected = await githubDB.testConnection();
    
    if (!dbConnected) {
      logger.warn('⚠️ GitHub база данных недоступна, продолжаем в локальном режиме');
    }

    // Инициализируем базу данных если она пустая
    logger.info('🔄 Инициализация базы данных...');
    const data = await githubDB.fetchData();
    if (!data.quotes || data.quotes.length === 0) {
      logger.info('📝 База данных пустая, создаем начальные данные...');
      const saved = await githubDB.saveData(data);
      if (!saved) {
        logger.warn('⚠️ Не удалось сохранить данные в GitHub, используем локальный кэш');
      }
    }

    // Запускаем сервер
    logger.info('✅ Инициализация завершена, запуск сервера...');
    require('./server');

  } catch (error) {
    logger.error('❌ Ошибка инициализации:', error);
    logger.warn('⚠️ Продолжаем запуск сервера в режиме восстановления...');
    require('./server');
  }
}

// Запускаем инициализацию
initializeServer(); 