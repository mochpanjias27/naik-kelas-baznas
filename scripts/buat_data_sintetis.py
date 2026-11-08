"""Membangkitkan public/data/sintetis.json dan fixture rujukan uji silang.

Jalankan dari akar repo:  python scripts/buat_data_sintetis.py
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

AKAR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AKAR / "engine"))

import numpy as np  # noqa: E402

from naik_kelas import parameter_bawaan, skor_bulanan  # noqa: E402
from naik_kelas.sintetis import simpan  # noqa: E402


def main():
    p = parameter_bawaan()
    data = simpan(AKAR / "public" / "data" / "sintetis.json", had_kifayah=p["had_kifayah_rt_bulanan"])

    # Fixture rujukan: skor 20 mustahik pertama di semua bulan, untuk uji silang TS.
    rujukan = []
    for m in data["mustahik"][:20]:
        for t in range(data["n_bulan"]):
            r = skor_bulanan(m, t, p)
            rujukan.append({
                "id": m["id"],
                "bulan": t,
                "G": r["G"],
                "tahap": r["tahap"],
                "kontribusi": None if r["G"] is None else [float(v) for v in r["kontribusi"]],
            })
    out = AKAR / "tests" / "fixtures" / "rujukan_skor.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rujukan), encoding="utf-8")

    # Ringkasan sebaran tahap pada bulan terakhir
    akhir = Counter(skor_bulanan(m, data["n_bulan"] - 1, p)["tahap"] for m in data["mustahik"])
    print("Sebaran tahap bulan terakhir:", dict(sorted(akhir.items())))
    ukuran = (AKAR / "public" / "data" / "sintetis.json").stat().st_size
    print(f"sintetis.json: {ukuran / 1024:.0f} KB; rujukan: {len(rujukan)} baris")


if __name__ == "__main__":
    np.set_printoptions(precision=3)
    main()
