"""Analisis sensitivitas peringkat terhadap bobot (sampling Dirichlet)."""

from __future__ import annotations

import numpy as np

from .ces import ces
from .tahap import tentukan_tahap


def kendall_tau(a, b) -> float:
    """Kendall tau-b (menangani ikatan). Mengembalikan 1.0 untuk deret identik."""
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    n = a.size
    if n != b.size:
        raise ValueError("Panjang deret harus sama.")
    if n < 2:
        return 1.0
    i, j = np.triu_indices(n, k=1)
    da = np.sign(a[i] - a[j])
    db = np.sign(b[i] - b[j])
    s = np.sum(da * db)
    n0 = i.size
    ta = n0 - np.sum(da == 0)  # pasangan tak terikat pada a
    tb = n0 - np.sum(db == 0)
    if ta == 0 or tb == 0:
        return 1.0 if ta == tb else 0.0
    return float(s / np.sqrt(ta * tb))


def analisis_sensitivitas(
    S,
    w_dasar,
    rho: float,
    ambang,
    kekayaan,
    nisab: float,
    n_sampel: int = 1000,
    konsentrasi: float = 20.0,
    seed: int = 0,
    sampel_bobot=None,
) -> dict:
    """S: matriks n x K nilai ternormalisasi. Bobot sampel ~ Dirichlet(konsentrasi * w_dasar).

    Bila `sampel_bobot` diberikan (matriks m x K), sampel tersebut dipakai
    langsung (berguna untuk pengujian).
    """
    S = np.asarray(S, dtype=float)
    w_dasar = np.asarray(w_dasar, dtype=float)
    kekayaan = np.asarray(kekayaan, dtype=float)
    n, K = S.shape

    def skor_dan_tahap(w):
        g = np.array([ces(S[i], w, rho) for i in range(n)])
        t = np.array([tentukan_tahap(g[i], ambang, kekayaan[i], nisab)["tahap"] for i in range(n)])
        return g, t

    g0, t0 = skor_dan_tahap(w_dasar)
    if sampel_bobot is None:
        rng = np.random.default_rng(seed)
        alpha = np.maximum(konsentrasi * w_dasar, 1e-3)
        sampel_bobot = rng.dirichlet(alpha, size=n_sampel)
    sampel_bobot = np.asarray(sampel_bobot, dtype=float)
    taus = np.empty(len(sampel_bobot))
    ganti = np.empty(len(sampel_bobot))
    ganti_per_orang = np.zeros(n)
    for m, w in enumerate(sampel_bobot):
        w = w / w.sum()
        g, t = skor_dan_tahap(w)
        taus[m] = kendall_tau(g0, g)
        beda = t != t0
        ganti[m] = beda.mean()
        ganti_per_orang += beda
    return {
        "tau": taus,
        "tau_rata": float(taus.mean()),
        "tau_q05": float(np.quantile(taus, 0.05)),
        "tau_q95": float(np.quantile(taus, 0.95)),
        "proporsi_ganti_tahap": ganti,
        "proporsi_ganti_rata": float(ganti.mean()),
        "peluang_ganti_per_orang": ganti_per_orang / len(sampel_bobot),
        "g_dasar": g0,
        "tahap_dasar": t0,
    }
