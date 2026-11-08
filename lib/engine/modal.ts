// Model jebakan kemiskinan sederhana (ilustratif). Port dari engine/naik_kelas/modal.py.

export interface ModalParam {
  alpha: number;
  A_L: number;
  A_H: number;
  F: number;
  s: number;
  delta: number;
  k0: number;
}

export const MODAL_BAWAAN: ModalParam = { alpha: 0.5, A_L: 1, A_H: 4, F: 8, s: 0.25, delta: 0.1, k0: 3 };

export function cekModal(p: ModalParam) {
  if (!(p.alpha > 0 && p.alpha < 1)) throw new Error("alpha harus di (0, 1).");
  if (p.A_L <= 0 || p.A_H <= 0 || p.F < 0) throw new Error("A_L, A_H harus positif dan F >= 0.");
  if (!(p.s > 0 && p.s <= 1) || !(p.delta > 0 && p.delta <= 1)) throw new Error("s dan delta harus di (0, 1].");
  if (p.k0 < 0) throw new Error("k0 tidak boleh negatif.");
}

export const produksi = (k: number, p: ModalParam) => {
  const ka = Math.pow(Math.max(k, 0), p.alpha);
  return Math.max(p.A_L * ka, p.A_H * ka - p.F);
};

export const phi = (k: number, p: ModalParam) => p.s * produksi(k, p) - p.delta * k;

function biseksi(fn: (x: number) => number, a: number, b: number) {
  let fa = fn(a);
  for (let i = 0; i < 200; i++) {
    const m = 0.5 * (a + b);
    const fm = fn(m);
    if (fa * fm <= 0) b = m;
    else {
      a = m;
      fa = fm;
    }
    if (b - a < 1e-12 * Math.max(1, Math.abs(m))) break;
  }
  return 0.5 * (a + b);
}

export function batasK(p: ModalParam) {
  return 4 * Math.pow((p.s * Math.max(p.A_H, p.A_L)) / p.delta, 1 / (1 - p.alpha)) + 10;
}

export function titikTetap(p: ModalParam, nGrid = 20000) {
  cekModal(p);
  const kMaks = batasK(p);
  const lo = Math.log(1e-8);
  const hi = Math.log(kMaks);
  const grid = Array.from({ length: nGrid }, (_, i) => Math.exp(lo + ((hi - lo) * i) / (nGrid - 1)));
  const nilai = grid.map((k) => phi(k, p));
  const hasil: { k: number; jenis: "stabil" | "tak stabil" }[] = [];
  for (let i = 0; i < nGrid - 1; i++) {
    const a = nilai[i];
    const b = nilai[i + 1];
    if (a === 0) continue;
    if (a * b < 0 || b === 0) {
      const akar = b !== 0 ? biseksi((x) => phi(x, p), grid[i], grid[i + 1]) : grid[i + 1];
      hasil.push({ k: akar, jenis: a > 0 ? "stabil" : "tak stabil" });
    }
  }
  return hasil;
}

export function lintasanModal(p: ModalParam, kAwal: number, n = 60): number[] {
  const k = [kAwal];
  for (let t = 0; t < n; t++) k.push((1 - p.delta) * k[t] + p.s * produksi(k[t], p));
  return k;
}

export function analisisModal(p: ModalParam) {
  const tt = titikTetap(p);
  const takStabil = tt.filter((x) => x.jenis === "tak stabil").map((x) => x.k);
  const kHat = takStabil.length ? Math.min(...takStabil) : null;
  const z = kHat === null ? null : Math.max(0, kHat - p.k0);
  const pesan =
    kHat === null
      ? "Pada parameter yang dipilih model tidak memiliki jebakan kemiskinan (tidak ada titik tetap tak stabil), sehingga modal minimum tidak terdefinisi."
      : `Ambang jebakan k̂ = ${kHat.toFixed(3)}. Dengan modal awal k0 = ${p.k0}, suntikan minimum z* = ${z!.toFixed(3)} (satuan modal ilustratif).`;
  return { titik_tetap: tt, k_hat: kHat, z_star: z, ada_jebakan: kHat !== null, pesan };
}
