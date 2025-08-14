document.addEventListener('DOMContentLoaded', function () {
    const quotesContainer = document.querySelector('.quotes-container');
    const aboutSection = document.querySelector('.about');

    if (!quotesContainer || !aboutSection) return;

    let currentUser = null;

    // 📦 Создаем форму
    const quoteForm = document.createElement('div');
    quoteForm.className = 'quote-form';
    quoteForm.innerHTML = `
        <h3 class="form-title">Добавить свою цитату</h3>
        <div class="form-field">
            <label for="quoteText">Текст цитаты:</label>
            <textarea id="quoteText" placeholder="Введите текст цитаты..." rows="3"></textarea>
        </div>
        <div class="form-field">
            <label for="quoteAuthor">Автор:</label>
            <input type="text" id="quoteAuthor" placeholder="Имя автора">
        </div>
        <div class="form-actions">
            <button id="saveQuote" class="save-quote-btn">
                <span class="terminal-prefix">$></span> <span>Сохранить цитату</span>
            </button>
        </div>
    `;
    aboutSection.insertBefore(quoteForm, quotesContainer);

    // 🔀 Кнопки переключения
    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'quotes-toggle';
    toggleBtn.innerHTML = `
        <button class="toggle-btn active" data-target="predefined">darlingx's</button>
        <button class="toggle-btn" data-target="custom">community</button>
    `;
    const quotesTitle = aboutSection.querySelector('.about-name');
    if (quotesTitle) {
        aboutSection.insertBefore(toggleBtn, quotesTitle.nextSibling);
    }

    const customQuotesContainer = document.createElement('div');
    customQuotesContainer.className = 'custom-quotes-container';
    customQuotesContainer.innerHTML = '<h3 class="custom-quotes-title">Ваши цитаты</h3>';
    aboutSection.insertBefore(customQuotesContainer, quotesContainer);
    customQuotesContainer.style.display = 'none';

    document.querySelectorAll('.toggle-btn').forEach(button => {
        button.addEventListener('click', function () {
            const target = this.getAttribute('data-target');
            toggleQuotesView(target);
            document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    function closeModal() {
        document.getElementById('authModal').classList.remove('active');
    }
    
    function login() {
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value.trim();
        const msg = document.getElementById('authMessage');
    
        fetch('/admin/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                msg.textContent = '✅ Logged in';
                document.getElementById('authModal').classList.remove('active');
                location.reload();
            } else {
                msg.textContent = data.message || '❌ Login failed';
            }
        })
        .catch(err => {
            msg.textContent = 'Server error: ' + err.message;
        });
    }
    
    function register() {
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value.trim();
        const msg = document.getElementById('authMessage');
    
        fetch('/admin/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                msg.textContent = '✅ Registered. Redirecting...';
                setTimeout(() => {
                    location.href = '/quotes.html';
                }, 1000);
            } else {
                msg.textContent = data.message || '❌ Registration failed';
            }
        })
        .catch(err => {
            msg.textContent = 'Server error: ' + err.message;
        });
    }
    
    // 🔐 Проверка авторизации
    fetch('/api/user.php')
        .then(res => res.json())
        .then(data => {
            if (data.logged_in) {
                currentUser = data.email;
                showUserBar(currentUser);
            }
        });

    // 🎯 При клике на "Сохранить"
    document.getElementById('saveQuote').addEventListener('click', function () {
        if (!currentUser) {
            document.getElementById('authModal').classList.add('active');
            return;
        }
        saveQuote();
    });
    

    function showUserBar(email) {
        const bar = document.createElement('div');
        bar.innerHTML = `👤 ${email} <a href="/api/logout.php" style="color:red;margin-left:10px;">[Выйти]</a>`;
        bar.style.position = 'fixed';
        bar.style.top = '10px';
        bar.style.right = '20px';
        bar.style.color = '#FFD700';
        bar.style.fontFamily = 'VT323, monospace';
        document.body.appendChild(bar);
    }

    function saveQuote() {
        const quoteText = document.getElementById('quoteText').value.trim();
        const quoteAuthor = document.getElementById('quoteAuthor').value.trim() || 'Аноним';

        if (!quoteText) {
            return showNotification('Пожалуйста, введите текст цитаты', 'error');
        }

        fetch('/api/submit-quote.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `text=${encodeURIComponent(quoteText)}&author=${encodeURIComponent(quoteAuthor)}`
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    showNotification('Цитата добавлена!');
                    document.getElementById('quoteText').value = '';
                    document.getElementById('quoteAuthor').value = '';
                    toggleQuotesView('custom');
                    loadCustomQuotes();
                } else {
                    showNotification('Ошибка: ' + data.message, 'error');
                }
            })
            .catch(err => {
                showNotification('Ошибка сети: ' + err.message, 'error');
            });
    }

    function loadCustomQuotes() {
        fetch('/api/get-quotes.php')
            .then(res => res.json())
            .then(data => {
                const container = document.querySelector('.custom-quotes-container');
                container.innerHTML = '<h3 class="custom-quotes-title">Ваши цитаты</h3>';

                if (!data.quotes || data.quotes.length === 0) {
                    const emptyMessage = document.createElement('p');
                    emptyMessage.className = 'empty-quotes-message';
                    emptyMessage.textContent = 'Нет цитат. Добавьте свою первую выше!';
                    container.appendChild(emptyMessage);
                    return;
                }

                data.quotes.forEach(quote => {
                    const quoteItem = document.createElement('div');
                    quoteItem.className = 'quote-item custom-quote';
                    quoteItem.innerHTML = `
                        <p class="quote-text">"${quote.text}"</p>
                        <p class="quote-author">— ${quote.author}</p>
                    `;
                    container.appendChild(quoteItem);
                });
            })
            .catch(err => {
                showNotification('Ошибка загрузки цитат: ' + err.message, 'error');
            });
    }

    function toggleQuotesView(target) {
        if (target === 'custom') {
            quotesContainer.style.display = 'none';
            customQuotesContainer.style.display = 'block';
            loadCustomQuotes();
        } else {
            quotesContainer.style.display = 'block';
            customQuotesContainer.style.display = 'none';
        }
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `quote-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
});
