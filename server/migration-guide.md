# 🔄 Руководство по миграции DarlingX

## 📋 Обзор миграции

Этот документ поможет вам плавно перейти от PHP к Node.js API, **сохранив весь существующий функционал**.

## 🎯 Что изменится

### ✅ Что ОСТАНЕТСЯ без изменений:
- Все HTML файлы
- Все CSS стили
- Все JavaScript анимации и эффекты
- Все изображения и ресурсы
- PWA функциональность
- Service Worker

### 🔄 Что нужно ОБНОВИТЬ:
- API вызовы (замена PHP endpoints на Node.js API)
- Аутентификация (JWT вместо сессий)
- Обработка ошибок

## 📝 Пошаговая миграция

### Шаг 1: Подготовка сервера

1. **Установите зависимости:**
```bash
cd server
npm install
```

2. **Настройте окружение:**
```bash
cp config.env.example .env
# Отредактируйте .env с вашими данными БД
```

3. **Запустите сервер:**
```bash
npm run dev
```

### Шаг 2: Обновление API вызовов

#### 📝 Цитаты (quotes.html)

**Было (PHP):**
```javascript
// Загрузка цитат
fetch('/api/get-quotes.php')
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      displayQuotes(data.quotes);
    }
  });

// Добавление цитаты
fetch('/api/submit-quote.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `text=${encodeURIComponent(text)}&author=${encodeURIComponent(author)}`
})
```

**Стало (Node.js):**
```javascript
// Загрузка цитат
fetch('/api/quotes')
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      displayQuotes(data.quotes);
    }
  });

// Добавление цитаты
fetch('/api/quotes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, author })
})
```

#### 🔐 Аутентификация

**Было (PHP):**
```javascript
// Проверка авторизации
fetch('/api/user.php')
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      showUserPanel(data.user);
    }
  });

// Выход
fetch('/api/logout.php')
  .then(() => window.location.reload());
```

**Стало (Node.js):**
```javascript
// Проверка авторизации
const token = localStorage.getItem('authToken');
if (token) {
  fetch('/api/auth/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      showUserPanel(data.user);
    }
  });
}

// Выход
fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(() => {
  localStorage.removeItem('authToken');
  window.location.reload();
});
```

### Шаг 3: Обновление файлов

#### 1. Обновите `js/auth.js`:

```javascript
// Новый auth.js
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = null;
  }

  async login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', this.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка сети' };
    }
  }

  async register(username, email, password) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', this.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Ошибка сети' };
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    window.location.reload();
  }

  isAuthenticated() {
    return !!this.token;
  }

  getAuthHeaders() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }
}

// Глобальный экземпляр
window.authManager = new AuthManager();
```

#### 2. Обновите `js/quotes-custom.js`:

```javascript
// Новый quotes-custom.js
class QuotesManager {
  constructor() {
    this.quotes = [];
    this.currentPage = 1;
    this.loading = false;
  }

  async loadQuotes(page = 1, search = '') {
    if (this.loading) return;
    
    this.loading = true;
    this.showLoading();

    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.append('search', search);

      const response = await fetch(`/api/quotes?${params}`);
      const data = await response.json();

      if (data.status === 'success') {
        this.quotes = data.quotes;
        this.currentPage = data.pagination.currentPage;
        this.displayQuotes();
        this.updatePagination(data.pagination);
      } else {
        this.showError('Ошибка загрузки цитат');
      }
    } catch (error) {
      this.showError('Ошибка сети');
    } finally {
      this.loading = false;
      this.hideLoading();
    }
  }

  async addQuote(text, author) {
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, author })
      });

      const data = await response.json();

      if (data.status === 'success') {
        this.showSuccess('Цитата добавлена успешно!');
        this.loadQuotes(); // Перезагружаем список
        return true;
      } else {
        this.showError(data.message || 'Ошибка добавления цитаты');
        return false;
      }
    } catch (error) {
      this.showError('Ошибка сети');
      return false;
    }
  }

  displayQuotes() {
    const container = document.querySelector('.quotes-container');
    if (!container) return;

    container.innerHTML = this.quotes.map(quote => `
      <div class="quote-item">
        <div class="quote-text">${this.escapeHtml(quote.text)}</div>
        <div class="quote-author">— ${this.escapeHtml(quote.author)}</div>
        <div class="quote-date">${new Date(quote.created_at).toLocaleDateString()}</div>
      </div>
    `).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showLoading() {
    // Показать индикатор загрузки
  }

  hideLoading() {
    // Скрыть индикатор загрузки
  }

  showSuccess(message) {
    // Показать уведомление об успехе
  }

  showError(message) {
    // Показать уведомление об ошибке
  }

  updatePagination(pagination) {
    // Обновить пагинацию
  }
}

// Глобальный экземпляр
window.quotesManager = new QuotesManager();
```

### Шаг 4: Обновление HTML файлов

#### Обновите `quotes.html`:

```html
<!-- Добавьте в head -->
<script src="js/auth.js"></script>
<script src="js/quotes-custom.js"></script>

<!-- Обновите форму добавления цитаты -->
<form id="quoteForm" onsubmit="handleQuoteSubmit(event)">
  <input type="text" id="quoteText" placeholder="Текст цитаты" required>
  <input type="text" id="quoteAuthor" placeholder="Автор" required>
  <button type="submit">Добавить цитату</button>
</form>

<script>
// Обработчик отправки формы
async function handleQuoteSubmit(event) {
  event.preventDefault();
  
  const text = document.getElementById('quoteText').value;
  const author = document.getElementById('quoteAuthor').value;
  
  const success = await window.quotesManager.addQuote(text, author);
  
  if (success) {
    event.target.reset();
  }
}

// Загрузка цитат при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  window.quotesManager.loadQuotes();
});
</script>
```

### Шаг 5: Тестирование

1. **Запустите сервер:**
```bash
cd server
npm run dev
```

2. **Откройте сайт:**
```
http://localhost:3000
```

3. **Проверьте функциональность:**
- Загрузка цитат
- Добавление новых цитат
- Аутентификация
- Админ-панель

## 🔧 Дополнительные улучшения

### 1. Добавьте обработку ошибок:

```javascript
// utils/api.js
class ApiClient {
  static async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...window.authManager.getAuthHeaders(),
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка запроса');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}
```

### 2. Добавьте индикаторы загрузки:

```javascript
// utils/ui.js
class UI {
  static showLoading(element) {
    element.innerHTML = '<div class="loading">Загрузка...</div>';
  }

  static showError(element, message) {
    element.innerHTML = `<div class="error">${message}</div>`;
  }

  static showSuccess(element, message) {
    element.innerHTML = `<div class="success">${message}</div>`;
  }
}
```

## 🚀 Продакшн развертывание

### 1. Настройте переменные окружения:
```env
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
JWT_SECRET=your-super-secure-jwt-secret
```

### 2. Запустите сервер:
```bash
npm start
```

### 3. Настройте Nginx (опционально):
```nginx
server {
    listen 80;
    server_name darlingx.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## ✅ Чек-лист миграции

- [ ] Установлены зависимости Node.js
- [ ] Настроен файл .env
- [ ] Обновлены API вызовы в JavaScript
- [ ] Обновлена аутентификация
- [ ] Протестирована функциональность
- [ ] Настроен продакшн
- [ ] Созданы резервные копии

## 🆘 Поддержка

При возникновении проблем:

1. **Проверьте логи сервера:**
```bash
tail -f server/logs/combined.log
```

2. **Проверьте консоль браузера** на ошибки JavaScript

3. **Проверьте Network tab** в DevTools для API запросов

4. **Убедитесь в правильности конфигурации** базы данных

---

**Удачи с миграцией!** 🚀 Ваш сайт станет еще лучше! ✨ 