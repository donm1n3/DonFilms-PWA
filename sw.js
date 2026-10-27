const CACHE_NAME = 'donfilms-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Устанавливаем Service Worker и кэшируем основные файлы
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Активируем и удаляем старые кэши, если версия обновилась
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

// Стратегия загрузки: сначала сеть, если упала — кэш
// (чтобы данные из GitHub всегда были свежими, когда есть интернет)
self.addEventListener('fetch', (e) => {
  // Не кэшируем запросы к API GitHub (синхронизация должна идти только по сети)
  if (e.request.url.includes('api.github.com')) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Если запрос успешен, обновляем кэш
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone);
        });
        return response;
      })
      .catch(() => caches.match(e.request)) // Если сети нет, берем из кэша
  );
});