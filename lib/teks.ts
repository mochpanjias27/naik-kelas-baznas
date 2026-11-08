// Teks sederhana untuk antarmuka mustahik dan rekomendasi tindakan pendamping.
import type { Analisis } from "./aplikasi";
import type { Parameter } from "./engine";

export const SARAN_MUSTAHIK: Record<string, string> = {
  pendapatan: "menambah pendapatan usaha",
  aset: "menambah aset usaha atau simpanan jangka panjang",
  tabungan: "menyisihkan sebagian pendapatan untuk ditabung",
  kelangsungan: "terus menjalankan usaha secara konsisten",
  cibest: "memperkuat pemenuhan kebutuhan dasar dan ibadah keluarga",
};

const TINDAKAN: Record<string, string> = {
  pendapatan: "Fokus peningkatan omzet: tinjau harga jual, pemasaran, dan akses pasar.",
  aset: "Rencanakan penambahan aset produktif atau simpanan jangka panjang (mis. tabungan emas).",
  tabungan: "Bangun kebiasaan menabung rutin; sepakati target persentase dari pendapatan.",
  kelangsungan: "Usaha relatif muda: jaga kelangsungan, pantau stok dan arus kas mingguan.",
  cibest: "Perkuat pembinaan spiritual dan pastikan kebutuhan dasar rumah tangga terpenuhi.",
};

/** Rekomendasi berbasis aturan sederhana dan transparan (bukan model prediksi). */
export function rekomendasiTindakan(a: Analisis, p: Parameter): { teks: string; dasar: string; mendesak?: boolean }[] {
  const out: { teks: string; dasar: string; mendesak?: boolean }[] = [];
  const t = a.terakhir;
  if (t.tahap === 6) return [{ teks: "Tinjau penyebab usaha berhenti dan pertimbangkan dukungan konsumtif sementara.", dasar: "Status keluar/gagal", mendesak: true }];
  if (a.cusum.aktif_sekarang) out.push({ teks: "Kunjungi dalam 7 hari untuk menelusuri penyebab penurunan laba.", dasar: "Peringatan CUSUM aktif", mendesak: true });
  if (t.penghambat !== null && t.penghambat !== undefined) {
    const kode = p.indikator[t.penghambat].kode;
    out.push({ teks: TINDAKAN[kode], dasar: `Penghambat utama: ${p.indikator[t.penghambat].nama}` });
  }
  if (t.tahap >= 4) out.push({ teks: "Siapkan rencana penurunan bantuan bertahap bersama mustahik.", dasar: `Tahap ${t.tahap}; status: ${a.statusBantuan}` });
  if (t.ditahan_nisab) out.push({ teks: "Indeks sudah tinggi, tetapi kekayaan bersih belum mencapai nisab; fokus pada akumulasi aset.", dasar: "Syarat keras nisab" });
  if (a.stagnan) out.push({ teks: "Tahap tidak berubah ±9 bulan: tinjau ulang model usaha atau pertimbangkan pelatihan.", dasar: "Status stagnan" });
  return out;
}
