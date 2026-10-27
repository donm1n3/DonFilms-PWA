const CACHE_NAME = 'donfilms-auto-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Устанавливаем Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Активируем
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// УМНАЯ ЗАГРУЗКА
self.addEventListener('fetch', (e) => {
  // Запросы к GitHub API не трогаем
  if (e.request.url.includes('api.github.com')) return;

  // Если это запрос самой страницы (HTML), всегда сначала идем в интернет
  if (e.request.mode === 'navigate' || e.request.url.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }) // Игнорируем кэш браузера
        .then((response) => {
          // Если скачали новую версию — обновляем кэш
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
          return response;
        })
        .catch(() => caches.match(e.request)) // Если интернета нет — берем из памяти
    );
    return;
  }

  // Остальное (картинки, иконки) грузим как обычно
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
