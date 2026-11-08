// Service worker sederhana untuk mode offline.
// - Halaman (navigasi): jaringan dulu, lalu cadangan dari cache.
// - Aset statis dan data sintetis: cache dulu, lalu jaringan.
const CACHE = "naik-kelas-v1";
const AWAL = [
  "/",
  "/masuk/",
  "/mustahik/",
  "/mustahik/catat/",
  "/pendamping/",
  "/pendamping/detail/",
  "/pendamping/kunjungan/",
  "/pendamping/asesmen/",
  "/pendamping/jadwal/",
  "/manajer/",
  "/data/sintetis.json",
  "/manifest.webmanifest",
  "/ikon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(AWAL.map((u) => c.add(u).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
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
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const salin = res.clone();
          caches.open(CACHE).then((c) => c.put(req, salin));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("/"))),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const salin = res.clone();
            caches.open(CACHE).then((c) => c.put(req, salin));
          }
          return res;
        }),
    ),
  );
});
