"""Generator data SINTETIS untuk demonstrasi "Naik Kelas".

Data ini BUKAN data nyata. Semua nama adalah kode samaran ("Mustahik 001").

Asumsi generator (didokumentasikan juga di docs/METODE.md):
1. 200 mustahik, 24 bulan (Nov 2024 - Okt 2026), seed tetap.
2. Tiga kelompok intervensi dengan ukuran sama:
   A = modal saja, B = modal + pendampingan, C = modal + pendampingan + pelatihan.
   Efek kelompok adalah ASUMSI ILUSTRATIF berupa laju tren log-laba bulanan
   (A 0,4%; B 1,2%; C 1,8%) dan tambahan laju menabung untuk C. Angka ini
   tidak berasal dari studi empiris.
3. Log-laba = log laba awal + (tren kelompok + kemampuan individu) * t
   + galat AR(1) (phi = 0,5; sd = 0,10) + guncangan negatif sementara
   (peluang 15% per orang; -0,5 log selama 3-6 bulan).
4. Laba awal ~ lognormal (median Rp1,2 juta); marjin 25-40%; pendapatan lain
   Rp0-0,6 juta; tabungan = laju menabung x pendapatan RT.
5. Kekayaan bersih awal ~ lognormal (median Rp8 juta), bertambah dari tabungan
   dan reinvestasi 10% laba.
6. Peluang usaha berhenti 0,3%/bulan, naik menjadi 2,3% bila laba < 40% laba
   awal. Usaha yang berhenti tidak aktif kembali.
7. Skor CIBEST material dan spiritual (0-1) diperbarui per triwulan.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np

SEED = 20261108
N_MUSTAHIK = 200
N_BULAN = 24
BULAN_AWAL = (2024, 11)

KELOMPOK = [
    {"kode": "A", "nama": "Modal saja", "tren": 0.004, "tambah_tabung": 0.0, "kunjungan_tiap": 6},
    {"kode": "B", "nama": "Modal + pendampingan", "tren": 0.012, "tambah_tabung": 0.0, "kunjungan_tiap": 1},
    {"kode": "C", "nama": "Modal + pendampingan + pelatihan", "tren": 0.018, "tambah_tabung": 0.03, "kunjungan_tiap": 1},
]
SEKTOR = ["Kuliner", "Dagang kelontong", "Jasa", "Kerajinan", "Pertanian/peternakan"]
WILAYAH = ["Wilayah 1", "Wilayah 2", "Wilayah 3", "Wilayah 4", "Wilayah 5"]
CEKLIS = ["Catatan keuangan", "Kondisi tempat usaha", "Stok/bahan baku", "Pemasaran", "Pembinaan spiritual"]
HAMBATAN = ["Modal kurang", "Sepi pembeli", "Harga bahan naik", "Urusan keluarga", "Persaingan", "Cuaca"]
ASESMEN_KODE = ["pengalaman", "motivasi", "waktu", "keterampilan", "tempat_alat", "pasar", "keuangan", "keluarga"]


def label_bulan(t: int) -> str:
    y, m = BULAN_AWAL
    m0 = m - 1 + t
    return f"{y + m0 // 12}-{m0 % 12 + 1:02d}"


def _rp(x: float) -> int:
    return int(round(x / 1000.0) * 1000)


def bangkitkan(seed: int = SEED, n: int = N_MUSTAHIK, n_bulan: int = N_BULAN, had_kifayah: float = 3_000_000) -> dict:
    rng = np.random.default_rng(seed)
    daftar = []
    for i in range(n):
        kel = KELOMPOK[i % 3]
        wil = int(rng.integers(0, len(WILAYAH)))
        anggota = int(rng.integers(2, 8))
        bulan_awal = int(rng.integers(0, 25))
        laba0 = float(np.exp(rng.normal(math.log(1_200_000), 0.4)))
        marjin = float(rng.uniform(0.25, 0.40))
        lain = float(rng.uniform(0, 600_000))
        laju_tabung = float(rng.uniform(0.03, 0.15)) + kel["tambah_tabung"]
        kemampuan = float(rng.normal(0, 0.006))
        W = float(np.clip(np.exp(rng.normal(math.log(8_000_000), 0.8)), 1_000_000, 120_000_000))
        spiritual = float(rng.uniform(0.4, 0.9))
        ada_guncang = rng.random() < 0.15
        g_mulai = int(rng.integers(6, 21)) if ada_guncang else -1
        g_lama = int(rng.integers(3, 7)) if ada_guncang else 0

        kol = {k: [] for k in ["omzet", "biaya", "pendapatan_lain", "tabungan", "pengeluaran", "kekayaan", "aktif", "cibest_m", "cibest_s"]}
        e = 0.0
        aktif = True
        cm = cs = 0.0
        for t in range(n_bulan):
            e = 0.5 * e + rng.normal(0, 0.10)
            guncang = -0.5 if (ada_guncang and g_mulai <= t < g_mulai + g_lama) else 0.0
            laba = laba0 * math.exp((kel["tren"] + kemampuan) * t + e + guncang) if aktif else 0.0
            if aktif:
                bahaya = 0.003 + (0.02 if laba < 0.4 * laba0 else 0.0)
                if rng.random() < bahaya:
                    aktif = False
                    laba = 0.0
            lain_t = max(0.0, lain * (1 + rng.normal(0, 0.1)))
            omzet = laba / marjin if aktif else 0.0
            biaya = omzet - laba if aktif else 0.0
            pend = laba + lain_t
            tab = max(0.0, laju_tabung * pend * (1 + rng.normal(0, 0.2))) if aktif else 0.0
            peng = max(0.0, pend - tab)
            W = max(0.0, W + tab + 0.10 * laba + (0.5 * guncang * laba0 if guncang else 0.0))
            if t % 3 == 0:
                cm = float(np.clip(0.8 * min(1.0, pend / had_kifayah) + rng.normal(0.1, 0.05), 0, 1))
                spiritual = float(np.clip(spiritual + (0.015 if kel["kunjungan_tiap"] == 1 else 0.0) + rng.normal(0, 0.03), 0, 1))
                cs = spiritual
            kol["omzet"].append(_rp(omzet))
            kol["biaya"].append(_rp(biaya))
            kol["pendapatan_lain"].append(_rp(lain_t))
            kol["tabungan"].append(_rp(tab))
            kol["pengeluaran"].append(_rp(peng))
            kol["kekayaan"].append(_rp(W))
            kol["aktif"].append(1 if aktif else 0)
            kol["cibest_m"].append(round(cm, 3))
            kol["cibest_s"].append(round(cs, 3))

        # kunjungan pendamping
        kunjungan = []
        for t in range(0, n_bulan, kel["kunjungan_tiap"]):
            if not kol["aktif"][t]:
                break
            hari = int(rng.integers(3, 27))
            ceklis = [bool(rng.random() < 0.75) for _ in CEKLIS]
            hamb = [HAMBATAN[j] for j in range(len(HAMBATAN)) if rng.random() < 0.15]
            kunjungan.append({
                "tanggal": f"{label_bulan(t)}-{hari:02d}",
                "bulan": t,
                "ceklis": ceklis,
                "hambatan": hamb,
                "catatan": "Kunjungan rutin (catatan sintetis).",
            })

        # milestone dihitung dari data
        laba_seri = [o - b for o, b in zip(kol["omzet"], kol["biaya"])]
        base = max(1, np.mean(laba_seri[:3]))
        naik20 = next((t for t in range(3, n_bulan) if kol["aktif"][t] and laba_seri[t] >= 1.2 * base), None)
        tabung6 = next((t for t in range(5, n_bulan) if all(kol["tabungan"][j] > 0 for j in range(t - 5, t + 1))), None)
        milestone = [
            {"teks": "Mencatat keuangan usaha 3 bulan berturut-turut", "bulan_tercapai": 2},
            {"teks": "Laba naik 20% dari rata-rata 3 bulan pertama", "bulan_tercapai": naik20},
            {"teks": "Menabung 6 bulan berturut-turut", "bulan_tercapai": tabung6},
        ]
        jawaban = {k: int(np.clip(rng.normal(2.1, 0.7), 0, 3).round()) for k in ASESMEN_KODE}
        jawaban["motivasi"] = max(1, jawaban["motivasi"])
        jawaban["waktu"] = max(1, jawaban["waktu"])

        daftar.append({
            "id": f"M{i + 1:03d}",
            "alias": f"Mustahik {i + 1:03d}",
            "kelompok": kel["kode"],
            "wilayah": WILAYAH[wil],
            "pendamping": f"Pendamping {wil + 1}",
            "sektor": SEKTOR[int(rng.integers(0, len(SEKTOR)))],
            "anggota_rt": anggota,
            "bulan_usaha_awal": bulan_awal,
            "asesmen_awal": jawaban,
            "bulanan": kol,
            "kunjungan": kunjungan,
            "milestone": milestone,
        })

    return {
        "label": "SINTETIS",
        "peringatan": "Data sintetis untuk demonstrasi. Bukan data nyata.",
        "seed": seed,
        "n_bulan": n_bulan,
        "bulan": [label_bulan(t) for t in range(n_bulan)],
        "kelompok": [{"kode": k["kode"], "nama": k["nama"]} for k in KELOMPOK],
        "ceklis": CEKLIS,
        "hambatan": HAMBATAN,
        "mustahik": daftar,
    }


def simpan(path: str | Path, **kw) -> dict:
    data = bangkitkan(**kw)
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    return data
