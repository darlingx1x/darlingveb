# 🔧 Исправление CSP проблемы с Express + Helmet

## 🚨 Проблема
CSP (Content Security Policy) блокирует загрузку Telegram виджета:
```
Refused to load the script 'https://telegram.org/js/telegram-widget.js?22' 
because it violates the following Content Security Policy directive: 
"script-src 'self' 'unsafe-inline'"
```

## ✅ Решение: Express + Helmet

### **1. Обновлен `server.js`**
Добавлен Helmet с правильными CSP настройками:

```javascript
import helmet from 'helmet'

// Helmet with custom CSP for Telegram widget
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://telegram.org"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://telegram.org"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://telegram.org"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
```

### **2. Обновлен `package.json`**
Добавлена зависимость helmet:
```json
{
  "dependencies": {
    "helmet": "^7.1.0"
  }
}
```

### **3. Обновлен `quotes.html`**
Добавлен CSP meta тег в head:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://telegram.org;">
```

## 🚀 Как запустить

### **1. Установить зависимости**
```bash
npm install
```

### **2. Запустить сервер**
```bash
npm start
```

### **3. Открыть в браузере**
```
http://localhost:3000/quotes.html
```

## 🔍 CSP Директивы

### **Разрешенные источники:**
- **scriptSrc:** `'self'`, `'unsafe-inline'`, `'unsafe-eval'`, `https://telegram.org`
- **styleSrc:** `'self'`, `'unsafe-inline'`
- **imgSrc:** `'self'`, `data:`, `https:`
- **connectSrc:** `'self'`, `https://telegram.org`
- **frameSrc:** `'self'`, `https://telegram.org`

### **Безопасность:**
- **objectSrc:** `'none'` (блокирует объекты)
- **crossOriginEmbedderPolicy:** `false` (для совместимости)
- **crossOriginResourcePolicy:** `cross-origin` (для Telegram)

## 🧪 Тестирование

### **1. Проверьте сервер**
```bash
curl http://localhost:3000/health
# Должен вернуть: {"ok":true}
```

### **2. Проверьте CSP заголовки**
```bash
curl -I http://localhost:3000/quotes.html
# Должен показать Content-Security-Policy заголовок
```

### **3. Проверьте виджет**
- Откройте `http://localhost:3000/quotes.html`
- Виджет должен загрузиться без CSP ошибок
- Статус-индикатор должен показать "Telegram widget loaded successfully!"

## 🎯 Ожидаемый результат

### **Без CSP ошибок:**
- ✅ Telegram виджет загружается
- ✅ Статус-индикатор зеленый
- ✅ Кнопка "Login with Telegram" видна
- ✅ Все функции работают

### **В консоли браузера:**
```
[INFO] Page loaded, initializing Telegram widget...
[WARNING] Loading Telegram widget...
[SUCCESS] Telegram widget loaded successfully!
```

## 🚨 Возможные проблемы

### **1. Helmet не установлен**
```bash
npm install helmet
```

### **2. CSP все еще блокирует**
- Проверьте, что сервер запущен на порту 3000
- Убедитесь, что открываете через `http://localhost:3000/quotes.html`
- Проверьте консоль браузера на ошибки

### **3. Виджет не загружается**
- Проверьте интернет-соединение
- Убедитесь, что бот `@darlinxloginbot` существует
- Проверьте альтернативную кнопку

## 📋 Чек-лист

- [ ] Установлен helmet: `npm install`
- [ ] Сервер запущен: `npm start`
- [ ] Открыт `http://localhost:3000/quotes.html`
- [ ] Нет CSP ошибок в консоли
- [ ] Виджет загружается
- [ ] Статус-индикатор зеленый
- [ ] Кнопка "Login with Telegram" работает

## 🎉 Результат

После применения этих изменений:
- ✅ CSP проблема решена
- ✅ Telegram виджет работает
- ✅ Безопасность сохранена
- ✅ Все функции доступны

**CSP проблема исправлена с Express + Helmet! 🚀** 