// Изменяем функцию в resource-loader.js
function loadPageResources(pageType, options = {}) {
    let resources = [];
    
    // Общие ресурсы
    const commonResources = [
        { type: 'style', url: 'css/style.css' },
        { type: 'script', url: 'js/main.js' }
    ];
    
    // Получаем текущий URL
    const currentUrl = options.url || window.location.href;
    console.log(`Loading resources for page type: ${pageType}, URL: ${currentUrl}`);
    
    // Добавляем специфичные ресурсы
    switch (pageType) {
        case 'books':
            resources = [
                ...commonResources,
                { type: 'style', url: 'css/books.css' },
                { type: 'script', url: 'js/books.js' }
            ];
            break;
        case 'book-details':
            resources = [
                ...commonResources,
                { type: 'style', url: 'css/book-details.css' },
                { type: 'script', url: 'js/book-details.js' }
            ];
            break;
        case 'posts':
            resources = [
                ...commonResources,
                { type: 'style', url: 'css/posts.css' }
            ];
            break;
        case 'open-questions':
            // Специальный случай для open-questions.html
            resources = [
                ...commonResources,
                { type: 'style', url: 'css/posts.css' },
                { type: 'style', url: 'css/simple-posts.css' },
                { type: 'script', url: 'js/cyber-oracle.js' }
            ];
            break;
        default:
            resources = commonResources;
    }
    
    // Всегда инвалидируем кэш перед загрузкой новых ресурсов
    invalidateCache('all');
    
    return loadAll(resources, options);
}

// Изменяем функцию в page-transition.js
function getPageTypeFromDocument(doc, url) {
    if (!doc) return 'home';
    
    // Проверяем URL для точного определения
    if (url.includes('books.html')) return 'books';
    if (url.includes('book-details.html')) return 'book-details';
    if (url.includes('posts.html')) return 'posts';
    if (url.includes('open-questions.html')) return 'open-questions';
    if (url.includes('lists.html')) return 'lists';
    if (url.includes('projects.html')) return 'projects';
    if (url.includes('cv.html')) return 'cv';
    
    // Проверяем DOM если URL не дал результатов
    if (doc.querySelector('.books-grid')) return 'books';
    if (doc.querySelector('.book-details')) return 'book-details';
    if (doc.querySelector('.post-grid')) return 'posts';
    if (doc.querySelector('.article-content')) return 'open-questions';
    
    return 'home';
}

// Добавляем в loadPage функцию принудительной инициализации
function loadPage(url, updateHistory = true) {
    // Показываем индикатор загрузки
    showLoader();
    document.body.classList.add('page-loading');
    
    // Определяем тип страницы из URL (предварительное определение)
    const prelimPageType = getPageTypeFromUrl(url);
    console.log(`Preliminary page type from URL: ${prelimPageType}`);
    
    // Затухание контента
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.classList.add('page-transition-fade-out');
    }
    
    // Загружаем страницу
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Парсим HTML
            const parser = new DOMParser();
            const newDocument = parser.parseFromString(html, 'text/html');
            
            // Получаем тип страницы
            const pageType = getPageTypeFromDocument(newDocument, url);
            console.log(`Detected page type: ${pageType} for URL: ${url}`);
            
            // Загружаем ресурсы с указанием URL
            return window.ResourceLoader.loadPageResources(pageType, { url: url, cache: false })
                .then(() => {
                    // Обновляем заголовок
                    document.title = newDocument.title;
                    
                    // Обновляем контент после затухания
                    setTimeout(() => {
                        if (mainContent && newDocument.querySelector('main')) {
                            mainContent.innerHTML = newDocument.querySelector('main').innerHTML;
                            mainContent.classList.remove('page-transition-fade-out');
                            mainContent.classList.add('page-transition-fade-in');
                            
                            // Запускаем появление
                            setTimeout(() => {
                                mainContent.classList.remove('page-transition-fade-in');
                                
                                // Инициализируем обработчики
                                initializePageHandlers(pageType, url);
                                
                                // Скрываем индикаторы загрузки
                                document.body.classList.remove('page-loading');
                                hideLoader();
                            }, 50);
                        } else {
                            // Если элементы не найдены - перезагружаем страницу
                            window.location.href = url;
                        }
                    }, 300);
                });
        })
        .catch(error => {
            console.error('Error loading page:', error);
            
            // Скрываем индикаторы
            document.body.classList.remove('page-loading');
            hideLoader();
            
            // Стандартная навигация при ошибке
            window.location.href = url;
        });
}

// Новая функция для инициализации страницы по типу
function initializePageHandlers(pageType, url) {
    console.log(`Initializing handlers for ${pageType} (${url})`);
    
    // Обработка по типу страницы
    switch (pageType) {
        case 'books':
            if (typeof window.initializeBooksGrid === 'function') {
                window.initializeBooksGrid();
            }
            break;
        case 'book-details':
            if (typeof window.displayBookDetails === 'function') {
                window.displayBookDetails();
            }
            break;
        case 'open-questions':
            // Принудительно загружаем cyber-oracle.js если он еще не загружен
            if (typeof window.cyber_oracle_initialized === 'undefined') {
                console.log('Manually loading cyber-oracle.js');
                const scriptElem = document.createElement('script');
                scriptElem.src = 'js/cyber-oracle.js?' + Date.now(); // Кэш-бастинг
                scriptElem.onload = function() {
                    window.cyber_oracle_initialized = true;
                    console.log('cyber-oracle.js loaded successfully');
                };
                document.head.appendChild(scriptElem);
            }
            break;
    }
    
    // Общие инициализации для всех страниц
    ensureImagesSize();
}

// Определение типа страницы по URL
function getPageTypeFromUrl(url) {
    if (url.includes('books.html')) return 'books';
    if (url.includes('book-details.html')) return 'book-details';
    if (url.includes('posts.html')) return 'posts';
    if (url.includes('open-questions.html')) return 'open-questions';
    if (url.includes('lists.html')) return 'lists';
    if (url.includes('projects.html')) return 'projects';
    if (url.includes('cv.html')) return 'cv';
    return 'home';
}