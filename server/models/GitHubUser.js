/**
 * GitHub User Model
 * Модель для работы с пользователями через GitHub JSON базу данных
 */

const githubDB = require('../config/github-db');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

class GitHubUser {
  // Получить всех пользователей
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 20, search, role } = options;
      
      let users = await githubDB.findInCollection('users');
      
      // Фильтрация по поиску
      if (search) {
        users = users.filter(user => 
          (user.username && user.username.toLowerCase().includes(search.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(search.toLowerCase()))
        );
      }
      
      // Фильтрация по роли
      if (role) {
        users = users.filter(user => user.role === role);
      }
      
      // Сортировка по дате создания (новые сначала)
      users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Пагинация
      const offset = (page - 1) * limit;
      const paginatedUsers = users.slice(offset, offset + limit);
      
      // Удаляем пароли из ответа
      const safeUsers = paginatedUsers.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      return {
        rows: safeUsers,
        count: users.length
      };
    } catch (error) {
      logger.error('Ошибка получения пользователей:', error);
      throw error;
    }
  }

  // Получить пользователя по ID
  static async findByPk(id) {
    try {
      const user = await githubDB.findById('users', id);
      if (user) {
        const { password, ...safeUser } = user;
        return safeUser;
      }
      return null;
    } catch (error) {
      logger.error('Ошибка получения пользователя по ID:', error);
      throw error;
    }
  }

  // Найти пользователя по имени пользователя или email
  static async findByUsernameOrEmail(identifier) {
    try {
      const users = await githubDB.findInCollection('users');
      const user = users.find(u => 
        u.username === identifier.toLowerCase() ||
        u.email === identifier.toLowerCase()
      );
      
      return user || null;
    } catch (error) {
      logger.error('Ошибка поиска пользователя:', error);
      throw error;
    }
  }

  // Создать нового пользователя
  static async create(userData) {
    try {
      // Проверяем, не существует ли уже пользователь
      const existingUser = await this.findByUsernameOrEmail(userData.username);
      if (existingUser) {
        throw new Error('Пользователь с таким именем или email уже существует');
      }

      // Хешируем пароль
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const user = {
        username: userData.username.toLowerCase(),
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role || 'user',
        isActive: userData.isActive !== false, // По умолчанию активен
        ip: userData.ip,
        userAgent: userData.userAgent
      };

      const createdUser = await githubDB.addToCollection('users', user);
      
      // Возвращаем пользователя без пароля
      const { password, ...safeUser } = createdUser;
      return safeUser;
    } catch (error) {
      logger.error('Ошибка создания пользователя:', error);
      throw error;
    }
  }

  // Обновить пользователя
  static async update(updates, options = {}) {
    try {
      const { where } = options;
      if (!where || !where.id) {
        throw new Error('ID пользователя обязателен для обновления');
      }

      // Если обновляется пароль, хешируем его
      if (updates.password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        updates.password = await bcrypt.hash(updates.password, saltRounds);
      }

      // Если обновляется username или email, проверяем уникальность
      if (updates.username || updates.email) {
        const users = await githubDB.findInCollection('users');
        const existingUser = users.find(u => 
          u.id !== where.id && (
            u.username === (updates.username || '').toLowerCase() ||
            u.email === (updates.email || '').toLowerCase()
          )
        );
        
        if (existingUser) {
          throw new Error('Пользователь с таким именем или email уже существует');
        }
      }

      const updatedUser = await githubDB.updateInCollection('users', where.id, updates);
      
      // Возвращаем пользователя без пароля
      const { password, ...safeUser } = updatedUser;
      return safeUser;
    } catch (error) {
      logger.error('Ошибка обновления пользователя:', error);
      throw error;
    }
  }

  // Удалить пользователя
  static async destroy(options = {}) {
    try {
      const { where } = options;
      if (!where || !where.id) {
        throw new Error('ID пользователя обязателен для удаления');
      }

      return await githubDB.removeFromCollection('users', where.id);
    } catch (error) {
      logger.error('Ошибка удаления пользователя:', error);
      throw error;
    }
  }

  // Подсчитать количество пользователей
  static async count(options = {}) {
    try {
      const { where } = options;
      let users = await githubDB.findInCollection('users');
      
      if (where) {
        Object.keys(where).forEach(key => {
          if (key === 'createdAt' && where[key].$gte) {
            const startDate = where[key].$gte;
            users = users.filter(user => new Date(user.createdAt) >= startDate);
          } else {
            users = users.filter(user => user[key] === where[key]);
          }
        });
      }
      
      return users.length;
    } catch (error) {
      logger.error('Ошибка подсчета пользователей:', error);
      throw error;
    }
  }

  // Проверить пароль пользователя
  static async verifyPassword(user, password) {
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      logger.error('Ошибка проверки пароля:', error);
      return false;
    }
  }

  // Обновить время последнего входа
  static async updateLastLogin(id, ip) {
    try {
      return await githubDB.updateInCollection('users', id, {
        lastLoginAt: new Date().toISOString(),
        lastLoginIp: ip
      });
    } catch (error) {
      logger.error('Ошибка обновления времени входа:', error);
      throw error;
    }
  }

  // Получить статистику пользователей
  static async getStats() {
    try {
      const users = await githubDB.findInCollection('users');
      
      // Статистика по ролям
      const roleStats = {};
      users.forEach(user => {
        const role = user.role || 'user';
        roleStats[role] = (roleStats[role] || 0) + 1;
      });
      
      // Активные пользователи
      const activeUsers = users.filter(user => user.isActive).length;
      
      // Новые пользователи за сегодня
      const todayUsers = users.filter(user => {
        const today = new Date();
        const userDate = new Date(user.createdAt);
        return userDate.toDateString() === today.toDateString();
      }).length;
      
      return {
        totalUsers: users.length,
        activeUsers,
        todayUsers,
        roleStats
      };
    } catch (error) {
      logger.error('Ошибка получения статистики пользователей:', error);
      throw error;
    }
  }

  // Поиск пользователей
  static async search(query) {
    try {
      const users = await githubDB.findInCollection('users');
      
      const foundUsers = users.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
      
      // Удаляем пароли из ответа
      return foundUsers.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
    } catch (error) {
      logger.error('Ошибка поиска пользователей:', error);
      throw error;
    }
  }

  // Получить пользователей по роли
  static async findByRole(role) {
    try {
      const users = await githubDB.findInCollection('users', { role });
      
      // Удаляем пароли из ответа
      return users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
    } catch (error) {
      logger.error('Ошибка получения пользователей по роли:', error);
      throw error;
    }
  }
}

module.exports = GitHubUser; 