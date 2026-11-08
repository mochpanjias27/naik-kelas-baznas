// Sensitivitas peringkat terhadap bobot. Port dari engine/naik_kelas/sensitivitas.py.

import { ces } from "./ces";
import { tentukanTahap } from "./tahap";
import { dirichlet, kuantil, mulberry32 } from "./acak";

/** Kendall tau-b (menangani ikatan). */
export function kendallTau(a: number[], b: number[]): number {
  const n = a.length;
  if (n !== b.length) throw new Error("Panjang deret harus sama.");
  if (n < 2) return 1;
  let s = 0;
  let n0 = 0;
  let ikatA = 0;
  let ikatB = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const da = Math.sign(a[i] - a[j]);
      const db = Math.sign(b[i] - b[j]);
      s += da * db;
      n0++;
      if (da === 0) ikatA++;
      if (db === 0) ikatB++;
    }
  const ta = n0 - ikatA;
  const tb = n0 - ikatB;
  if (ta === 0 || tb === 0) return ta === tb ? 1 : 0;
  return s / Math.sqrt(ta * tb);
}

export function analisisSensitivitas(opsi: {
  S: number[][];
  wDasar: number[];
  rho: number;
  ambang: number[];
  kekayaan: number[];
  nisab: number;
  nSampel?: number;
  konsentrasi?: number;
  seed?: number;
  sampelBobot?: number[][];
}) {
  const { S, wDasar, rho, ambang, kekayaan, nisab } = opsi;
  const n = S.length;
  const hitung = (w: number[]) => {
    const g = S.map((s) => ces(s, w, rho));
    const t = g.map((gi, i) => tentukanTahap(gi, ambang, kekayaan[i], nisab).tahap);
    return { g, t };
  };
  const dasar = hitung(wDasar);
  let sampel = opsi.sampelBobot;
  if (!sampel) {
    const rng = mulberry32(opsi.seed ?? 0);
    const c = opsi.konsentrasi ?? 20;
    const alpha = wDasar.map((w) => Math.max(c * w, 1e-3));
    sampel = Array.from({ length: opsi.nSampel ?? 1000 }, () => dirichlet(rng, alpha));
  }
  const taus: number[] = [];
  const ganti: number[] = [];
  const gantiOrang = new Array(n).fill(0);
  for (const wRaw of sampel) {
    const tot = wRaw.reduce((a, b) => a + b, 0);
    const w = wRaw.map((v) => v / tot);
    const r = hitung(w);
    taus.push(kendallTau(dasar.g, r.g));
    let beda = 0;
    r.t.forEach((t, i) => {
      if (t !== dasar.t[i]) {
        beda++;
        gantiOrang[i]++;
      }
    });
    ganti.push(beda / n);
  }
  const rata = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
  return {
    tau: taus,
    tau_rata: rata(taus),
    tau_q05: kuantil(taus, 0.05),
    tau_q95: kuantil(taus, 0.95),
    proporsi_ganti_tahap: ganti,
    proporsi_ganti_rata: rata(ganti),
    peluang_ganti_per_orang: gantiOrang.map((v) => v / sampel!.length),
    g_dasar: dasar.g,
    tahap_dasar: dasar.t,
    sampel_bobot: sampel,
  };
}
