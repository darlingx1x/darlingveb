# 🚀 DarlingX Web Server

Гибридный веб-сервер для DarlingX: **API Backend + Static File Server**

## 📋 Описание

Этот сервер позволяет:
- ✅ **Сохранить весь существующий сайт** - HTML, CSS, JS остаются без изменений
- ✅ **Добавить мощный API** - современные REST endpoints
- ✅ **Улучшить безопасность** - JWT аутентификация, валидация, rate limiting
- ✅ **Масштабировать функциональность** - легко добавлять новые возможности

## 🏗️ Архитектура

```
darlingx-server/
├── 📁 server/           # Node.js сервер
│   ├── 📁 routes/       # API маршруты
│   ├── 📁 models/       # Модели базы данных
│   ├── 📁 middleware/   # Middleware функции
│   ├── 📁 config/       # Конфигурация
│   └── 📁 utils/        # Утилиты
├── 📁 (корень проекта)  # Ваши существующие файлы
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── ...
```

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
cd server
npm install
```

### 2. Настройка GitHub базы данных
```bash
# Создайте GitHub Personal Access Token
# Перейдите: https://github.com/settings/tokens
# Создайте токен с правами 'repo'

# Настройте окружение
cp config.env.example .env
# Отредактируйте .env файл с вашим GitHub токеном
```

### 3. Проверка репозитория
```bash
# Убедитесь, что репозиторий существует
# https://github.com/darlingx1x/bd
# Файл db.json должен быть в репозитории
```

### 4. Запуск сервера
```bash
# Режим разработки
npm run dev

# Продакшн
npm start
```

Сервер будет доступен по адресу: `http://localhost:3000`

## 🔧 Конфигурация

### Переменные окружения (.env)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=zapom263_quotes
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=100
```

## 📡 API Endpoints

### 🔐 Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `GET /api/auth/profile` - Профиль пользователя

### 📝 Цитаты
- `GET /api/quotes` - Получить все цитаты
- `POST /api/quotes` - Добавить цитату
- `GET /api/quotes/:id` - Получить цитату по ID
- `PUT /api/quotes/:id` - Обновить цитату (админ)
- `DELETE /api/quotes/:id` - Удалить цитату (админ)
- `GET /api/quotes/random/one` - Случайная цитата

### 🧠 Cyber Oracle
- `POST /api/oracle/generate` - Генерировать ответ
- `GET /api/oracle/random` - Случайный ответ
- `GET /api/oracle/stats` - Статистика

### 👨‍💼 Админ-панель
- `GET /api/admin/dashboard` - Дашборд
- `GET /api/admin/users` - Управление пользователями
- `GET /api/admin/quotes` - Модерация цитат
- `GET /api/admin/analytics` - Аналитика

## 🔄 Миграция с PHP

### Замена существующих PHP endpoints:

| Старый PHP | Новый Node.js API |
|------------|-------------------|
| `api/get-quotes.php` | `GET /api/quotes` |
| `api/submit-quote.php` | `POST /api/quotes` |
| `api/logout.php` | `POST /api/auth/logout` |
| `api/user.php` | `GET /api/auth/profile` |

### Обновление фронтенда:

```javascript
// Старый код (PHP)
fetch('/api/get-quotes.php')
  .then(response => response.json())
  .then(data => console.log(data));

// Новый код (Node.js API)
fetch('/api/quotes')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 🛡️ Безопасность

- **JWT аутентификация** - безопасные токены
- **Rate limiting** - защита от DDoS
- **Валидация данных** - проверка входных данных
- **CORS** - настройка доступа
- **Helmet** - защита заголовков
- **SQL injection protection** - через Sequelize

## 📊 Мониторинг

### Логирование
- Все запросы логируются
- Ошибки сохраняются в файлы
- Разные уровни логирования

### Статистика
- Количество запросов
- Популярные цитаты
- Активность пользователей

## 🚀 Развертывание

### Локальное тестирование
```bash
npm run dev
```

### Продакшн
```bash
NODE_ENV=production npm start
```

### Docker (опционально)
```bash
docker build -t darlingx-server .
docker run -p 3000:3000 darlingx-server
```

## 🔧 Разработка

### Структура проекта
```
server/
├── routes/          # API маршруты
│   ├── quotes.js    # Цитаты API
│   ├── auth.js      # Аутентификация
│   ├── admin.js     # Админ-панель
│   └── oracle.js    # Cyber Oracle
├── models/          # Модели данных
│   ├── Quote.js     # Модель цитат
│   └── User.js      # Модель пользователей
├── middleware/      # Middleware
│   ├── auth.js      # JWT аутентификация
│   └── errorHandler.js # Обработка ошибок
└── config/          # Конфигурация
    └── database.js  # Настройки БД
```

### Добавление новых endpoints

1. Создайте новый файл в `routes/`
2. Добавьте маршрут в `server.js`
3. Создайте модель если нужно
4. Добавьте middleware для безопасности

## 🐛 Отладка

### Логи
```bash
# Просмотр логов
tail -f server/logs/combined.log
tail -f server/logs/error.log
```

### Тестирование API
```bash
# Тест здоровья сервера
curl http://localhost:3000/api/health

# Тест получения цитат
curl http://localhost:3000/api/quotes
```

## 📈 Производительность

- **Сжатие ответов** - gzip compression
- **Кэширование** - статические файлы
- **Пул соединений** - оптимизация БД
- **Rate limiting** - защита от перегрузки

## 🔄 Обновления

### Версионирование
- Семантическое версионирование
- Миграции базы данных
- Обратная совместимость API

### Backup
```bash
# Резервная копия базы данных
mysqldump -u username -p zapom263_quotes > backup.sql
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в `server/logs/`
2. Убедитесь в правильности конфигурации
3. Проверьте подключение к базе данных
4. Обратитесь к документации

---

**DarlingX Web Server** - современное решение для вашего сайта! 🚀 