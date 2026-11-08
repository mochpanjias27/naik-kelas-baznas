// M1 Asesmen kesiapan. Port dari engine/naik_kelas/asesmen.py.
import type { Parameter } from "./tipe";

export function nilaiAsesmen(jawaban: Record<string, number>, konf: Parameter["asesmen"]) {
  let total = 0;
  let maks = 0;
  const gugur: string[] = [];
  const rincian = konf.pertanyaan.map((q) => {
    const v = jawaban[q.kode];
    if (v === undefined || v === null) throw new Error(`Jawaban untuk '${q.kode}' belum diisi.`);
    if (v < 0 || v > 3) throw new Error("Jawaban harus 0-3.");
    total += q.bobot * v;
    maks += q.bobot * 3;
    if (q.gugur_bila_nol && v === 0) gugur.push(q.teks);
    return { kode: q.kode, teks: q.teks, nilai: v, poin: q.bobot * v };
  });
  const skor = (100 * total) / maks;
  const produktif = skor >= konf.ambang_produktif && gugur.length === 0;
  const alasan = [`Skor kesiapan ${skor.toFixed(1)} (ambang ${konf.ambang_produktif}).`];
  if (gugur.length) alasan.push(`Syarat minimal belum terpenuhi: ${gugur.join("; ")}.`);
  return { skor, rekomendasi: produktif ? "Produktif" : "Tetap konsumtif", alasan, rincian };
}
