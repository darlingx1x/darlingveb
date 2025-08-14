/**
 * Cyber Oracle API Routes
 * API для интерактивного философского генератора
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ========================================
// 🧠 ГЕНЕРАЦИЯ ОТВЕТА ОРАКУЛА
// ========================================

/**
 * POST /api/oracle/generate
 * Генерировать ответ оракула на вопрос
 */
router.post('/generate', [
  body('question')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Вопрос должен быть от 1 до 500 символов'),
  body('category')
    .optional()
    .isIn(['quantum', 'network', 'metaphysical', 'systems', 'random'])
    .withMessage('Неверная категория')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { question, category = 'random' } = req.body;

    // Генерация ответа на основе категории
    const response = await generateOracleResponse(question, category);

    // Логирование запроса
    logger.info(`Oracle request: "${question}" -> ${category}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });

    res.json({
      status: 'success',
      response: {
        question: question.trim(),
        answer: response.answer,
        category: response.category,
        animation: response.animation,
        sound: response.sound,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Ошибка генерации ответа оракула:', error);
    next(new AppError('Ошибка генерации ответа', 500));
  }
});

// ========================================
// 📊 СТАТИСТИКА ОРАКУЛА
// ========================================

/**
 * GET /api/oracle/stats
 * Получить статистику использования оракула
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Здесь можно добавить логику получения статистики
    // Например, количество запросов, популярные категории и т.д.
    
    res.json({
      status: 'success',
      stats: {
        totalRequests: 0,
        categories: {
          quantum: 0,
          network: 0,
          metaphysical: 0,
          systems: 0
        },
        popularQuestions: []
      }
    });

  } catch (error) {
    logger.error('Ошибка получения статистики оракула:', error);
    next(new AppError('Ошибка получения статистики', 500));
  }
});

// ========================================
// 🎲 СЛУЧАЙНЫЙ ОТВЕТ
// ========================================

/**
 * GET /api/oracle/random
 * Получить случайный ответ оракула
 */
router.get('/random', async (req, res, next) => {
  try {
    const categories = ['quantum', 'network', 'metaphysical', 'systems'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    const response = await generateOracleResponse('Случайная мудрость', randomCategory);

    res.json({
      status: 'success',
      response: {
        answer: response.answer,
        category: response.category,
        animation: response.animation,
        sound: response.sound,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Ошибка получения случайного ответа:', error);
    next(new AppError('Ошибка получения случайного ответа', 500));
  }
});

// ========================================
// 🔧 УТИЛИТЫ
// ========================================

/**
 * Генерация ответа оракула
 */
async function generateOracleResponse(question, category) {
  const responses = {
    quantum: [
      "В квантовом мире все состояния существуют одновременно, пока не произведено наблюдение. Так и твое сознание существует во множестве возможных конфигураций.",
      "Граница между прошлым и настоящим размывается в потоке квантовых флуктуаций сознания. Идентичность — это лишь вероятностное распределение в нейронной сети.",
      "Квантовая запутанность показывает, что все частицы связаны на фундаментальном уровне. Так и твои мысли связаны с мыслями всего человечества.",
      "В суперпозиции состояний заключена истинная природа реальности. Каждое решение создает новую ветвь вселенной."
    ],
    network: [
      "В цифровом веке мы стали нодами в глобальной сети. Индивидуальность — всего лишь уникальная комбинация связей.",
      "За каждым решением скрыт невидимый алгоритм, сформированный миллионами итераций опыта. Осознанность — это лишь дебаггер сознания.",
      "Информация течет по нейронным путям как электрические импульсы по проводам. Мы — живые компьютеры, обрабатывающие реальность.",
      "Сеть связей определяет нашу сущность больше, чем индивидуальные узлы. Мы — продукт коллективного разума."
    ],
    metaphysical: [
      "Реальность — всего лишь согласованная иллюзия, симуляция, основанная на ограниченном восприятии сенсорных данных.",
      "Человечество движется к сингулярности, где границы между разумом и технологией исчезнут. Эволюция сознания неизбежна.",
      "Время — это не стрела, а река, в которой мы плывем. Прошлое и будущее существуют одновременно в вечном настоящем.",
      "Сознание — это не продукт мозга, а фундаментальное свойство вселенной. Мы — способ, которым космос познает себя."
    ],
    systems: [
      "Парадоксы не ошибки, а точки бифуркации системы. В них заключен потенциал для качественного скачка развития.",
      "Расширение пространства мыслей требует перепрограммирования ментальной архитектуры. Новые концепции рождаются на пересечении существующих систем.",
      "Каждая система стремится к равновесию, но именно дисбаланс создает движение и развитие. Хаос — это порядок более высокого уровня.",
      "Сложность рождается из простых правил, повторяющихся бесконечно. Мы — результат эволюции простых алгоритмов."
    ]
  };

  const categoryResponses = category === 'random' ? 
    responses[Object.keys(responses)[Math.floor(Math.random() * Object.keys(responses).length)]] :
    responses[category] || responses.quantum;

  const answer = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];

  const animations = {
    quantum: { speed: 25, style: 'quantum', glowColor: "0, 191, 255" },
    network: { speed: 30, style: 'network', glowColor: "80, 200, 120" },
    metaphysical: { speed: 35, style: 'metaphysical', glowColor: "147, 112, 219" },
    systems: { speed: 28, style: 'systems', glowColor: "255, 69, 0" }
  };

  const sounds = {
    quantum: "quantum",
    network: "digital", 
    metaphysical: "ethereal",
    systems: "mechanical"
  };

  return {
    answer,
    category: category === 'random' ? Object.keys(responses)[Math.floor(Math.random() * Object.keys(responses).length)] : category,
    animation: animations[category] || animations.quantum,
    sound: sounds[category] || sounds.quantum
  };
}

module.exports = router; 