// Indikator bulanan dan skor graduasi. Port dari engine/naik_kelas/indikator.py.

import { ces, gradien, kontribusi, normalisasi } from "./ces";
import { nisabRupiah, tentukanTahap } from "./tahap";
import type { Mustahik, Parameter, Skor } from "./tipe";

export function hitungIndikator(m: Mustahik, t: number, p: Parameter): number[] {
  const b = m.bulanan;
  const a = Math.max(0, t - p.jendela_rata_bulan + 1);
  const pend: number[] = [];
  const tab: number[] = [];
  for (let i = a; i <= t; i++) {
    pend.push(b.omzet[i] - b.biaya[i] + b.pendapatan_lain[i]);
    tab.push(b.tabungan[i]);
  }
  const jumlahPend = pend.reduce((x, y) => x + y, 0);
  const jumlahTab = tab.reduce((x, y) => x + y, 0);
  const N = nisabRupiah(p.nisab_gram, p.harga_emas_per_gram);
  const nilai: Record<string, number> = {
    pendapatan: jumlahPend / pend.length / p.had_kifayah_rt_bulanan,
    aset: b.kekayaan[t] / N,
    tabungan: jumlahPend > 0 ? jumlahTab / jumlahPend : 0,
    kelangsungan: (m.bulan_usaha_awal + t + 1) / p.ambang_bulan_aktif,
    cibest: 0.5 * b.cibest_m[t] + 0.5 * b.cibest_s[t],
  };
  return p.indikator.map((ind) => nilai[ind.kode]);
}

export function bobotTernormal(p: Parameter): number[] {
  const s = p.bobot.reduce((a, b) => a + b, 0);
  return p.bobot.map((v) => v / s);
}

export function skorBulanan(m: Mustahik, t: number, p: Parameter): Skor {
  if (!m.bulanan.aktif[t]) return { bulan: t, G: null, tahap: 6, alasan: "Usaha tidak aktif (keluar/gagal).", versi: p.versi };
  const x = hitungIndikator(m, t, p);
  const s = normalisasi(
    x,
    p.indikator.map((i) => i.l),
    p.indikator.map((i) => i.u),
  );
  const w = bobotTernormal(p);
  const G = ces(s, w, p.rho);
  const N = nisabRupiah(p.nisab_gram, p.harga_emas_per_gram);
  const th = tentukanTahap(G, p.ambang, m.bulanan.kekayaan[t], N);
  const gr = gradien(s, w, p.rho).map((g, k) => (s[k] < 1 ? g : -1));
  const adaRuang = s.some((v) => v < 1);
  let hambat: number | null = null;
  if (adaRuang) {
    hambat = 0;
    gr.forEach((g, k) => {
      if (g > gr[hambat!]) hambat = k;
    });
  }
  return {
    bulan: t,
    x,
    s,
    G,
    tahap: th.tahap,
    alasan: th.alasan,
    ditahan_nisab: th.ditahan_nisab,
    kontribusi: kontribusi(s, w, p.rho),
    penghambat: hambat,
    versi: p.versi,
  };
}

/** Deret y untuk CUSUM: laba bulanan dibagi rata-rata laba pada bulan basis awal. */
export function deretCusum(m: Mustahik, p: Parameter): number[] {
  const laba = m.bulanan.omzet.map((o, i) => o - m.bulanan.biaya[i]);
  const nb = p.cusum.basis_bulan;
  const basis = Math.max(1, laba.slice(0, nb).reduce((a, b) => a + b, 0) / nb);
  return laba.map((l, i) => (m.bulanan.aktif[i] ? l / basis : NaN));
}
