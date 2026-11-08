# Naik Kelas — Prototipe Riset Graduasi Mustahik

Prototipe riset (bukan produk produksi) untuk **sistem pendamping dan pemantau graduasi mustahik pengusaha** pada program zakat produktif. Prototipe ini disiapkan untuk riset BAZNAS RI, Klaster B nomor 6 (*Mustahik Entrepreneur: zakat produktif, kewirausahaan, dan graduasi mustahik menjadi muzakki*).

> ⚠️ **Data SINTETIS.** Semua parameter adalah nilai awal untuk demonstrasi dan **belum dikalibrasi**. Skor adalah **alat bantu keputusan**: skor tidak menentukan hak penerima, dan keputusan akhir ada pada amil.

## Isi

| Modul | Halaman |
|---|---|
| M1 Asesmen kesiapan | Pendamping → detail → Asesmen |
| M2 Profil & baseline | Pendamping → detail |
| M3 Buku usaha ringan (luring) | Mustahik → Catat hari ini |
| M4 Pendampingan terstruktur | Pendamping → Kunjungan, Jadwal |
| M5 Mesin graduasi | Detail mustahik, Manajer → Lintasan |
| M6 Peringatan dini (CUSUM) | Detail mustahik, Dasbor |
| M7 Dasbor manajer | Manajer → Dasbor |
| M8 Analisis sensitivitas | Manajer → Sensitivitas |
| M9 Ekspor data teranonimkan | Manajer → Ekspor |
| M10 Kalkulator modal minimum | Manajer → Modal |

## Struktur

```
app/, components/, lib/   Aplikasi Next.js (PWA, mobile-first)
lib/engine/               Mesin matematika TypeScript (porting, dipakai aplikasi)
engine/naik_kelas/        Mesin matematika Python (implementasi rujukan) + parameter bawaan
engine/tests/             Uji pytest
backend/                  FastAPI opsional (endpoint matematika, sinkron ke SQLite, audit)
scripts/                  Generator data sintetis + fixture uji silang
public/data/sintetis.json Data sintetis 200 mustahik × 24 bulan
tests/e2e/                Uji Playwright alur utama
docs/                     METODE.md, PARAMETER.md, KEPUTUSAN.md
```

## Menjalankan

Prasyarat: Node.js ≥ 20, Python ≥ 3.10.

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # hasil statis di folder out/
npm start              # menyajikan folder out/
```

### Uji

```bash
pip install -r backend/requirements.txt
python -m pytest            # 85 uji mesin Python + API
npm test                    # 21 uji mesin TypeScript + uji silang ke Python
npm run build && npx playwright install chromium && npm run test:e2e
# atau memakai Chrome sistem: PW_CHROME=/usr/bin/google-chrome npm run test:e2e
```

### Membangkitkan ulang data sintetis

```bash
npm run data     # = python3 scripts/buat_data_sintetis.py  (seed tetap)
```

Jalankan perintah ini setiap kali `engine/naik_kelas/parameter_bawaan.json` atau generator berubah, supaya fixture uji silang ikut diperbarui.

### Backend opsional

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000     # dokumentasi API: http://localhost:8000/docs
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Tanpa `NEXT_PUBLIC_API_URL`, aplikasi berjalan penuh di peramban dan sinkronisasinya disimulasikan.

## Deploy ke Vercel

1. Impor repo ini di Vercel (framework terdeteksi otomatis sebagai Next.js; tidak perlu pengaturan tambahan).
2. Build command `next build`; Next.js menghasilkan situs statis (`output: "export"`).
3. Opsional: isi environment variable `NEXT_PUBLIC_API_URL` bila backend FastAPI dijalankan di server terpisah.

## Akun demo

Di halaman **Masuk**, pilih salah satu peran (tanpa kata sandi): Mustahik (kode samaran M001–M030), Pendamping (per wilayah atau semua), atau Manajer program. Catatan, kunjungan, asesmen, perubahan parameter, dan log audit disimpan di perangkat (IndexedDB/localStorage).

## Di luar cakupan

Marketplace, pembayaran zakat, blockchain, dan klaim akurasi prediksi.
