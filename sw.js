/* Service Worker ژستینو: آفلاین‌کردن برنامه بعد از اولین باز شدن.
 * هر بار نسخه جدید منتشر می‌کنی، لازم نیست اینجا را عوض کنی؛
 * صفحه اصلی همیشه اول از اینترنت گرفته می‌شود و اگر اینترنت نبود از حافظه. */
const CACHE = 'gestino-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './fonts/vazirmatn.css', './icon-192.png', './apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const putInCache = (request, response) => {
  if (response && response.ok && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // آب‌وهوا، نقشه و ... از اینترنت

  // صفحه اصلی: اول اینترنت، بعد حافظه
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => putInCache('./index.html', res))
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // بقیه فایل‌ها (js، css، عکس‌ها): اول حافظه، بعد اینترنت
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => putInCache(req, res)))
  );
});
