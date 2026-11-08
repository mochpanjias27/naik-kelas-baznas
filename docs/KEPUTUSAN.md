# Catatan Keputusan Teknis

Setiap keputusan yang ambigu diambil dengan opsi paling sederhana yang tetap memenuhi spesifikasi.

| # | Keputusan | Alasan |
|---|---|---|
| 1 | **Next.js dengan static export** (`output: "export"`) di akar repo. | Deploy ke Vercel tanpa konfigurasi; mudah di-cache untuk mode luring; tanpa server yang perlu dirawat. |
| 2 | **Mesin matematika ganda: Python (rujukan) + TypeScript (aplikasi)**. | Spesifikasi meminta modul Python teruji, tetapi aplikasi harus offline-first dan Vercel (static) tidak menjalankan Python. Konsistensi dijamin oleh uji silang fixture (selisih < 1e-12). |
| 3 | FastAPI di `backend/` bersifat **opsional**: endpoint matematika, `/sinkron` ke SQLite, dan `/audit`. | Memenuhi tumpukan teknologi yang diminta tanpa membuat demo Vercel bergantung pada server. Aktif bila `NEXT_PUBLIC_API_URL` diisi. |
| 4 | Tanpa `NEXT_PUBLIC_API_URL`, sinkronisasi **disimulasikan** dan diberi label "Tersinkron (simulasi)". | Jujur terhadap pengguna; alur luring → daring tetap dapat didemonstrasikan. |
| 5 | Autentikasi demo = pemilihan peran tanpa kata sandi; backend memakai header `X-Peran`. | Prototipe riset tanpa data identitas; autentikasi produksi di luar cakupan. Halaman tetap diproteksi per peran. |
| 6 | Penyimpanan lokal: IndexedDB (catatan, kunjungan, asesmen, lampiran foto/suara, log audit); localStorage (sesi, riwayat parameter). | Sederhana, tersedia di semua peramban modern, dan mendukung kerja luring. |
| 7 | Rute detail memakai *query string* (`/pendamping/detail/?id=M001`), bukan rute dinamis. | Static export tidak mendukung rute dinamis tanpa daftar parameter; cara ini juga mudah di-cache service worker. |
| 8 | Service worker buatan sendiri (`public/sw.js`): navigasi jaringan-dulu, aset cache-dulu. | Tanpa dependensi tambahan; cukup untuk demo luring. |
| 9 | Catatan harian bulan berjalan digabung sebagai **bulan proyeksi** (rata-rata harian × 30). | Agar alur "catat usaha → skor" terlihat; ditandai sebagai proyeksi di UI. |
| 10 | Kontribusi indikator memakai **dekomposisi Euler** $c_k=s_k\,\partial G/\partial s_k$. | Berlaku untuk semua ρ, jumlahnya tepat G, dan mudah dijelaskan. |
| 11 | Deret CUSUM = laba ÷ rata-rata laba 3 bulan pertama (μ₀ = 1). | Bebas satuan sehingga satu set parameter berlaku untuk semua mustahik. |
| 12 | Transisi Markov diamati per **3 bulan**; sisa lintasan setelah terserap diabaikan. | Mengurangi bolak-balik tahap akibat derau bulanan; konsisten dengan asumsi keadaan penyerap. |
| 13 | Sensitivitas: Dirichlet berpusat di bobot dasar (α = c·w₀, c = 20). | Menguji perubahan bobot yang realistis di sekitar pilihan pakar; c dapat diubah. |
| 14 | Ambang tahap bawaan diubah ke 0,30/0,42/0,55/0,70 (dari draf awal 0,25/0,45/0,65/0,80). | Draf awal menghasilkan hampir semua mustahik di tahap 2–3 pada data demo. Ini tetap penanda tempat. |
| 15 | Data sintetis **tidak dipaksa** menghasilkan Muzakki. | Dengan nisab penanda tempat (Rp127,5 juta), tidak ada mustahik sintetis yang mencapainya; memaksakan data akan menyesatkan. |
| 16 | NumPy saja (tanpa SciPy) pada mesin Python. | Dependensi minimal; Kendall τ, biseksi, dan Dirichlet diimplementasikan sendiri. |
| 17 | Grafik: Recharts; ikon: lucide-react; huruf: Plus Jakarta Sans (paket `@fontsource`, tanpa CDN). | Ringan dan tetap berfungsi luring. |
| 18 | Desain visual mengikuti gaya landing page SaaS modern (gradien ungu, aksen oranye, kartu bersudut besar), dibuat ulang dari nol. | Sesuai arahan desain; tidak memakai aset atau kode template berbayar. |
| 19 | Ekspor CSV: kode anonim berupa hash FNV-1a dengan garam acak per ekspor; nama samaran, wilayah, dan pendamping dibuang. | Sederhana dan tidak dapat dihubungkan antarekspor. Untuk data nyata perlu anonimisasi lebih kuat. |
| 20 | Uji Playwright memakai variabel `PW_CHROME` untuk Chrome sistem. | Lingkungan pengembangan tidak dapat mengunduh browser Playwright. |
