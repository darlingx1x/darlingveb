/**
 * Quote Model
 * Sequelize модель для таблицы цитат
 * Заменяет существующую MySQL таблицу
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quote = sequelize.define('Quote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 1000]
    }
  },
  author: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  ip: {
    type: DataTypes.STRING(45), // Поддержка IPv6
    allowNull: true,
    comment: 'IP адрес пользователя, добавившего цитату'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User Agent браузера'
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'general'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Массив тегов для цитаты'
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Статус модерации цитаты'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'quotes',
  timestamps: true,
  indexes: [
    {
      name: 'idx_quotes_created_at',
      fields: ['createdAt']
    },
    {
      name: 'idx_quotes_author',
      fields: ['author']
    },
    {
      name: 'idx_quotes_category',
      fields: ['category']
    },
    {
      name: 'idx_quotes_approved',
      fields: ['isApproved']
    }
  ],
  hooks: {
    beforeCreate: (quote) => {
      // Автоматическая очистка и форматирование данных
      if (quote.text) {
        quote.text = quote.text.trim();
      }
      if (quote.author) {
        quote.author = quote.author.trim();
      }
    },
    beforeUpdate: (quote) => {
      // Обновление updatedAt
      quote.updatedAt = new Date();
    }
  }
});

// Виртуальные поля для совместимости с существующим API
Quote.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Добавляем совместимые поля для существующего фронтенда
  values.created_at = values.createdAt;
  values.updated_at = values.updatedAt;
  
  return values;
};

// Статические методы для удобства
Quote.findRandom = function() {
  return this.findOne({
    order: sequelize.random()
  });
};

Quote.findByAuthor = function(author, options = {}) {
  return this.findAll({
    where: {
      author: {
        [sequelize.Op.like]: `%${author}%`
      }
    },
    ...options
  });
};

Quote.findByCategory = function(category, options = {}) {
  return this.findAll({
    where: { category },
    ...options
  });
};

Quote.getStats = function() {
  return this.findAll({
    attributes: [
      'author',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['author'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
    limit: 10
  });
};

module.exports = Quote; 