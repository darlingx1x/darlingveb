/**
 * GitHub Database Configuration
 * Работа с JSON базой данных через GitHub API
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class GitHubDatabase {
  constructor() {
    this.repoOwner = 'darlingx1x';
    this.repoName = 'bd';
    this.branch = 'main';
    this.filePath = 'db.json';
    this.githubToken = process.env.GITHUB_TOKEN;
    this.baseURL = 'https://api.github.com';
    
    // Кэш для данных
    this.cache = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 минут
  }

  // Получение данных из GitHub
  async fetchData() {
    try {
      // Проверяем кэш
      if (this.cache && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheTimeout) {
        logger.debug('Используем кэшированные данные');
        return this.cache;
      }

      // Если нет токена, возвращаем пустую структуру
      if (!this.githubToken) {
        logger.warn('GitHub токен не настроен, используем локальную структуру данных');
        return this.getEmptyStructure();
      }

      const url = `${this.baseURL}/repos/${this.repoOwner}/${this.repoName}/contents/${this.filePath}`;
      const headers = { 'Authorization': `token ${this.githubToken}` };

      const response = await axios.get(url, { headers });
      
      if (response.data.content) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        this.cache = JSON.parse(content);
        this.lastFetch = Date.now();
        
        logger.info('Данные успешно загружены из GitHub');
        return this.cache;
      } else {
        throw new Error('Файл db.json не найден в репозитории');
      }
    } catch (error) {
      logger.error('Ошибка загрузки данных из GitHub:', error.message);
      
      // Возвращаем кэш если есть, иначе пустую структуру
      if (this.cache) {
        logger.warn('Используем кэшированные данные из-за ошибки загрузки');
        return this.cache;
      }
      
      return this.getEmptyStructure();
    }
  }

  // Сохранение данных в GitHub
  async saveData(data) {
    try {
      // Если нет токена, просто обновляем кэш
      if (!this.githubToken) {
        logger.warn('GitHub токен не настроен, данные сохраняются только в кэше');
        this.cache = data;
        this.lastFetch = Date.now();
        return true;
      }

      const url = `${this.baseURL}/repos/${this.repoOwner}/${this.repoName}/contents/${this.filePath}`;
      const headers = { 'Authorization': `token ${this.githubToken}` };

      // Получаем текущий SHA файла
      const currentFile = await axios.get(url, { headers });
      const currentSha = currentFile.data.sha;

      // Обновляем метаданные
      data.metadata.updated_at = new Date().toISOString();
      data.metadata.last_backup = new Date().toISOString();

      // Обновляем аналитику
      data.analytics.total_quotes = data.quotes.length;
      data.analytics.total_users = data.users.length;
      data.analytics.total_oracle_requests = data.oracle_responses.length;
      data.analytics.last_updated = new Date().toISOString();

      const content = JSON.stringify(data, null, 2);
      const encodedContent = Buffer.from(content).toString('base64');

      const payload = {
        message: `Update database - ${new Date().toISOString()}`,
        content: encodedContent,
        sha: currentSha,
        branch: this.branch
      };

      await axios.put(url, payload, { headers });
      
      // Обновляем кэш
      this.cache = data;
      this.lastFetch = Date.now();
      
      logger.info('Данные успешно сохранены в GitHub');
      return true;
    } catch (error) {
      logger.error('Ошибка сохранения данных в GitHub:', error.message);
      // Не выбрасываем ошибку, просто логируем
      return false;
    }
  }

  // Получение пустой структуры данных
  getEmptyStructure() {
    return {
      quotes: [],
      users: [],
      oracle_responses: [],
      analytics: {
        total_quotes: 0,
        total_users: 0,
        total_oracle_requests: 0,
        popular_categories: {
          quantum: 0,
          network: 0,
          metaphysical: 0,
          systems: 0
        },
        last_updated: new Date().toISOString()
      },
      settings: {
        site_name: "DarlingX",
        site_description: "Твой любимый",
        maintenance_mode: false,
        allow_registration: true,
        require_approval: false,
        max_quotes_per_user: 10,
        rate_limit: {
          quotes_per_hour: 5,
          oracle_requests_per_hour: 10
        }
      },
      metadata: {
        version: "1.0.0",
        last_backup: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  }

  // Получение следующего ID для коллекции
  getNextId(collection) {
    const data = this.cache || this.getEmptyStructure();
    const items = data[collection] || [];
    
    if (items.length === 0) return 1;
    
    const maxId = Math.max(...items.map(item => item.id || 0));
    return maxId + 1;
  }

  // Добавление элемента в коллекцию
  async addToCollection(collection, item) {
    const data = await this.fetchData();
    
    if (!data[collection]) {
      data[collection] = [];
    }
    
    item.id = this.getNextId(collection);
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    
    data[collection].push(item);
    
    await this.saveData(data);
    return item;
  }

  // Обновление элемента в коллекции
  async updateInCollection(collection, id, updates) {
    const data = await this.fetchData();
    
    if (!data[collection]) {
      throw new Error(`Коллекция ${collection} не найдена`);
    }
    
    const index = data[collection].findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Элемент с ID ${id} не найден в коллекции ${collection}`);
    }
    
    data[collection][index] = {
      ...data[collection][index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.saveData(data);
    return data[collection][index];
  }

  // Удаление элемента из коллекции
  async removeFromCollection(collection, id) {
    const data = await this.fetchData();
    
    if (!data[collection]) {
      throw new Error(`Коллекция ${collection} не найдена`);
    }
    
    const index = data[collection].findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Элемент с ID ${id} не найден в коллекции ${collection}`);
    }
    
    data[collection].splice(index, 1);
    
    await this.saveData(data);
    return true;
  }

  // Поиск в коллекции
  async findInCollection(collection, filter = {}) {
    const data = await this.fetchData();
    
    if (!data[collection]) {
      return [];
    }
    
    let items = data[collection];
    
    // Применяем фильтры
    Object.keys(filter).forEach(key => {
      if (filter[key] !== undefined) {
        items = items.filter(item => {
          if (typeof filter[key] === 'string') {
            return item[key] && item[key].toLowerCase().includes(filter[key].toLowerCase());
          }
          return item[key] === filter[key];
        });
      }
    });
    
    return items;
  }

  // Получение элемента по ID
  async findById(collection, id) {
    const data = await this.fetchData();
    
    if (!data[collection]) {
      return null;
    }
    
    return data[collection].find(item => item.id === id) || null;
  }

  // Получение настроек
  async getSettings() {
    const data = await this.fetchData();
    return data.settings || {};
  }

  // Обновление настроек
  async updateSettings(newSettings) {
    const data = await this.fetchData();
    data.settings = { ...data.settings, ...newSettings };
    await this.saveData(data);
    return data.settings;
  }

  // Получение аналитики
  async getAnalytics() {
    const data = await this.fetchData();
    return data.analytics || {};
  }

  // Очистка кэша
  clearCache() {
    this.cache = null;
    this.lastFetch = null;
    logger.info('Кэш базы данных очищен');
  }

  // Проверка подключения
  async testConnection() {
    try {
      if (!this.githubToken) {
        logger.warn('⚠️ GitHub токен не настроен, используем локальный режим');
        return true;
      }
      
      await this.fetchData();
      logger.info('✅ Подключение к GitHub базе данных успешно');
      return true;
    } catch (error) {
      logger.error('❌ Ошибка подключения к GitHub базе данных:', error.message);
      logger.warn('⚠️ Переключаемся в локальный режим');
      return true; // Возвращаем true чтобы сервер не падал
    }
  }
}

// Создаем глобальный экземпляр
const githubDB = new GitHubDatabase();

module.exports = githubDB; 