// Rantai Markov dengan keadaan penyerap. Port dari engine/naik_kelas/markov.py.
// Keadaan: 0..3 = tahap 1-4 (transien), 4 = Muzakki, 5 = Keluar/gagal.

import { dirichlet, kuantil, mulberry32 } from "./acak";

export const N_TRANSIEN = 4;
export const N_KEADAAN = 6;

export function invers(A: number[][]): number[][] {
  const n = A.length;
  const M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-14) throw new Error("Matriks singular.");
    [M[c], M[piv]] = [M[piv], M[c]];
    const p = M[c][c];
    for (let j = 0; j < 2 * n; j++) M[c][j] /= p;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      if (f !== 0) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((r) => r.slice(n));
}

export const kali = (A: number[][], B: number[][]) =>
  A.map((r) => B[0].map((_, j) => r.reduce((acc, a, k) => acc + a * B[k][j], 0)));

export function matriksFundamental(Q: number[][]): number[][] {
  const n = Q.length;
  return invers(Q.map((r, i) => r.map((q, j) => (i === j ? 1 : 0) - q)));
}

export function waktuSerap(Q: number[][]): number[] {
  return matriksFundamental(Q).map((r) => r.reduce((a, b) => a + b, 0));
}

export function peluangSerap(Q: number[][], R: number[][]): number[][] {
  Q.forEach((r, i) => {
    const s = r.reduce((a, b) => a + b, 0) + R[i].reduce((a, b) => a + b, 0);
    if (Math.abs(s - 1) > 1e-6) throw new Error("Setiap baris [Q R] harus berjumlah 1.");
  });
  return kali(matriksFundamental(Q), R);
}

/** Matriks frekuensi transisi 4x6; transisi tiap `langkah` periode; berhenti setelah terserap. */
export function hitungTransisi(lintasan: number[][], langkah = 1): number[][] {
  const n = Array.from({ length: N_TRANSIEN }, () => new Array(N_KEADAAN).fill(0));
  for (const seq of lintasan) {
    const sub = seq.filter((_, i) => i % langkah === 0);
    for (let i = 0; i + 1 < sub.length; i++) {
      const a = sub[i];
      const b = sub[i + 1];
      if (a >= 5) break;
      n[a - 1][b - 1] += 1;
      if (b >= 5) break;
    }
  }
  return n;
}

export function ringkasP(P: number[][]) {
  const Q = P.slice(0, N_TRANSIEN).map((r) => r.slice(0, N_TRANSIEN));
  const R = P.slice(0, N_TRANSIEN).map((r) => r.slice(N_TRANSIEN));
  const M = matriksFundamental(Q);
  return { Q, R, M, t: M.map((r) => r.reduce((a, b) => a + b, 0)), B: kali(M, R) };
}

export function estimasiPosterior(n: number[][], alpha: number[][], nSampel = 1000, seed = 0, tingkat = 0.95) {
  if (alpha.some((r) => r.some((a) => !(a > 0)))) throw new Error("Parameter prior Dirichlet harus positif.");
  const post = alpha.map((r, i) => r.map((a, j) => a + n[i][j]));
  const Prata = post.map((r) => {
    const s = r.reduce((a, b) => a + b, 0);
    return r.map((v) => v / s);
  });
  const rng = mulberry32(seed);
  const tS: number[][] = [];
  const BS: number[][][] = [];
  for (let i = 0; i < nSampel; i++) {
    const P = post.map((r) => dirichlet(rng, r));
    const r = ringkasP(P);
    tS.push(r.t);
    BS.push(r.B);
  }
  const a = (1 - tingkat) / 2;
  const rata = ringkasP(Prata);
  const q = (fn: (k: number) => number[], k: number, p: number) => kuantil(fn(k), p);
  const kolomT = (k: number) => tS.map((t) => t[k]);
  const kolomB = (k: number, j: number) => BS.map((B) => B[k][j]);
  return {
    P_rata: Prata,
    t_rata: rata.t,
    B_rata: rata.B,
    t_bawah: rata.t.map((_, k) => q(kolomT, k, a)),
    t_atas: rata.t.map((_, k) => q(kolomT, k, 1 - a)),
    B_bawah: rata.B.map((r, k) => r.map((_, j) => kuantil(kolomB(k, j), a))),
    B_atas: rata.B.map((r, k) => r.map((_, j) => kuantil(kolomB(k, j), 1 - a))),
    tingkat,
  };
}

export function simulasiLintasan(P: number[][], keadaanAwal: number, nLangkah: number, nSim = 1000, seed = 0) {
  const rng = mulberry32(seed);
  const cum = P.map((r) => {
    let s = 0;
    return r.map((v) => (s += v));
  });
  let keadaan = new Array(nSim).fill(keadaanAwal - 1);
  const sebaran: number[][] = [];
  const hitung = (ks: number[]) => {
    const c = new Array(N_KEADAAN).fill(0);
    ks.forEach((k) => c[k]++);
    return c.map((v) => v / nSim);
  };
  sebaran.push(hitung(keadaan));
  const waktu: number[] = [];
  for (let t = 1; t <= nLangkah; t++) {
    keadaan = keadaan.map((s) => {
      const u = rng();
      let j = cum[s].findIndex((c) => u < c);
      if (j < 0) j = N_KEADAAN - 1;
      if (s < N_TRANSIEN && j >= N_TRANSIEN) waktu.push(t);
      return j;
    });
    sebaran.push(hitung(keadaan));
  }
  const akhir = sebaran[sebaran.length - 1];
  return {
    sebaran,
    proporsi_muzakki: akhir[4],
    proporsi_keluar: akhir[5],
    rata_waktu_terserap: waktu.length ? waktu.reduce((a, b) => a + b, 0) / waktu.length : null,
  };
}
