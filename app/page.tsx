"use client";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  ClipboardCheck,
  Download,
  Eye,
  FileSearch,
  Gauge,
  HeartHandshake,
  Layers,
  LineChart,
  Lock,
  NotebookPen,
  Scale,
  Shuffle,
  Calculator,
  UserRound,
  Users,
  BarChart3,
  WifiOff,
  Sparkles,
} from "lucide-react";
import { LabelSintetis, Logo, TahapIkon, WARNA_TAHAP } from "@/components/ui";

const MASALAH = [
  { ikon: NotebookPen, judul: "Pendampingan tidak baku", teks: "Kunjungan dan catatan usaha jarang terdokumentasi dengan format yang sama." },
  { ikon: Eye, judul: "Monitoring pasca-bantuan lemah", teks: "Setelah dana tersalur, kondisi usaha jarang dipantau secara berkala." },
  { ikon: Scale, judul: "Definisi graduasi beragam", teks: "Kapan mustahik dianggap mandiri atau menjadi muzakki belum seragam." },
  { ikon: LineChart, judul: "Evaluasi berupa potret sesaat", teks: "Penilaian tidak melihat lintasan, sehingga perbaikan dan kemunduran terlewat." },
];

const TAHAP = [
  { t: 1, nama: "Rentan", teks: "Kebutuhan dasar belum terpenuhi; perlu dukungan penuh." },
  { t: 2, nama: "Memulai", teks: "Usaha berjalan, pendapatan belum stabil." },
  { t: 3, nama: "Bertahan", teks: "Usaha bertahan dan mulai menabung." },
  { t: 4, nama: "Mandiri (muktafi)", teks: "Kebutuhan tercukupi; bantuan diturunkan bertahap." },
  { t: 5, nama: "Muzakki", teks: "Kekayaan bersih mencapai nisab; berpotensi berzakat." },
];

const MODUL = [
  { k: "M1", ikon: ClipboardCheck, n: "Asesmen kesiapan", d: "Kuesioner singkat → rekomendasi produktif / tetap konsumtif dengan aturan terbuka." },
  { k: "M2", ikon: UserRound, n: "Profil & baseline", d: "Variabel diselaraskan dengan skema DTSEN/SiMBA (kompatibel, bukan integrasi)." },
  { k: "M3", ikon: NotebookPen, n: "Buku usaha ringan", d: "Omzet, biaya, tabungan, pengeluaran. Input cepat, tetap jalan saat luring." },
  { k: "M4", ikon: HeartHandshake, n: "Pendampingan terstruktur", d: "Daftar periksa kunjungan, hambatan, milestone, dan pengingat jadwal." },
  { k: "M5", ikon: Gauge, n: "Mesin graduasi", d: "Indeks CES, lima tahap, penjelasan kontribusi, dan lintasan waktu." },
  { k: "M6", ikon: BellRing, n: "Peringatan dini", d: "Aturan CUSUM menandai penurunan laba berkelanjutan beserta alasannya." },
  { k: "M7", ikon: BarChart3, n: "Dasbor manajer", d: "Sebaran tahap, mustahik berisiko/stagnan, dan perbandingan kelompok." },
  { k: "M8", ikon: Shuffle, n: "Analisis sensitivitas", d: "Uji stabilitas peringkat terhadap bobot dengan sampling Dirichlet." },
  { k: "M9", ikon: Download, n: "Ekspor data", d: "CSV teranonimkan untuk analisis lanjutan." },
  { k: "M10", ikon: Calculator, n: "Kalkulator modal minimum", d: "Model jebakan kemiskinan sederhana sebagai demonstrasi." },
];

function MockupPonsel() {
  return (
    <div className="relative mx-auto w-[300px] text-tinta sm:w-[320px]">
      {/* bola dekoratif */}
      <div className="melayang-lambat absolute -left-16 top-10 h-24 w-24 rounded-full bg-gradient-to-br from-white/60 to-ungu-400/40 blur-[1px]" />
      <div className="melayang absolute -right-10 bottom-16 h-16 w-16 rounded-full bg-gradient-to-br from-oranye-500/80 to-pink-400/60" />
      <div className="melayang-lambat absolute -right-6 -top-6 h-10 w-24 rotate-[-30deg] rounded-full bg-gradient-to-r from-ungu-300/70 to-white/60" />

      <div className="relative rounded-[2.4rem] border-[10px] border-ungu-950 bg-latar p-4 shadow-[0_40px_80px_-20px_rgba(18,12,56,0.6)]">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-ungu-950/80" />
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold">Halo, Mustahik 001</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">SINTETIS</span>
        </div>
        <div className="kartu p-4">
          <div className="flex items-center gap-3">
            <TahapIkon tahap={3} ukuran={46} />
            <div>
              <div className="text-xs text-abu">Tahap saat ini</div>
              <div className="text-lg font-extrabold">Bertahan</div>
            </div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ungu-100">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-ungu-500 to-ungu-400" />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-abu">
            <span>G = 0,51</span>
            <span>Menuju Mandiri: 0,55</span>
          </div>
        </div>
        <button className="tombol-cta mt-3 w-full py-3.5 text-sm" tabIndex={-1}>
          <NotebookPen size={16} /> Catat hari ini
        </button>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ["Omzet", "4,2 jt"],
            ["Laba", "1,5 jt"],
            ["Tabungan", "180 rb"],
          ].map(([a, b]) => (
            <div key={a} className="rounded-xl bg-white p-2 ring-1 ring-garis">
              <div className="text-[10px] text-abu">{a}</div>
              <div className="text-sm font-bold">{b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* kartu melayang */}
      <div className="melayang absolute -left-28 top-[23rem] hidden w-48 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-garis sm:block">
        <div className="mb-2 text-[11px] font-bold text-tinta">Kontribusi indikator</div>
        {[
          ["Pendapatan", 0.82, "var(--color-ungu-600)"],
          ["Tabungan", 0.55, "var(--color-ungu-400)"],
          ["CIBEST", 0.64, "var(--color-t4)"],
        ].map(([n, v, c]) => (
          <div key={n as string} className="mb-1.5">
            <div className="flex justify-between text-[10px] text-abu">
              <span>{n}</span>
              <span>{Math.round((v as number) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-ungu-50">
              <div className="h-full rounded-full" style={{ width: `${(v as number) * 100}%`, background: c as string }} />
            </div>
          </div>
        ))}
      </div>
      <div className="melayang-lambat absolute -right-36 top-6 hidden w-52 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-garis sm:block">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-red-50 text-t1">
            <BellRing size={16} />
          </span>
          <div>
            <div className="text-[11px] font-bold">Peringatan dini</div>
            <div className="text-[10px] text-abu">CUSUM S = 1,24 &gt; h = 1,0</div>
          </div>
        </div>
      </div>
      <div className="melayang absolute -right-24 -bottom-4 hidden rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-ungu-700 shadow-lg ring-1 ring-garis sm:block">
        <WifiOff size={12} className="mr-1 inline" /> Tetap jalan saat luring
      </div>
    </div>
  );
}

export default function Beranda() {
  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <header className="hero-ungu relative pb-20 text-white sm:pb-28">
        <div className="mx-auto max-w-6xl px-4 pt-5">
          <nav className="flex items-center justify-between rounded-full bg-white/10 px-3 py-2 ring-1 ring-white/20 backdrop-blur sm:px-5">
            <Logo terang kecil />
            <div className="hidden items-center gap-6 text-sm font-medium text-white/85 md:flex">
              <a href="#masalah" className="hover:text-white">Masalah</a>
              <a href="#tahap" className="hover:text-white">Tahap</a>
              <a href="#modul" className="hover:text-white">Modul</a>
              <a href="#metode" className="hover:text-white">Metode</a>
            </div>
            <Link href="/masuk/" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ungu-700 hover:bg-ungu-50">
              Masuk demo <ArrowRight size={14} className="inline" />
            </Link>
          </nav>
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="eyebrow bg-white/15 text-white ring-1 ring-white/25">
                <Sparkles size={13} /> Prototipe Riset · BAZNAS RI · Klaster B-6
              </span>
              <LabelSintetis gelap />
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Mendampingi Mustahik <span className="text-ungu-200">Naik Kelas</span>, dari Penerima Menjadi Muzakki
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Sistem pendamping dan pemantau graduasi mustahik pengusaha pada program zakat produktif. Pendampingan tercatat, kemajuan terpantau sebagai
              lintasan, dan setiap skor disertai alasan yang dapat dibaca amil.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/masuk/" className="tombol-cta">
                Coba demo <ArrowRight size={18} />
              </Link>
              <a href="#metode" className="tombol-hantu">
                Lihat metode <ArrowRight size={18} />
              </a>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-white/70">
              <Scale size={16} /> Alat bantu keputusan; keputusan akhir tetap pada amil.
            </p>
          </div>
          <MockupPonsel />
        </div>
      </header>

      {/* STRIP RUJUKAN */}
      <section className="border-b border-garis bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-sm font-semibold text-abu">
          <span className="text-xs uppercase tracking-widest text-abu/80">Kerangka yang digunakan</span>
          {["Had kifayah", "Nisab emas", "CIBEST material-spiritual", "Skema DTSEN/SiMBA (kompatibel)", "Rantai Markov", "CUSUM"].map((x) => (
            <span key={x} className="flex items-center gap-1.5">
              <BookOpenCheck size={15} className="text-ungu-500" /> {x}
            </span>
          ))}
        </div>
      </section>

      {/* MASALAH */}
      <section id="masalah" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow bg-ungu-100 text-ungu-700">Masalah yang dijawab</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Graduasi perlu dilihat sebagai perjalanan, bukan potret sesaat</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MASALAH.map((m, i) => (
            <div key={m.judul} className="kartu p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ungu-50 text-ungu-600">
                <m.ikon size={22} />
              </span>
              <div className="mt-4 text-xs font-bold text-oranye-500">0{i + 1}</div>
              <h3 className="mt-1 text-lg font-bold">{m.judul}</h3>
              <p className="mt-2 text-sm leading-relaxed text-abu">{m.teks}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ANGKA */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="hero-gelap grid grid-cols-2 gap-6 rounded-[2rem] px-6 py-10 text-white sm:px-12 lg:grid-cols-4">
          {[
            ["200", "mustahik sintetis"],
            ["24", "bulan data per orang"],
            ["5", "tahap graduasi"],
            ["10", "modul MVP"],
          ].map(([a, b]) => (
            <div key={b} className="text-center">
              <div className="text-4xl font-extrabold tracking-tight sm:text-5xl">{a}</div>
              <div className="mt-1 text-sm text-white/70">{b}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TAHAP */}
      <section id="tahap" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow bg-ungu-100 text-ungu-700">Cara kerja</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Lima tahap graduasi yang transparan</h2>
          <p className="mt-3 text-abu">
            Tahap ditentukan dari indeks G dan ambang yang dapat diatur. Tahap Muzakki mensyaratkan kekayaan bersih mencapai nisab. Graduasi tidak memutus
            dukungan mendadak: tersedia status penurunan bantuan bertahap.
          </p>
        </div>
        <div className="relative mt-12 grid gap-5 md:grid-cols-5">
          <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-gradient-to-r from-t1 via-t3 to-t5 md:block" />
          {TAHAP.map((t) => (
            <div key={t.t} className="relative text-center">
              <div className="mx-auto w-fit rounded-2xl bg-latar p-1">
                <TahapIkon tahap={t.t} ukuran={48} />
              </div>
              <div className="mt-3 text-xs font-bold" style={{ color: WARNA_TAHAP[t.t] }}>
                Tahap {t.t}
              </div>
              <div className="font-bold">{t.nama}</div>
              <p className="mt-1 text-sm text-abu">{t.teks}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-abu">
          Keadaan tambahan: <b className="text-tinta">Keluar/gagal</b>.
        </p>
      </section>

      {/* MODUL */}
      <section id="modul" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="eyebrow bg-ungu-100 text-ungu-700">Modul MVP</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Sepuluh modul untuk tiga peran</h2>
            </div>
            <div className="flex gap-2 text-sm">
              {[
                [UserRound, "Mustahik"],
                [HeartHandshake, "Pendamping"],
                [Users, "Manajer"],
              ].map(([I, n]) => {
                const Ik = I as typeof UserRound;
                return (
                  <span key={n as string} className="flex items-center gap-1.5 rounded-full bg-ungu-50 px-3 py-1.5 font-semibold text-ungu-700">
                    <Ik size={14} /> {n as string}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {MODUL.map((m) => (
              <div key={m.k} className="group rounded-[var(--radius-kartu)] border border-garis p-5 transition hover:-translate-y-1 hover:border-ungu-300 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-ungu-600 text-white">
                    <m.ikon size={18} />
                  </span>
                  <span className="text-xs font-bold text-abu">{m.k}</span>
                </div>
                <h3 className="mt-4 font-bold">{m.n}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-abu">{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METODE */}
      <section id="metode" className="hero-gelap py-20 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <span className="eyebrow bg-white/10 text-white ring-1 ring-white/20">
              <Layers size={13} /> Spesifikasi matematika
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Model yang dapat diuji dan direproduksi</h2>
            <p className="mt-3 text-white/70">
              Mesin matematika ditulis sebagai modul Python murni yang teruji, dan diporting ke TypeScript agar berjalan di perangkat tanpa koneksi. Setiap skor
              menyimpan versi parameter.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              ["Indeks graduasi CES", "sₖ = min{1, max{0, (xₖ − lₖ)/(uₖ − lₖ)}}\nG = ( Σ wₖ sₖ^ρ )^(1/ρ)", "ρ = 1 rata-rata berbobot; ρ → 0 geometrik; ρ ≪ 0 mendekati min sₖ. Bobot: manual, AHP (dengan CR), atau entropi."],
              ["Lintasan sebagai rantai Markov", "P = [Q R; 0 I],  M = (I − Q)⁻¹\nt = M·1,  B = M·R", "Baris transisi ~ Dirichlet; posterior Dirichlet(α + n). Interval kredibel dari sampling posterior dan simulasi Monte Carlo."],
              ["Peringatan dini CUSUM", "Sₜ = max{0, Sₜ₋₁ + (μ₀ − yₜ) − κ}\nperingatan bila Sₜ > h", "yₜ = laba bulanan relatif terhadap basis awal. Setiap peringatan disertai alasan yang dapat dibaca."],
              ["Sensitivitas & modal minimum", "w ~ Dirichlet(c·w₀) → Kendall τ\nkₜ₊₁ = (1−δ)kₜ + s·f(kₜ)", "Stabilitas peringkat terhadap bobot; ambang jebakan k̂ dan suntikan minimum z* = max{0, k̂ − k₀} (ilustratif)."],
            ].map(([j, f, d]) => (
              <div key={j} className="rounded-[var(--radius-kartu)] bg-white/[0.06] p-6 ring-1 ring-white/10">
                <h3 className="font-bold">{j}</h3>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-black/25 p-4 font-mono text-sm text-ungu-100">{f}</pre>
                <p className="mt-3 text-sm text-white/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRINSIP */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-5 md:grid-cols-4">
          {[
            [Scale, "Keputusan pada amil", "Skor tidak menentukan hak penerima."],
            [FileSearch, "Dapat dijelaskan", "Kontribusi tiap indikator selalu ditampilkan."],
            [Lock, "Privasi", "Akses berbasis peran, log audit, ekspor teranonimkan."],
            [HeartHandshake, "Bertahap", "Graduasi disertai penurunan bantuan bertahap."],
          ].map(([I, j, d]) => {
            const Ik = I as typeof Scale;
            return (
              <div key={j as string} className="flex gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-oranye-500/10 text-oranye-500">
                  <Ik size={20} />
                </span>
                <div>
                  <div className="font-bold">{j as string}</div>
                  <div className="text-sm text-abu">{d as string}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="hero-ungu relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white sm:px-12">
          <div className="melayang-lambat absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="melayang absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-oranye-500/30" />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">Jelajahi prototipe dari tiga sudut pandang</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">Mustahik pengusaha, pendamping/amil, dan manajer program. Semua data dalam demo ini sintetis.</p>
          <Link href="/masuk/" className="tombol-cta relative mt-8">
            Masuk ke demo <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-garis bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-abu sm:flex-row">
          <Logo kecil />
          <p className="text-center">
            Prototipe riset untuk BAZNAS RI, Klaster B no. 6 (Mustahik Entrepreneur). Bukan produk produksi. Parameter belum dikalibrasi.
          </p>
        </div>
      </footer>
    </div>
  );
}
