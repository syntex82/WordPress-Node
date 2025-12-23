/**
 * PWA Plugin - Progressive Web App Support
 */
var defaultSettings = {
  appName: 'WordPress Node',
  shortName: 'WP Node',
  description: 'Modern WordPress Node CMS',
  themeColor: '#4f46e5',
  backgroundColor: '#1e293b',
  display: 'standalone',
  orientation: 'any',
  startUrl: '/',
  offlineEnabled: true,
  pushNotifications: false,
  cacheStrategy: 'networkFirst',
};
var settings = Object.assign({}, defaultSettings);

function generateManifest(req) {
  var baseUrl = req.protocol + '://' + req.get('host');
  return {
    name: settings.appName, short_name: settings.shortName, description: settings.description,
    start_url: settings.startUrl, display: settings.display, orientation: settings.orientation,
    theme_color: settings.themeColor, background_color: settings.backgroundColor,
    icons: [
      { src: baseUrl + '/pwa/icons/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'any maskable' },
      { src: baseUrl + '/pwa/icons/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any maskable' },
      { src: baseUrl + '/pwa/icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any maskable' },
      { src: baseUrl + '/pwa/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: baseUrl + '/pwa/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    categories: ['productivity'], prefer_related_applications: false,
  };
}

function generateServiceWorker() {
  var sw = 'var CACHE="wp-node-v1";var OFFLINE="/offline";';
  sw += 'self.addEventListener("install",function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(["/","/offline","/manifest.json"])}).then(function(){return self.skipWaiting()}))});';
  sw += 'self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==CACHE}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});';
  sw += 'self.addEventListener("fetch",function(e){if(e.request.method!=="GET")return;var u=new URL(e.request.url);if(u.pathname.startsWith("/api/")||u.pathname.startsWith("/socket.io"))return;e.respondWith(fetch(e.request).then(function(r){if(r.status===200){var rc=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,rc)})}return r}).catch(function(){return caches.match(e.request).then(function(c){return c||caches.match(OFFLINE)})}))});';
  sw += 'self.addEventListener("push",function(e){var d=e.data?e.data.json():{title:"WordPress Node",body:"New notification"};e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:"/pwa/icons/icon-192x192.png"}))});';
  sw += 'self.addEventListener("notificationclick",function(e){e.notification.close();if(e.notification.data&&e.notification.data.url)e.waitUntil(clients.openWindow(e.notification.data.url))});';
  return sw;
}

function generateOfflinePage() {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1e293b;font-family:system-ui;color:#f1f5f9;text-align:center}h1{margin-bottom:1rem}button{background:#4f46e5;color:white;border:none;padding:.75rem 1.5rem;border-radius:8px;cursor:pointer}</style></head><body><div><h1>You\'re Offline</h1><p>Check your connection and try again.</p><br><button onclick="location.reload()">Retry</button></div></body></html>';
}

function registerRoutes(app) {
  app.get('/manifest.json', function(req, res) { res.setHeader('Content-Type', 'application/manifest+json'); res.json(generateManifest(req)); });
  app.get('/sw.js', function(req, res) { res.setHeader('Content-Type', 'application/javascript'); res.setHeader('Service-Worker-Allowed', '/'); res.send(generateServiceWorker()); });
  app.get('/offline', function(req, res) { res.setHeader('Content-Type', 'text/html'); res.send(generateOfflinePage()); });
  app.get('/pwa/icons/:filename', function(req, res) {
    var size = parseInt((req.params.filename.match(/\d+/) || ['192'])[0]);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+size+' '+size+'"><rect width="'+size+'" height="'+size+'" fill="'+settings.themeColor+'" rx="'+Math.round(size*0.15)+'"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-family="system-ui" font-weight="bold" font-size="'+Math.round(size*0.4)+'">WN</text></svg>';
    res.setHeader('Content-Type', 'image/svg+xml'); res.send(svg);
  });
  app.get('/api/pwa/settings', function(req, res) { res.json(settings); });
  app.post('/api/pwa/settings', function(req, res) { settings = Object.assign({}, settings, req.body); res.json({ success: true, settings: settings }); });
  app.post('/api/pwa/subscribe', function(req, res) { console.log('PWA: Push subscription received'); res.json({ success: true }); });
  console.log('PWA routes registered');
}

module.exports = {
  onActivate: function() { console.log('PWA Plugin activated'); return Promise.resolve(); },
  onDeactivate: function() { console.log('PWA Plugin deactivated'); return Promise.resolve(); },
  registerRoutes: registerRoutes,
  getSettings: function() { return settings; },
  updateSettings: function(s) { settings = Object.assign({}, settings, s); return settings; },
};
