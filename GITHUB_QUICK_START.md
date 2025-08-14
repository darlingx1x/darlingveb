# 🚀 Быстрый старт с GitHub базой данных

## ⚡ За 3 минуты к работающему серверу!

### 1️⃣ Создание GitHub токена
1. Перейдите: https://github.com/settings/tokens
2. Нажмите "Generate new token (classic)"
3. Настройте:
   - **Note:** `DarlingX Database Token`
   - **Expiration:** `No expiration`
   - **Scopes:** ✅ `repo`
4. Скопируйте токен (начинается с `ghp_`)

### 2️⃣ Настройка проекта
```bash
cd server
npm install
cp config.env.example .env
```

Отредактируйте `.env`:
```env
GITHUB_TOKEN=ghp_your_actual_token_here
GITHUB_REPO_OWNER=darlingx1x
GITHUB_REPO_NAME=bd
GITHUB_BRANCH=main
```

### 3️⃣ Запуск сервера
```bash
npm run dev
```

### 4️⃣ Проверка работы
Откройте в браузере:
- 🌐 **Сайт**: http://localhost:3000
- 🔗 **API**: http://localhost:3000/api
- 📊 **Статус**: http://localhost:3000/api/health

## ✅ Готово!

Ваш сайт теперь работает с:
- ✅ **GitHub базой данных** - все данные в [db.json](https://github.com/darlingx1x/bd/blob/main/db.json)
- ✅ **Версионностью** - все изменения отслеживаются в Git
- ✅ **Автоматическими резервными копиями** - в GitHub
- ✅ **Современным API** - REST endpoints

## 🔧 Что дальше?

1. **Просмотрите базу данных**: https://github.com/darlingx1x/bd/blob/main/db.json
2. **Проверьте логи**: `tail -f server/logs/combined.log`
3. **Изучите API**: http://localhost:3000/api

## 🚨 Если что-то не работает

### Ошибка "Not Found":
- Проверьте правильность токена
- Убедитесь, что репозиторий https://github.com/darlingx1x/bd существует

### Ошибка "Bad credentials":
- Проверьте правильность токена
- Убедитесь, что токен не истек

### Медленная работа:
- Проверьте интернет соединение
- Данные кэшируются на 5 минут

---

**Подробная документация**: `GITHUB_SETUP.md` 📚 