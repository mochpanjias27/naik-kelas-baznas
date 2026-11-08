// Pembangkit bilangan acak ber-seed untuk simulasi yang dapat direproduksi.
// Catatan: barisan acak TS berbeda dari NumPy; hasil Monte Carlo serupa secara
// statistik, bukan identik angka per angka.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normal(rng: () => number): number {
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Gamma(shape, 1) dengan metode Marsaglia-Tsang. */
export function gamma(rng: () => number, shape: number): number {
  if (shape < 1) {
    const u = rng() || 1e-300;
    return gamma(rng, shape + 1) * Math.pow(u, 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do {
      x = normal(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

export function dirichlet(rng: () => number, alpha: number[]): number[] {
  const g = alpha.map((a) => gamma(rng, a));
  const s = g.reduce((a, b) => a + b, 0);
  return g.map((v) => v / s);
}

export function kuantil(arr: number[], q: number): number {
  const a = [...arr].sort((x, y) => x - y);
  if (a.length === 0) return NaN;
  const pos = (a.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return a[lo] + (a[hi] - a[lo]) * (pos - lo);
}
