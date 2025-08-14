const CACHE_NAME = 'darlingx-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/404.html',
  '/books.html',
  '/book-details.html',
  '/cv.html',
  '/lists.html',
  '/my-time.html',
  '/offline.html',
  '/open-questions.html',
  '/posts.html',
  '/project-detail.html',
  '/projects.html',
  '/quotes.html',
  '/register.html',
  '/css/style.css',
  '/css/time.css',
  '/css/books.css',
  '/css/posts.css',
  '/css/projects.css',
  '/css/simple-posts.css',
  '/css/subdomain.css',
  '/js/time.js',
  '/js/matrix-animation.js',
  '/js/page-transition.js',
  '/js/main.js',
  '/js/books.js',
  '/js/cyber-oracle.js',
  '/js/resource-loader.js',
  '/icon32.png',
  '/icon180.png',
  '/darling.webp',
  '/css/fonts.css',
  '/fonts/VT323-Regular.woff2'
];

// Установка Service Worker и кэширование ресурсов
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Cache addAll error:', error);
          throw error;
        });
      })
  );
});

// Активация Service Worker и очистка старых кэшей
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Стратегия кэширования: сначала кэш, потом сеть с fallback на offline.html
self.addEventListener('fetch', event => {
  // Пропускаем запросы к chrome-extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Создаем копию ответа для кэша
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Если запрос не удался и это HTML страница, показываем offline.html
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            // Для других ресурсов возвращаем ошибку
            throw new Error('Network error');
          });
      })
  );
}); 