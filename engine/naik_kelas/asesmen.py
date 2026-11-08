"""M1 Asesmen kesiapan wirausaha: aturan transparan dan dapat diubah.

Setiap jawaban bernilai 0-3. Skor = 100 * sum(bobot * jawaban) / sum(bobot * 3).
Rekomendasi "Produktif" bila skor >= ambang dan tidak ada butir gugur
(butir bertanda gugur_bila_nol yang dijawab 0). Selain itu "Tetap konsumtif".
Rekomendasi ini hanya masukan bagi amil.
"""

from __future__ import annotations


def nilai_asesmen(jawaban: dict, konfigurasi: dict) -> dict:
    pertanyaan = konfigurasi["pertanyaan"]
    ambang = float(konfigurasi["ambang_produktif"])
    total = 0.0
    maks = 0.0
    gugur = []
    rincian = []
    for q in pertanyaan:
        v = jawaban.get(q["kode"])
        if v is None:
            raise ValueError(f"Jawaban untuk '{q['kode']}' belum diisi.")
        v = int(v)
        if v < 0 or v > 3:
            raise ValueError("Jawaban harus 0-3.")
        total += q["bobot"] * v
        maks += q["bobot"] * 3
        rincian.append({"kode": q["kode"], "teks": q["teks"], "nilai": v, "poin": q["bobot"] * v})
        if q.get("gugur_bila_nol") and v == 0:
            gugur.append(q["teks"])
    skor = 100.0 * total / maks
    produktif = skor >= ambang and not gugur
    alasan = [f"Skor kesiapan {skor:.1f} (ambang {ambang:g})."]
    if gugur:
        alasan.append("Syarat minimal belum terpenuhi: " + "; ".join(gugur) + ".")
    return {
        "skor": skor,
        "rekomendasi": "Produktif" if produktif else "Tetap konsumtif",
        "alasan": alasan,
        "rincian": rincian,
    }
