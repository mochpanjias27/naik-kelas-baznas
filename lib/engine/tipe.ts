// Tipe data bersama. Struktur selaras dengan engine/naik_kelas (Python).

export interface Indikator {
  kode: "pendapatan" | "aset" | "tabungan" | "kelangsungan" | "cibest";
  nama: string;
  satuan: string;
  l: number;
  u: number;
}

export interface PertanyaanAsesmen {
  kode: string;
  teks: string;
  bobot: number;
  gugur_bila_nol: boolean;
}

export interface Parameter {
  versi: string;
  status: string;
  indikator: Indikator[];
  metode_bobot: "manual" | "ahp" | "entropi";
  bobot: number[];
  ahp_matriks: number[][];
  rho: number;
  ambang: number[];
  had_kifayah_rt_bulanan: number;
  nisab_gram: number;
  harga_emas_per_gram: number;
  tarif_zakat: number;
  ambang_bulan_aktif: number;
  jendela_rata_bulan: number;
  bulan_penurunan_bertahap: number;
  cusum: { mu0: number; kappa: number; h: number; basis_bulan: number };
  markov: { langkah_bulan: number; n_sampel: number; prior_alpha: number[][] };
  sensitivitas: { n_sampel: number; konsentrasi: number };
  asesmen: { ambang_produktif: number; pertanyaan: PertanyaanAsesmen[] };
}

export interface Bulanan {
  omzet: number[];
  biaya: number[];
  pendapatan_lain: number[];
  tabungan: number[];
  pengeluaran: number[];
  kekayaan: number[];
  aktif: number[];
  cibest_m: number[];
  cibest_s: number[];
}

export interface Kunjungan {
  tanggal: string;
  bulan: number;
  ceklis: boolean[];
  hambatan: string[];
  catatan: string;
  milestone?: string;
  jadwal_berikut?: string;
  lokal?: boolean;
}

export interface Milestone {
  teks: string;
  bulan_tercapai: number | null;
}

export interface Mustahik {
  id: string;
  alias: string;
  kelompok: string;
  wilayah: string;
  pendamping: string;
  sektor: string;
  anggota_rt: number;
  bulan_usaha_awal: number;
  asesmen_awal: Record<string, number>;
  bulanan: Bulanan;
  kunjungan: Kunjungan[];
  milestone: Milestone[];
}

export interface DataSintetis {
  label: "SINTETIS";
  peringatan: string;
  seed: number;
  n_bulan: number;
  bulan: string[];
  kelompok: { kode: string; nama: string }[];
  ceklis: string[];
  hambatan: string[];
  mustahik: Mustahik[];
}

export interface Skor {
  bulan: number;
  G: number | null;
  tahap: number;
  alasan: string;
  x?: number[];
  s?: number[];
  kontribusi?: number[];
  penghambat?: number | null;
  ditahan_nisab?: boolean;
  versi: string;
}
