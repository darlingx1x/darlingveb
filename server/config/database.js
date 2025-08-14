/**
 * Database Configuration
 * Sequelize конфигурация для подключения к существующей MySQL базе
 */

const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

// Создаем экземпляр Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'zapom263_quotes',
  process.env.DB_USER || 'your_username',
  process.env.DB_PASSWORD || 'your_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? 
      (msg) => logger.debug(msg) : false,
    
    // Пул соединений
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    // Настройки для MySQL
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: true,
      typeCast: true
    },
    
    // Настройки времени
    timezone: '+00:00',
    
    // Дополнительные настройки
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);

// Функция для тестирования подключения
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Подключение к базе данных успешно установлено');
    return true;
  } catch (error) {
    logger.error('❌ Ошибка подключения к базе данных:', error.message);
    return false;
  }
};

// Функция для синхронизации моделей
const syncDatabase = async (force = false) => {
  try {
    if (force) {
      logger.warn('⚠️ Принудительная синхронизация базы данных (все таблицы будут пересозданы!)');
    }
    
    await sequelize.sync({ force });
    logger.info(`✅ База данных синхронизирована ${force ? '(принудительно)' : ''}`);
    return true;
  } catch (error) {
    logger.error('❌ Ошибка синхронизации базы данных:', error.message);
    return false;
  }
};

// Функция для миграции данных из старой структуры
const migrateData = async () => {
  try {
    logger.info('🔄 Начинаем миграцию данных...');
    
    // Здесь можно добавить логику миграции данных
    // Например, обновление структуры таблиц, добавление новых полей и т.д.
    
    logger.info('✅ Миграция данных завершена');
    return true;
  } catch (error) {
    logger.error('❌ Ошибка миграции данных:', error.message);
    return false;
  }
};

// Graceful shutdown для базы данных
process.on('SIGINT', async () => {
  logger.info('🔄 Закрытие соединений с базой данных...');
  await sequelize.close();
  logger.info('✅ Соединения с базой данных закрыты');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🔄 Закрытие соединений с базой данных...');
  await sequelize.close();
  logger.info('✅ Соединения с базой данных закрыты');
  process.exit(0);
});

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  migrateData
}; 