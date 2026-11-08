# Metode: Prototipe "Naik Kelas"

Dokumen ini merangkum seluruh rumus, asumsi, dan keterbatasan model dalam prototipe *Naik Kelas*, yaitu sistem pendamping dan pemantau graduasi mustahik pengusaha pada program zakat produktif (riset BAZNAS RI, Klaster B nomor 6). Bagian-bagiannya ditulis agar dapat diadaptasi langsung ke laporan penelitian.

> **Status.** Semua nilai parameter adalah penanda tempat untuk demonstrasi dan **belum dikalibrasi**. Seluruh data dalam prototipe adalah **data sintetis**. Skor adalah alat bantu keputusan; keputusan akhir tetap pada amil.

Implementasi rujukan berada di `engine/naik_kelas/` (Python/NumPy). Aplikasi web memakai porting TypeScript di `lib/engine/` agar dapat berjalan luring. Kesetaraan kedua implementasi diuji secara otomatis (lihat §11).

---

## 1. Indikator dan normalisasi

Untuk mustahik $i$ pada bulan $t$ dihitung $K=5$ indikator mentah $x_k$:

| $k$ | Kode | Definisi operasional (prototipe) |
|---|---|---|
| 1 | `pendapatan` | Rata-rata pendapatan rumah tangga (laba usaha + pendapatan lain) selama jendela $J$ bulan terakhir ÷ had kifayah rumah tangga per bulan |
| 2 | `aset` | Kekayaan bersih $W_t$ ÷ nisab $N$ |
| 3 | `tabungan` | Jumlah tabungan ÷ jumlah pendapatan dalam jendela $J$ bulan (0 bila pendapatan ≤ 0) |
| 4 | `kelangsungan` | (lama usaha saat masuk program + $t$ + 1) ÷ ambang bulan aktif |
| 5 | `cibest` | $\tfrac12$ skor material + $\tfrac12$ skor spiritual (masing-masing 0–1) |

Normalisasi min–maks terpotong:

$$s_k=\min\Big\{1,\max\Big\{0,\tfrac{x_k-l_k}{u_k-l_k}\Big\}\Big\},\qquad u_k>l_k .$$

Usaha yang tidak aktif (berhenti) langsung masuk keadaan **Keluar/gagal**, dan skornya tidak dihitung.

## 2. Indeks graduasi CES

$$G=\Big(\sum_{k=1}^{K}w_k\,s_k^{\rho}\Big)^{1/\rho},\qquad w\in\Delta^{K-1}.$$

Parameter $\rho$ mengatur sejauh mana indikator saling menggantikan (elastisitas substitusi $\sigma=1/(1-\rho)$):

- $\rho=1$: rata-rata berbobot (substitusi sempurna);
- $\rho\to0$: rata-rata geometrik $\prod_k s_k^{w_k}$;
- $\rho\to-\infty$: $\min_k s_k$ (tanpa substitusi, prinsip "rantai terlemah").

**Kestabilan numerik.** $G$ dihitung di ruang logaritma:

$$\log G=\tfrac1\rho\,\mathrm{LSE}_k\big(\log w_k+\rho\log s_k\big),$$

sehingga $\rho$ negatif besar tidak menimbulkan luapan. Bila $|\rho|<10^{-9}$, dipakai bentuk geometrik. Bila ada $s_k=0$ dengan $w_k>0$ dan $\rho\le0$, maka $G=0$ (nilai limit). Indikator berbobot nol diabaikan. Untuk $s\in[0,1]^K$, $G\in[0,1]$ dan $G$ monoton tak turun pada setiap $s_k$.

### 2.1 Penjelasan skor (kontribusi indikator)

Karena $G$ homogen berderajat satu, berlaku dekomposisi Euler

$$G=\sum_k c_k,\qquad c_k=s_k\frac{\partial G}{\partial s_k}=G\,\frac{w_k s_k^{\rho}}{\sum_j w_j s_j^{\rho}} .$$

Untuk $\rho\to0$, $c_k=G\,w_k$. UI menampilkan $s_k$, $w_k$, $c_k$, dan pangsa $c_k/G$ untuk setiap skor, bersama versi parameter yang dipakai.

"Penghambat utama" adalah indikator dengan gradien terbesar di antara $s_k<1$:

$$\frac{\partial G}{\partial s_k}=w_k\,s_k^{\rho-1}\,G^{1-\rho},$$

yaitu indikator yang paling menaikkan $G$ bila diperbaiki sedikit. Nilainya $+\infty$ bila $s_k=0$ dan $\rho<1$.

## 3. Pembobotan

Tiga cara tersedia di layar pengaturan:

1. **Manual**: bobot dinormalkan $w_k=v_k/\sum_j v_j$.
2. **AHP**: dari matriks perbandingan berpasangan resiprokal $A$ ($a_{ji}=1/a_{ij}$, skala Saaty 1/9–9). Bobot adalah vektor eigen utama (dinormalkan), dan
   $$CR=\frac{\lambda_{\max}-K}{(K-1)\,RI_K},$$
   dengan $RI$ Saaty ($RI_5=1{,}12$). Matriks ditandai **tidak konsisten** bila $CR>0{,}1$. Python memakai `numpy.linalg.eig`; TypeScript memakai iterasi pangkat, yang konvergen untuk matriks positif menurut teorema Perron–Frobenius.
3. **Entropi**: dari matriks $n\times K$ nilai $s_{ik}$,
   $$p_{ik}=\frac{s_{ik}}{\sum_i s_{ik}},\quad e_k=-\frac{1}{\ln n}\sum_i p_{ik}\ln p_{ik},\quad w_k=\frac{1-e_k}{\sum_j(1-e_j)} .$$
   Kolom tanpa variasi mendapat bobot 0. Bila semua kolom tanpa variasi, bobot dibagi rata.

## 4. Penentuan tahap

Dengan ambang $0<\tau_1<\tau_2<\tau_3<\tau_4<1$:

$$\text{tahap}=1+\#\{j:\ G\ge\tau_j\}\in\{1,\dots,5\},$$

yaitu 1 Rentan, 2 Memulai, 3 Bertahan, 4 Mandiri (muktafi), 5 Muzakki, ditambah keadaan 6 Keluar/gagal.

**Syarat keras tahap 5:** kekayaan bersih $W\ge N$, dengan $N=$ berat nisab (bawaan 85 g emas) × harga emas per gram. Bila $G\ge\tau_4$ tetapi $W<N$, tahap ditahan di 4 dan alasannya ditampilkan. Bila $W\ge N$, zakat diperkirakan sebesar $0{,}025\,W$. Angka ini hanya informasi.

> *Dasar nisab dan haul perlu dikonfirmasi pada rujukan fikih.* Prototipe tidak memeriksa haul.

**Penurunan bantuan bertahap.** Graduasi tidak memutus dukungan mendadak:

| Kondisi | Status |
|---|---|
| tahap terakhir ≤ 3 | Bantuan dan pendampingan penuh |
| tahap ≥ 4, kurang dari $B$ bulan berturut-turut | Penurunan bantuan bertahap |
| tahap ≥ 4, sudah $B$ bulan berturut-turut | Lulus: pemantauan ringan |
| Keluar/gagal | Tinjau ulang |

($B$ bawaan = 6 bulan.)

## 5. Lintasan sebagai rantai Markov dengan keadaan penyerap

Tahap 1–4 adalah keadaan transien; Muzakki dan Keluar/gagal adalah keadaan penyerap:

$$P=\begin{pmatrix}Q&R\\0&I\end{pmatrix},\quad M=(I-Q)^{-1},\quad \mathbf t=M\mathbf 1,\quad B=MR .$$

$M_{ij}$ adalah ekspektasi banyaknya kunjungan ke keadaan $j$ bila mulai dari $i$; $\mathbf t$ adalah rata-rata banyaknya langkah sampai terserap; $B$ adalah peluang terserap ke setiap penyerap.

**Estimasi.** Transisi dihitung dari barisan tahap tiap $L$ bulan (bawaan $L=3$). Setelah mencapai keadaan penyerap, sisa barisan diabaikan. Untuk tiap baris transien $j$:

$$p_j\sim\mathrm{Dirichlet}(\alpha_j)\;\Rightarrow\;p_j\mid n_j\sim\mathrm{Dirichlet}(\alpha_j+n_j),$$

dengan $\alpha_j$ prior pakar dan $n_j$ frekuensi transisi teramati. Rata-rata posterior dipakai sebagai estimasi titik. Interval kredibel 95% untuk $\mathbf t$ dan $B$ diperoleh dari kuantil 2,5% dan 97,5% atas sampel posterior (bawaan 1.000 sampel). Waktu dikonversi ke bulan dengan mengalikan $L$.

**Simulasi Monte Carlo.** Dari $P$ rata-rata posterior disimulasikan 2.000 lintasan dari tahap awal pilihan selama $H$ langkah. Hasilnya adalah sebaran keadaan per langkah dan proporsi yang terserap.

## 6. Peringatan dini (CUSUM)

Deret yang dipantau adalah laba bulanan relatif terhadap basis awal: $y_t=\text{laba}_t/\overline{\text{laba}}_{1..b}$ (bawaan $b=3$).

$$S_t=\max\{0,\;S_{t-1}+(\mu_0-y_t)-\kappa\},\qquad S_0=0,$$

dan peringatan muncul bila $S_t>h$ (bawaan $\mu_0=1$, $\kappa=0{,}1$, $h=1$). Alasan peringatan menyebut periode awal episode penurunan, nilai $S_t$, dan $h$. Deret yang konstan di atas $\mu_0$ tidak pernah memicu peringatan.

Mustahik ditandai **berisiko** bila minimal satu kondisi berikut terpenuhi:

1. CUSUM aktif pada bulan terakhir;
2. $G$ turun lebih dari 0,08 dalam 3 bulan;
3. tahap lebih rendah dibanding 3 bulan lalu.

Mustahik ditandai **stagnan** bila tahapnya ≤ 3, tidak berubah selama 9 bulan, dan $|\Delta G|<0{,}03$ dalam 6 bulan. Semua aturan ini adalah heuristik pemantauan tanpa klaim akurasi.

## 7. Analisis sensitivitas bobot

Bobot sampel diambil $w^{(m)}\sim\mathrm{Dirichlet}(c\,w_0)$, $m=1..M$ (bawaan $M=1000$, $c=20$), dengan $\mathbb E[w]=w_0$. Untuk tiap sampel dihitung $G$ dan tahap seluruh usaha aktif, lalu dilaporkan:

- **Kendall $\tau_b$** antara $G(w_0)$ dan $G(w^{(m)})$ (menangani ikatan). $\tau=1$ bila $w^{(m)}=w_0$.
- **Proporsi mustahik yang berganti tahap.**
- **Peluang berganti tahap per mustahik**, yang menunjuk kasus dekat ambang.

*Contoh hasil pada data sintetis dan parameter bawaan (seed 1):* rata-rata $\tau\approx0{,}87$ (5–95%: 0,76–0,94), tetapi rata-rata ±36% mustahik berganti tahap. Artinya urutan relatif mustahik cukup stabil, sedangkan **klasifikasi tahap sangat peka terhadap bobot**, terutama bila ambang berdekatan. Ini menjadi alasan kuat untuk mengkalibrasi bobot dan ambang secara partisipatif (FGD pakar atau AHP) sebelum dipakai.

## 8. Modal minimum (jebakan kemiskinan, ilustratif)

$$k_{t+1}=(1-\delta)k_t+s\,f(k_t),\qquad f(k)=\max\{A_Lk^{\alpha},\ A_Hk^{\alpha}-F\}.$$

Titik tetap positif memenuhi $\varphi(k)=s f(k)-\delta k=0$. Akar dicari dengan grid logaritmik (20.000 titik) dan biseksi. Akar disebut **stabil** bila $\varphi$ berpindah dari positif ke negatif, dan **tak stabil** bila sebaliknya. Ambang jebakan $\hat k$ adalah akar tak stabil terkecil, dan

$$z^*=\max\{0,\ \hat k-k_0\}.$$

Bila tidak ada akar tak stabil, UI menyatakan bahwa model tidak memiliki jebakan pada parameter tersebut.

Dengan nilai bawaan ($\alpha=0{,}5$, $A_L=1$, $A_H=4$, $F=8$, $s=0{,}25$, $\delta=0{,}1$) solusi analitiknya adalah $k_L^*=6{,}25$ (stabil), $\hat k=\big((10-\sqrt{20})/2\big)^2\approx7{,}64$, dan $k_H^*\approx52{,}36$ (stabil). Untuk $k_0=3$, diperoleh $z^*\approx4{,}64$ satuan modal ilustratif. Model ini hanya demonstrasi konsep, bukan dasar penetapan nilai bantuan.

## 9. Asesmen kesiapan (M1)

Delapan butir dinilai 0–3 dengan bobot $b_q$:

$$\text{skor}=100\cdot\frac{\sum_q b_q v_q}{3\sum_q b_q}.$$

Rekomendasinya **Produktif** bila skor ≥ ambang (bawaan 60) dan tidak ada butir bertanda syarat minimal (motivasi, waktu) yang bernilai 0. Selain itu rekomendasinya **Tetap konsumtif**. Amil mencatat keputusan akhirnya sendiri.

## 10. Data sintetis

Generator (`engine/naik_kelas/sintetis.py`, seed 20261108) membangkitkan 200 mustahik × 24 bulan (Nov 2024–Okt 2026) dalam tiga kelompok:

- A: modal saja;
- B: modal + pendampingan;
- C: modal + pendampingan + pelatihan.

Asumsi utamanya:

- **Log-laba** mengikuti tren kelompok (A 0,4%, B 1,2%, C 1,8% per bulan) ditambah kemampuan individu $\mathcal N(0;0{,}006)$, galat AR(1) ($\phi=0{,}5$; sd 0,10), dan guncangan negatif sementara (peluang 15%; −0,5 log selama 3–6 bulan).
- **Laba awal** berdistribusi lognormal (median Rp1,2 juta); marjin 25–40%.
- **Tabungan** = laju menabung (3–15%, +3% untuk kelompok C) × pendapatan.
- **Kekayaan bersih awal** berdistribusi lognormal (median Rp8 juta) dan bertambah dari tabungan dan reinvestasi 10% laba.
- **Usaha berhenti** dengan hazard 0,3%/bulan, naik menjadi 2,3% bila laba < 40% laba awal.
- **Skor CIBEST** diperbarui per triwulan.

**Efek kelompok adalah asumsi generator, bukan temuan empiris.** Perbandingan kelompok di dasbor hanya deskriptif.

## 11. Verifikasi

- `pytest` (85 uji): keenam uji wajib spesifikasi (CES, Markov, rentang, monoton, CUSUM, sensitivitas) serta AHP/CR, entropi, nisab, status bantuan, Monte Carlo vs. solusi analitik, modal minimum, asesmen, generator deterministik, dan API.
- `vitest` (21 uji): uji yang sama untuk porting TypeScript, ditambah **uji silang** 480 skor (20 mustahik × 24 bulan) terhadap fixture Python (selisih $G$ dan $c_k$ < $10^{-12}$; tahap identik).
- Playwright (3 uji): alur utama di viewport ponsel (login → catat usaha → kunjungan → skor + penjelasan → dasbor), proteksi peran, dan mode luring dengan sinkronisasi otomatis.

## 12. Keterbatasan

1. Parameter (batas normalisasi, bobot, $\rho$, ambang, had kifayah, harga emas, prior Markov, parameter CUSUM) belum dikalibrasi. Hasil numerik tidak boleh ditafsirkan sebagai temuan.
2. Data sintetis tidak mewakili populasi mustahik mana pun. Pada data demo tidak ada mustahik yang mencapai nisab, sehingga peluang Muzakki pada model Markov hampir seluruhnya ditentukan prior.
3. Asumsi Markov orde satu dan homogen waktu, serta perlakuan Muzakki sebagai keadaan penyerap (tidak bisa turun kembali), perlu diuji pada data nyata.
4. CUSUM dan aturan risiko/stagnan adalah heuristik tanpa validasi; tingkat alarm palsu belum diketahui.
5. Proyeksi bulan berjalan dari catatan harian (rata-rata harian × 30) bersifat kasar.
6. Indikator CIBEST disederhanakan menjadi skor kontinu; operasionalisasi kuadran CIBEST yang baku perlu diterapkan.
7. Variabel profil diselaraskan dengan skema DTSEN/SiMBA hanya pada tingkat konsep; tidak ada integrasi sistem.
8. Haul tidak diperiksa; estimasi zakat hanya informasi.
9. Autentikasi pada mode demo adalah pemilihan peran tanpa kata sandi; log audit bersifat lokal per perangkat.
