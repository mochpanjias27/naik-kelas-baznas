// Indeks graduasi CES. Port dari engine/naik_kelas/ces.py (rujukan).
// Dihitung di ruang log (log-sum-exp) agar stabil untuk rho negatif besar.

export const RHO_NOL = 1e-9;

const clip01 = (v: number) => Math.min(1, Math.max(0, v));

export function cekBobot(w: number[]): number[] {
  if (w.length === 0) throw new Error("Bobot harus vektor tak kosong.");
  if (w.some((v) => v < -1e-12)) throw new Error("Bobot tidak boleh negatif.");
  const c = w.map((v) => Math.max(0, v));
  const total = c.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new Error("Jumlah bobot harus positif.");
  if (Math.abs(total - 1) > 1e-6) throw new Error(`Bobot harus berjumlah 1 (didapat ${total.toFixed(6)}).`);
  return c.map((v) => v / total);
}

export function normalisasi(x: number[], l: number[], u: number[]): number[] {
  return x.map((xi, k) => {
    if (u[k] <= l[k]) throw new Error("Batas atas u_k harus lebih besar dari batas bawah l_k.");
    return clip01((xi - l[k]) / (u[k] - l[k]));
  });
}

function logSuku(s: number[], w: number[], rho: number): { log: number[]; aktif: boolean[] } {
  const aktif = s.map((sk, k) => w[k] > 0 && sk > 0);
  const log = s.map((sk, k) => (aktif[k] ? Math.log(w[k]) + rho * Math.log(sk) : -Infinity));
  return { log, aktif };
}

export function ces(sIn: number[], wIn: number[], rho: number): number {
  const s = sIn.map(clip01);
  const w = cekBobot(wIn);
  if (s.length !== w.length) throw new Error("Panjang s dan w harus sama.");
  const berbobot = w.map((v) => v > 0);

  if (Math.abs(rho) < RHO_NOL) {
    if (s.some((sk, k) => berbobot[k] && sk === 0)) return 0;
    let acc = 0;
    s.forEach((sk, k) => {
      if (berbobot[k]) acc += w[k] * Math.log(sk);
    });
    return Math.exp(acc);
  }
  if (rho < 0 && s.some((sk, k) => berbobot[k] && sk === 0)) return 0;

  const { log, aktif } = logSuku(s, w, rho);
  if (!aktif.some(Boolean)) return 0;
  const m = Math.max(...log.filter((_, k) => aktif[k]));
  let sum = 0;
  log.forEach((v, k) => {
    if (aktif[k]) sum += Math.exp(v - m);
  });
  const g = Math.exp((m + Math.log(sum)) / rho);
  return clip01(g);
}

/** Dekomposisi Euler: c_k = G * w_k s_k^rho / sum_j w_j s_j^rho, dengan sum c_k = G. */
export function kontribusi(sIn: number[], wIn: number[], rho: number): number[] {
  const s = sIn.map(clip01);
  const w = cekBobot(wIn);
  const g = ces(s, w, rho);
  if (g === 0) return s.map(() => 0);
  if (Math.abs(rho) < RHO_NOL) return w.map((wk) => g * wk);
  const { log, aktif } = logSuku(s, w, rho);
  const m = Math.max(...log.filter((_, k) => aktif[k]));
  const e = log.map((v, k) => (aktif[k] ? Math.exp(v - m) : 0));
  const tot = e.reduce((a, b) => a + b, 0);
  return e.map((v) => (g * v) / tot);
}

/** dG/ds_k = w_k s_k^(rho-1) G^(1-rho); +Infinity bila s_k = 0 dan rho < 1. */
export function gradien(sIn: number[], wIn: number[], rho: number): number[] {
  const s = sIn.map(clip01);
  const w = cekBobot(wIn);
  const g = ces(s, w, rho);
  return s.map((sk, k) => {
    if (w[k] === 0) return 0;
    if (sk === 0) return rho < 1 ? Infinity : w[k] * (g > 0 ? Math.pow(g, 1 - rho) : 0);
    if (g === 0) return 0;
    return w[k] * Math.exp((rho - 1) * Math.log(sk) + (1 - rho) * Math.log(g));
  });
}
