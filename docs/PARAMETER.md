# Daftar Parameter Model

Sumber nilai bawaan: `engine/naik_kelas/parameter_bawaan.json`. Berkas yang sama dibaca oleh Python dan aplikasi web. Semua parameter dapat diubah di layar **Manajer → Parameter**. Setiap penyimpanan membuat versi baru (`lokal-N`), dan setiap skor mencatat versi yang dipakai.

**Status semua parameter: Nilai awal untuk demonstrasi, belum dikalibrasi.**

| Kelompok | Parameter | Nilai bawaan | Status | Saran sumber kalibrasi |
|---|---|---|---|---|
| Normalisasi | `pendapatan` l / u | 0 / 1,5 (× had kifayah) | belum dikalibrasi | Kajian had kifayah, FGD pakar |
| | `aset` l / u | 0 / 1,0 (× nisab) | belum dikalibrasi | Rujukan fikih + pakar |
| | `tabungan` l / u | 0 / 0,25 | belum dikalibrasi | Data program |
| | `kelangsungan` l / u | 0 / 1,0 | belum dikalibrasi | – |
| | `cibest` l / u | 0 / 1,0 | belum dikalibrasi | Instrumen CIBEST baku |
| Bobot | `bobot` | 0,30 · 0,20 · 0,15 · 0,15 · 0,20 | belum dikalibrasi | AHP pakar / entropi data nyata |
| | `ahp_matriks` | contoh 5×5 (CR < 0,1) | contoh | Kuesioner AHP pakar |
| CES | `rho` | 0,5 | belum dikalibrasi | Diskusi normatif + uji sensitivitas |
| Tahap | `ambang` τ₁..τ₄ | 0,30 · 0,42 · 0,55 · 0,70 | belum dikalibrasi (dipilih agar sebaran demo informatif) | FGD + validasi kasus |
| Kebutuhan | `had_kifayah_rt_bulanan` | Rp3.000.000 | **penanda tempat** | Kajian had kifayah resmi terbaru |
| Nisab | `nisab_gram` | 85 g | perlu konfirmasi fikih | Rujukan fikih |
| | `harga_emas_per_gram` | Rp1.500.000 | **penanda tempat** (bukan harga pasar) | Harga emas terkini |
| | `tarif_zakat` | 2,5% | informasi | Rujukan fikih |
| Kelangsungan | `ambang_bulan_aktif` | 36 bulan | belum dikalibrasi | Data kelangsungan usaha mikro |
| | `jendela_rata_bulan` | 3 | belum dikalibrasi | – |
| Bantuan | `bulan_penurunan_bertahap` | 6 bulan | belum dikalibrasi | Kebijakan program |
| CUSUM | `mu0` / `kappa` / `h` | 1,0 / 0,1 / 1,0 | belum dikalibrasi | Simulasi ARL pada data nyata |
| | `basis_bulan` | 3 | belum dikalibrasi | – |
| Markov | `langkah_bulan` | 3 | belum dikalibrasi | Frekuensi asesmen |
| | `prior_alpha` (4×6) | lihat JSON | **prior pakar contoh** | Elisitasi pakar |
| | `n_sampel` | 1.000 | teknis | – |
| Sensitivitas | `n_sampel` / `konsentrasi` | 1.000 / 20 | teknis | – |
| Asesmen | `ambang_produktif` | 60 | belum dikalibrasi | Validasi instrumen |
| | bobot 8 butir | 2 · 2 · 2 · 1,5 · 1 · 1,5 · 1 · 1 | belum dikalibrasi | Validasi instrumen |
| Modal minimum | α, A_L, A_H, F, s, δ, k₀ | 0,5 · 1 · 4 · 8 · 0,25 · 0,1 · 3 | ilustratif | Tidak untuk kebijakan |

Catatan:
- Mengubah `harga_emas_per_gram` atau `nisab_gram` mengubah indikator `aset` sekaligus syarat keras tahap 5.
- Perubahan parameter di aplikasi web disimpan di perangkat (localStorage). Untuk memakainya sebagai nilai bawaan bersama, salin ke `parameter_bawaan.json`, jalankan `npm run data` untuk memperbarui fixture rujukan, lalu jalankan semua uji.
