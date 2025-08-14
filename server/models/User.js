/**
 * User Model
 * Sequelize модель для пользователей
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 30],
      is: /^[a-zA-Z0-9_]+$/
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'moderator'),
    defaultValue: 'user',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginIp: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP адрес при регистрации'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User Agent при регистрации'
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
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      name: 'idx_users_username',
      fields: ['username'],
      unique: true
    },
    {
      name: 'idx_users_email',
      fields: ['email'],
      unique: true
    },
    {
      name: 'idx_users_role',
      fields: ['role']
    },
    {
      name: 'idx_users_active',
      fields: ['isActive']
    }
  ],
  hooks: {
    beforeCreate: (user) => {
      // Автоматическая очистка данных
      if (user.username) {
        user.username = user.username.toLowerCase();
      }
      if (user.email) {
        user.email = user.email.toLowerCase();
      }
    },
    beforeUpdate: (user) => {
      // Обновление updatedAt
      user.updatedAt = new Date();
    }
  }
});

// Виртуальные поля для совместимости
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Удаляем пароль из JSON
  delete values.password;
  
  // Добавляем совместимые поля
  values.created_at = values.createdAt;
  values.updated_at = values.updatedAt;
  
  return values;
};

// Статические методы
User.findByUsernameOrEmail = function(identifier) {
  return this.findOne({
    where: {
      [sequelize.Op.or]: [
        { username: identifier.toLowerCase() },
        { email: identifier.toLowerCase() }
      ]
    }
  });
};

User.getStats = function() {
  return this.findAll({
    attributes: [
      'role',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['role']
  });
};

module.exports = User; 