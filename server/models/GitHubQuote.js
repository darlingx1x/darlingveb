/**
 * GitHub Quote Model
 * Модель для работы с цитатами через GitHub JSON базу данных
 */

const githubDB = require('../config/github-db');
const { logger } = require('../utils/logger');

class GitHubQuote {
  // Получить все цитаты
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 50, author, search, category } = options;
      
      let quotes = await githubDB.findInCollection('quotes');
      
      // Фильтрация по автору
      if (author) {
        quotes = quotes.filter(quote => 
          quote.author && quote.author.toLowerCase().includes(author.toLowerCase())
        );
      }
      
      // Фильтрация по поиску
      if (search) {
        quotes = quotes.filter(quote => 
          (quote.text && quote.text.toLowerCase().includes(search.toLowerCase())) ||
          (quote.author && quote.author.toLowerCase().includes(search.toLowerCase()))
        );
      }
      
      // Фильтрация по категории
      if (category) {
        quotes = quotes.filter(quote => quote.category === category);
      }
      
      // Сортировка по дате создания (новые сначала)
      quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Пагинация
      const offset = (page - 1) * limit;
      const paginatedQuotes = quotes.slice(offset, offset + limit);
      
      return {
        rows: paginatedQuotes,
        count: quotes.length
      };
    } catch (error) {
      logger.error('Ошибка получения цитат:', error);
      throw error;
    }
  }

  // Получить цитату по ID
  static async findByPk(id) {
    try {
      return await githubDB.findById('quotes', id);
    } catch (error) {
      logger.error('Ошибка получения цитаты по ID:', error);
      throw error;
    }
  }

  // Создать новую цитату
  static async create(quoteData) {
    try {
      const quote = {
        text: quoteData.text.trim(),
        author: quoteData.author.trim(),
        category: quoteData.category || 'general',
        tags: quoteData.tags || [],
        likes: 0,
        isApproved: quoteData.isApproved !== false, // По умолчанию одобрена
        ip: quoteData.ip,
        userAgent: quoteData.userAgent
      };

      return await githubDB.addToCollection('quotes', quote);
    } catch (error) {
      logger.error('Ошибка создания цитаты:', error);
      throw error;
    }
  }

  // Обновить цитату
  static async update(updates, options = {}) {
    try {
      const { where } = options;
      if (!where || !where.id) {
        throw new Error('ID цитаты обязателен для обновления');
      }

      return await githubDB.updateInCollection('quotes', where.id, updates);
    } catch (error) {
      logger.error('Ошибка обновления цитаты:', error);
      throw error;
    }
  }

  // Удалить цитату
  static async destroy(options = {}) {
    try {
      const { where } = options;
      if (!where || !where.id) {
        throw new Error('ID цитаты обязателен для удаления');
      }

      return await githubDB.removeFromCollection('quotes', where.id);
    } catch (error) {
      logger.error('Ошибка удаления цитаты:', error);
      throw error;
    }
  }

  // Получить случайную цитату
  static async findOne(options = {}) {
    try {
      const { order } = options;
      
      if (order && order[0] && order[0][0] === 'random') {
        const quotes = await githubDB.findInCollection('quotes');
        if (quotes.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * quotes.length);
        return quotes[randomIndex];
      }
      
      // По умолчанию возвращаем первую цитату
      const quotes = await githubDB.findInCollection('quotes');
      return quotes.length > 0 ? quotes[0] : null;
    } catch (error) {
      logger.error('Ошибка получения случайной цитаты:', error);
      throw error;
    }
  }

  // Подсчитать количество цитат
  static async count(options = {}) {
    try {
      const { where } = options;
      let quotes = await githubDB.findInCollection('quotes');
      
      if (where) {
        Object.keys(where).forEach(key => {
          if (key === 'createdAt' && where[key].$gte) {
            const startDate = where[key].$gte;
            quotes = quotes.filter(quote => new Date(quote.createdAt) >= startDate);
          } else {
            quotes = quotes.filter(quote => quote[key] === where[key]);
          }
        });
      }
      
      return quotes.length;
    } catch (error) {
      logger.error('Ошибка подсчета цитат:', error);
      throw error;
    }
  }

  // Получить статистику цитат
  static async getStats() {
    try {
      const quotes = await githubDB.findInCollection('quotes');
      
      // Статистика по категориям
      const categoryStats = {};
      quotes.forEach(quote => {
        const category = quote.category || 'general';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });
      
      // Топ авторов
      const authorStats = {};
      quotes.forEach(quote => {
        const author = quote.author || 'Неизвестный';
        authorStats[author] = (authorStats[author] || 0) + 1;
      });
      
      // Сортировка авторов по популярности
      const topAuthors = Object.entries(authorStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([author, count]) => ({ author, count }));
      
      return {
        totalQuotes: quotes.length,
        categoryStats,
        topAuthors,
        todayQuotes: quotes.filter(quote => {
          const today = new Date();
          const quoteDate = new Date(quote.createdAt);
          return quoteDate.toDateString() === today.toDateString();
        }).length
      };
    } catch (error) {
      logger.error('Ошибка получения статистики цитат:', error);
      throw error;
    }
  }

  // Поиск цитат
  static async search(query) {
    try {
      const quotes = await githubDB.findInCollection('quotes');
      
      return quotes.filter(quote => 
        quote.text.toLowerCase().includes(query.toLowerCase()) ||
        quote.author.toLowerCase().includes(query.toLowerCase()) ||
        (quote.tags && quote.tags.some(tag => 
          tag.toLowerCase().includes(query.toLowerCase())
        ))
      );
    } catch (error) {
      logger.error('Ошибка поиска цитат:', error);
      throw error;
    }
  }

  // Получить цитаты по категории
  static async findByCategory(category) {
    try {
      return await githubDB.findInCollection('quotes', { category });
    } catch (error) {
      logger.error('Ошибка получения цитат по категории:', error);
      throw error;
    }
  }

  // Получить цитаты по автору
  static async findByAuthor(author) {
    try {
      const quotes = await githubDB.findInCollection('quotes');
      return quotes.filter(quote => 
        quote.author && quote.author.toLowerCase().includes(author.toLowerCase())
      );
    } catch (error) {
      logger.error('Ошибка получения цитат по автору:', error);
      throw error;
    }
  }
}

module.exports = GitHubQuote; 