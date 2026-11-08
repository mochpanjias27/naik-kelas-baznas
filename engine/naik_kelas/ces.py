"""Indeks graduasi berbasis agregasi CES (constant elasticity of substitution).

    s_k = min{1, max{0, (x_k - l_k) / (u_k - l_k)}}
    G   = ( sum_k w_k s_k^rho )^(1/rho),   w di simpleks

Kasus batas:
    rho = 1      -> rata-rata berbobot
    rho -> 0     -> rata-rata geometrik  prod_k s_k^{w_k}
    rho -> -inf  -> min_k s_k  (untuk w_k > 0)

Perhitungan dilakukan di ruang logaritma (log-sum-exp) sehingga stabil untuk
rho negatif besar, dan s_k = 0 ditangani secara eksplisit.
"""

from __future__ import annotations

import numpy as np

RHO_NOL = 1e-9  # |rho| di bawah ini diperlakukan sebagai rho -> 0


def _cek_bobot(w) -> np.ndarray:
    w = np.asarray(w, dtype=float)
    if w.ndim != 1 or w.size == 0:
        raise ValueError("Bobot harus vektor tak kosong.")
    if np.any(w < -1e-12):
        raise ValueError("Bobot tidak boleh negatif.")
    w = np.clip(w, 0.0, None)
    total = w.sum()
    if total <= 0:
        raise ValueError("Jumlah bobot harus positif.")
    if abs(total - 1.0) > 1e-6:
        raise ValueError(f"Bobot harus berjumlah 1 (didapat {total:.6f}).")
    return w / total


def normalisasi(x, l, u) -> np.ndarray:
    """Normalisasi min-maks terpotong ke [0, 1]."""
    x = np.asarray(x, dtype=float)
    l = np.asarray(l, dtype=float)
    u = np.asarray(u, dtype=float)
    if np.any(u <= l):
        raise ValueError("Batas atas u_k harus lebih besar dari batas bawah l_k.")
    return np.clip((x - l) / (u - l), 0.0, 1.0)


def _log_suku(s: np.ndarray, w: np.ndarray, rho: float):
    """Mengembalikan log(w_k s_k^rho) untuk suku aktif (w_k>0, s_k>0)."""
    aktif = (w > 0) & (s > 0)
    log_suku = np.full(s.shape, -np.inf)
    log_suku[aktif] = np.log(w[aktif]) + rho * np.log(s[aktif])
    return log_suku, aktif


def ces(s, w, rho: float) -> float:
    """Agregasi CES; hasil selalu di [0, 1] bila s di [0, 1]."""
    s = np.clip(np.asarray(s, dtype=float), 0.0, 1.0)
    w = _cek_bobot(w)
    if s.shape != w.shape:
        raise ValueError("Panjang s dan w harus sama.")
    berbobot = w > 0

    if abs(rho) < RHO_NOL:
        # rata-rata geometrik
        if np.any(s[berbobot] == 0):
            return 0.0
        return float(np.exp(np.sum(w[berbobot] * np.log(s[berbobot]))))

    if rho < 0 and np.any(s[berbobot] == 0):
        # s^rho -> +inf sehingga G -> 0 (limit)
        return 0.0

    log_suku, aktif = _log_suku(s, w, rho)
    if not np.any(aktif):
        return 0.0
    m = np.max(log_suku[aktif])
    lse = m + np.log(np.sum(np.exp(log_suku[aktif] - m)))
    g = float(np.exp(lse / rho))
    return float(min(1.0, max(0.0, g)))


def kontribusi(s, w, rho: float) -> np.ndarray:
    """Dekomposisi Euler: G = sum_k s_k dG/ds_k.

    Karena G homogen berderajat satu, c_k = s_k dG/ds_k = G * w_k s_k^rho /
    sum_j w_j s_j^rho, dan sum_k c_k = G. Untuk rho -> 0, c_k = G * w_k.
    """
    s = np.clip(np.asarray(s, dtype=float), 0.0, 1.0)
    w = _cek_bobot(w)
    g = ces(s, w, rho)
    if g == 0.0:
        return np.zeros_like(s)
    if abs(rho) < RHO_NOL:
        return g * w
    log_suku, aktif = _log_suku(s, w, rho)
    pangsa = np.zeros_like(s)
    m = np.max(log_suku[aktif])
    e = np.exp(log_suku[aktif] - m)
    pangsa[aktif] = e / e.sum()
    return g * pangsa


def gradien(s, w, rho: float) -> np.ndarray:
    """dG/ds_k = w_k s_k^(rho-1) G^(1-rho). Bernilai +inf bila s_k=0 dan rho<1.

    Dipakai untuk menunjuk indikator "penghambat utama": indikator yang paling
    menaikkan G bila diperbaiki satu satuan kecil.
    """
    s = np.clip(np.asarray(s, dtype=float), 0.0, 1.0)
    w = _cek_bobot(w)
    g = ces(s, w, rho)
    out = np.zeros_like(s)
    for k in range(s.size):
        if w[k] == 0:
            continue
        if s[k] == 0:
            out[k] = np.inf if rho < 1 else w[k] * (g ** (1 - rho) if g > 0 else 0.0)
            continue
        if g == 0:
            out[k] = 0.0
            continue
        out[k] = w[k] * np.exp((rho - 1) * np.log(s[k]) + (1 - rho) * np.log(g))
    return out
