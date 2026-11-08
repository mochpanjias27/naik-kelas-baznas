// Pembobotan: manual, AHP, entropi. Port dari engine/naik_kelas/bobot.py.
// AHP memakai iterasi pangkat (power iteration) untuk vektor eigen utama;
// matriks positif menjamin konvergensi (teorema Perron-Frobenius).

export const RI_SAATY: Record<number, number> = { 1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49 };

export function bobotManual(w: number[]): number[] {
  if (w.some((v) => v < 0)) throw new Error("Bobot manual tidak boleh negatif.");
  const s = w.reduce((a, b) => a + b, 0);
  if (s <= 0) throw new Error("Jumlah bobot manual harus positif.");
  return w.map((v) => v / s);
}

export function bobotAhp(A: number[][]) {
  const K = A.length;
  if (A.some((r) => r.length !== K)) throw new Error("Matriks perbandingan harus persegi.");
  if (A.some((r) => r.some((v) => !(v > 0)))) throw new Error("Entri matriks perbandingan harus positif.");
  for (let i = 0; i < K; i++)
    for (let j = 0; j < K; j++)
      if (Math.abs(A[i][j] * A[j][i] - 1) > 1e-6) throw new Error("Matriks harus resiprokal: a_ji = 1 / a_ij.");
  let v = new Array(K).fill(1 / K);
  let lam = K;
  for (let it = 0; it < 1000; it++) {
    const Av = A.map((r) => r.reduce((acc, a, j) => acc + a * v[j], 0));
    const s = Av.reduce((a, b) => a + b, 0);
    const baru = Av.map((x) => x / s);
    lam = s; // karena sum(v) = 1, sum(A v) = lambda pada konvergensi
    const beda = baru.reduce((acc, x, i) => acc + Math.abs(x - v[i]), 0);
    v = baru;
    if (beda < 1e-14) break;
  }
  const cr = K <= 2 ? 0 : (lam - K) / ((K - 1) * (RI_SAATY[K] ?? 1.49));
  return { bobot: v, lambda_max: lam, CR: Math.max(cr, 0), konsisten: cr <= 0.1 };
}

export function bobotEntropi(S: number[][]): number[] {
  const n = S.length;
  const K = S[0]?.length ?? 0;
  if (S.some((r) => r.some((v) => v < 0))) throw new Error("Nilai indikator untuk entropi harus >= 0.");
  if (n < 2) return new Array(K).fill(1 / K);
  const d = new Array(K).fill(0);
  for (let j = 0; j < K; j++) {
    const total = S.reduce((a, r) => a + r[j], 0);
    if (total <= 0) continue;
    let e = 0;
    for (const r of S) {
      const p = r[j] / total;
      if (p > 0) e -= p * Math.log(p);
    }
    e /= Math.log(n);
    d[j] = Math.max(0, 1 - e);
  }
  const sd = d.reduce((a, b) => a + b, 0);
  if (sd <= 1e-15) return new Array(K).fill(1 / K);
  return d.map((v) => v / sd);
}
