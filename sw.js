// Service worker: deixa a aula funcionar sem internet depois da primeira visita
// (útil se a rede da escola cair no meio da aula).
// Estratégia: sempre tenta a rede primeiro; só usa a cópia guardada se a rede falhar.
// Assim, qualquer edição no conteúdo aparece na hora.

const CACHE = "aula-ditadura-v3";
const ARQUIVOS = [
  "./",
  "index.html",
  "presenter.html",
  "css/fonts.css",
  "css/base.css",
  "css/slides.css",
  "css/presenter.css",
  "js/main.js",
  "js/util.js",
  "js/render.js",
  "js/deck.js",
  "js/fx.js",
  "js/tv.js",
  "js/som.js",
  "js/sync.js",
  "js/presenter.js",
  "content/slides.json",
  "content/fontes.json",
  "content/vitimas.json",
  "assets/fotos/rubens-paiva.jpg",
  "assets/fotos/vladimir-herzog.jpg",
  "assets/fotos/herzog-laudo-1975.jpg",
  "assets/fotos/zuzu-angel.jpg",
  "assets/fotos/carlos-marighella.jpg",
  "assets/fonts/big-shoulders-display-normal-latin.woff2",
  "assets/fonts/big-shoulders-display-normal-latin-ext.woff2",
  "assets/fonts/newsreader-normal-latin.woff2",
  "assets/fonts/newsreader-normal-latin-ext.woff2",
  "assets/fonts/newsreader-italic-latin.woff2",
  "assets/fonts/newsreader-italic-latin-ext.woff2",
  "assets/fonts/courier-prime-400-latin.woff2",
  "assets/fonts/courier-prime-400-latin-ext.woff2",
  "assets/fonts/courier-prime-700-latin.woff2",
  "assets/fonts/courier-prime-700-latin-ext.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(ARQUIVOS.map((u) => c.add(u).catch(() => {})))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok && resp.type === "basic") {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return resp;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || Response.error())),
  );
});
