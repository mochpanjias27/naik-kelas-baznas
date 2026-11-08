// Uji mesin TypeScript: uji wajib yang sama dengan Python + uji silang fixture.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  PARAMETER_BAWAAN as P,
  analisisModal,
  analisisSensitivitas,
  bobotAhp,
  bobotEntropi,
  ces,
  cusum,
  estimasiPosterior,
  hitungTransisi,
  kendallTau,
  kontribusi,
  matriksFundamental,
  mulberry32,
  nilaiAsesmen,
  normalisasi,
  peluangSerap,
  simulasiLintasan,
  skorBulanan,
  statusBantuan,
  tentukanTahap,
  waktuSerap,
  MODAL_BAWAAN,
  dirichlet,
  type DataSintetis,
} from "./index";

const S1 = [0.5, 1.0];
const W1 = [0.5, 0.5];

describe("Uji wajib 1: CES", () => {
  it("rho = 1 -> 0,75", () => expect(ces(S1, W1, 1)).toBeCloseTo(0.75, 12));
  it("rho -> 0 -> sqrt(0,5)", () => {
    expect(ces(S1, W1, 0)).toBeCloseTo(Math.SQRT1_2, 9);
    expect(ces(S1, W1, 1e-6)).toBeCloseTo(0.7071, 4);
  });
  it("rho = -50 -> ~0,5", () => {
    expect(Math.abs(ces(S1, W1, -50) - 0.5)).toBeLessThan(0.01);
    expect(Math.abs(ces(S1, W1, -5000) - 0.5)).toBeLessThan(1e-3);
  });
  it("s_k = 0 stabil", () => {
    expect(ces([0, 1], W1, 0)).toBe(0);
    expect(ces([0, 1], W1, -3)).toBe(0);
    expect(ces([0, 1], W1, 1)).toBeCloseTo(0.5);
    expect(ces([0, 0.8], [0, 1], -2)).toBeCloseTo(0.8);
  });
});

describe("Uji wajib 2: Markov", () => {
  const Q = [
    [0.5, 0.2],
    [0.1, 0.6],
  ];
  const R = [[0.3], [0.3]];
  it("M", () => {
    const M = matriksFundamental(Q);
    [
      [2.222, 1.111],
      [0.556, 2.778],
    ].forEach((r, i) => r.forEach((v, j) => expect(Math.abs(M[i][j] - v)).toBeLessThan(1e-3)));
  });
  it("t", () => waktuSerap(Q).forEach((v) => expect(Math.abs(v - 3.333)).toBeLessThan(1e-3)));
  it("B", () => peluangSerap(Q, R).forEach((r) => expect(r[0]).toBeCloseTo(1, 12)));
});

describe("Uji wajib 3 & 4: rentang dan monoton", () => {
  const rng = mulberry32(7);
  it("rentang [0,1], bobot berjumlah 1, Euler", () => {
    for (let rep = 0; rep < 50; rep++) {
      const K = 2 + Math.floor(rng() * 6);
      const x = Array.from({ length: K }, () => (rng() - 0.5) * 10);
      const l = Array.from({ length: K }, () => rng() - 0.5);
      const u = l.map((v) => v + 0.1 + rng() * 3);
      const s = normalisasi(x, l, u);
      s.forEach((v) => expect(v >= 0 && v <= 1).toBe(true));
      const w = dirichlet(rng, new Array(K).fill(1));
      expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      for (const rho of [-50, -2, -0.5, 0, 0.3, 1, 3]) {
        const g = ces(s, w, rho);
        expect(g >= 0 && g <= 1).toBe(true);
        expect(kontribusi(s, w, rho).reduce((a, b) => a + b, 0)).toBeCloseTo(g, 9);
      }
    }
  });
  it("monoton", () => {
    for (let rep = 0; rep < 50; rep++) {
      const s = Array.from({ length: 5 }, () => rng());
      if (rep % 3 === 0) s[rep % 5] = 0;
      const w = dirichlet(rng, [1, 1, 1, 1, 1]);
      for (const rho of [-20, -1, 0, 0.5, 1, 2]) {
        const g0 = ces(s, w, rho);
        for (let k = 0; k < 5; k++) {
          const s2 = [...s];
          s2[k] = Math.min(1, s2[k] + rng() * 0.5);
          expect(ces(s2, w, rho)).toBeGreaterThanOrEqual(g0 - 1e-12);
        }
      }
    }
  });
});

describe("Uji wajib 5: CUSUM", () => {
  it("deret konstan di atas mu0 tanpa peringatan", () => {
    const r = cusum(new Array(36).fill(1.2), 1, 0.1, 1);
    expect(r.alarm).toEqual([]);
    expect(r.S.every((v) => v === 0)).toBe(true);
  });
  it("penurunan memicu peringatan di periode ke-9", () => {
    const r = cusum([...new Array(6).fill(1), ...new Array(6).fill(0.5)], 1, 0.1, 1);
    expect(r.alarm_pertama).toBe(8);
    expect(r.alasan).toContain("periode ke-9");
  });
});

describe("Uji wajib 6: sensitivitas", () => {
  it("tau = 1 bila bobot sampel = bobot dasar", () => {
    const rng = mulberry32(1);
    const S = Array.from({ length: 40 }, () => Array.from({ length: 5 }, () => rng()));
    const w = [0.3, 0.2, 0.15, 0.15, 0.2];
    const r = analisisSensitivitas({
      S, wDasar: w, rho: 0.5, ambang: P.ambang, kekayaan: new Array(40).fill(0), nisab: 1,
      sampelBobot: new Array(10).fill(w),
    });
    r.tau.forEach((t) => expect(t).toBeCloseTo(1, 12));
    expect(r.proporsi_ganti_rata).toBe(0);
  });
  it("nilai Kendall dikenal", () => {
    expect(kendallTau([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
    expect(kendallTau([1, 2, 3], [1, 3, 2])).toBeCloseTo(1 / 3);
  });
});

describe("Uji tambahan", () => {
  it("tahap & nisab", () => {
    expect(tentukanTahap(0.9, P.ambang, 50, 100).tahap).toBe(4);
    expect(tentukanTahap(0.9, P.ambang, 100, 100).tahap).toBe(5);
    expect(statusBantuan([3, 4, 4])).toBe("Penurunan bantuan bertahap");
    expect(statusBantuan([3, 4, 4, 4, 4, 4, 4])).toBe("Lulus: pemantauan ringan");
  });
  it("AHP konsisten & tak konsisten", () => {
    const w = [0.5, 0.3, 0.2];
    const r = bobotAhp(w.map((a) => w.map((b) => a / b)));
    r.bobot.forEach((v, i) => expect(v).toBeCloseTo(w[i], 9));
    expect(r.CR).toBeCloseTo(0, 9);
    const t = bobotAhp([
      [1, 9, 1 / 9],
      [1 / 9, 1, 9],
      [9, 1 / 9, 1],
    ]);
    expect(t.konsisten).toBe(false);
    expect(bobotAhp(P.ahp_matriks).konsisten).toBe(true);
  });
  it("entropi", () => {
    const S = Array.from({ length: 10 }, (_, i) => [0.5, 0.01 + i * 0.11]);
    const w = bobotEntropi(S);
    expect(w[0]).toBeCloseTo(0);
    expect(w[1]).toBeCloseTo(1);
  });
  it("transisi & posterior", () => {
    const n = hitungTransisi([
      [1, 2, 2, 5, 3],
      [3, 6, 1],
    ]);
    expect(n.flat().reduce((a, b) => a + b, 0)).toBe(4);
    const r = estimasiPosterior(n, P.markov.prior_alpha, 300, 0);
    r.B_rata.forEach((row) => expect(row[0] + row[1]).toBeCloseTo(1, 9));
    r.t_rata.forEach((t, k) => {
      expect(r.t_bawah[k]).toBeLessThanOrEqual(t + 1e-9);
      expect(r.t_atas[k]).toBeGreaterThanOrEqual(t - 1e-9);
    });
  });
  it("Monte Carlo mendekati analitik", () => {
    const P6 = [
      [0.6, 0.3, 0, 0, 0, 0.1],
      [0.1, 0.6, 0.2, 0, 0, 0.1],
      [0, 0.1, 0.6, 0.2, 0, 0.1],
      [0, 0, 0.1, 0.7, 0.2, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1],
    ];
    const Q = P6.slice(0, 4).map((r) => r.slice(0, 4));
    const t = waktuSerap(Q)[0];
    const sim = simulasiLintasan(P6, 1, 400, 4000, 1);
    expect(Math.abs(sim.rata_waktu_terserap! - t) / t).toBeLessThan(0.06);
  });
  it("modal minimum", () => {
    const r = analisisModal(MODAL_BAWAAN);
    const kHat = ((10 - Math.sqrt(20)) / 2) ** 2;
    expect(r.k_hat!).toBeCloseTo(kHat, 6);
    expect(r.z_star!).toBeCloseTo(kHat - 3, 6);
    expect(analisisModal({ ...MODAL_BAWAAN, F: 0 }).ada_jebakan).toBe(false);
  });
  it("asesmen", () => {
    const tiga = Object.fromEntries(P.asesmen.pertanyaan.map((q) => [q.kode, 3]));
    expect(nilaiAsesmen(tiga, P.asesmen).rekomendasi).toBe("Produktif");
    expect(nilaiAsesmen({ ...tiga, motivasi: 0 }, P.asesmen).rekomendasi).toBe("Tetap konsumtif");
  });
});

describe("Uji silang dengan mesin Python (fixture)", () => {
  it("G, tahap, dan kontribusi identik", () => {
    const akar = path.resolve(__dirname, "../..");
    const data = JSON.parse(fs.readFileSync(path.join(akar, "public/data/sintetis.json"), "utf8")) as DataSintetis;
    const rujukan = JSON.parse(fs.readFileSync(path.join(akar, "tests/fixtures/rujukan_skor.json"), "utf8")) as {
      id: string; bulan: number; G: number | null; tahap: number; kontribusi: number[] | null;
    }[];
    const peta = new Map(data.mustahik.map((m) => [m.id, m]));
    expect(rujukan.length).toBeGreaterThan(100);
    for (const r of rujukan) {
      const s = skorBulanan(peta.get(r.id)!, r.bulan, P);
      expect(s.tahap).toBe(r.tahap);
      if (r.G === null) expect(s.G).toBeNull();
      else {
        expect(Math.abs(s.G! - r.G)).toBeLessThan(1e-12);
        s.kontribusi!.forEach((c, k) => expect(Math.abs(c - r.kontribusi![k])).toBeLessThan(1e-12));
      }
    }
  });
});
