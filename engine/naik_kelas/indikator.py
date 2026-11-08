"""Penghitungan indikator bulanan dan skor graduasi untuk satu mustahik.

Struktur data mustahik (lihat sintetis.py):
    {"id", "anggota_rt", "bulan_usaha_awal", "bulanan": {
        "omzet", "biaya", "pendapatan_lain", "tabungan", "pengeluaran",
        "kekayaan", "aktif", "cibest_m", "cibest_s"}}   # setiap kolom: list per bulan
"""

from __future__ import annotations

import numpy as np

from .ces import normalisasi, ces, kontribusi, gradien
from .tahap import nisab_rupiah, tentukan_tahap


def hitung_indikator(m: dict, t: int, p: dict) -> np.ndarray:
    """Nilai mentah x_k pada bulan t (0-basis), urutan sesuai p['indikator']."""
    b = m["bulanan"]
    jendela = int(p.get("jendela_rata_bulan", 3))
    a = max(0, t - jendela + 1)
    pend = [b["omzet"][i] - b["biaya"][i] + b["pendapatan_lain"][i] for i in range(a, t + 1)]
    tab = [b["tabungan"][i] for i in range(a, t + 1)]
    rata_pend = float(np.mean(pend))
    N = nisab_rupiah(p["nisab_gram"], p["harga_emas_per_gram"])
    x_pend = rata_pend / p["had_kifayah_rt_bulanan"]
    x_aset = b["kekayaan"][t] / N
    x_tab = (sum(tab) / sum(pend)) if sum(pend) > 0 else 0.0
    x_lang = (m["bulan_usaha_awal"] + t + 1) / p["ambang_bulan_aktif"]
    x_cib = 0.5 * b["cibest_m"][t] + 0.5 * b["cibest_s"][t]
    nilai = {"pendapatan": x_pend, "aset": x_aset, "tabungan": x_tab, "kelangsungan": x_lang, "cibest": x_cib}
    return np.array([nilai[ind["kode"]] for ind in p["indikator"]], dtype=float)


def skor_bulanan(m: dict, t: int, p: dict) -> dict:
    """Skor graduasi lengkap beserta penjelasan, atau tahap 6 bila usaha tidak aktif."""
    if not m["bulanan"]["aktif"][t]:
        return {"bulan": t, "G": None, "tahap": 6, "alasan": "Usaha tidak aktif (keluar/gagal).", "versi": p["versi"]}
    x = hitung_indikator(m, t, p)
    l = [ind["l"] for ind in p["indikator"]]
    u = [ind["u"] for ind in p["indikator"]]
    s = normalisasi(x, l, u)
    w = np.asarray(p["bobot"], dtype=float)
    w = w / w.sum()
    g = ces(s, w, p["rho"])
    N = nisab_rupiah(p["nisab_gram"], p["harga_emas_per_gram"])
    th = tentukan_tahap(g, p["ambang"], m["bulanan"]["kekayaan"][t], N)
    c = kontribusi(s, w, p["rho"])
    gr = gradien(s, w, p["rho"])
    gr_terbatas = np.where(s < 1, gr, -1.0)
    hambat = int(np.argmax(gr_terbatas)) if np.any(s < 1) else None
    return {
        "bulan": t,
        "x": x,
        "s": s,
        "G": g,
        "tahap": th["tahap"],
        "alasan": th["alasan"],
        "kontribusi": c,
        "penghambat": hambat,
        "versi": p["versi"],
    }
