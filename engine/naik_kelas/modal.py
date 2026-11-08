"""Kalkulator modal minimum: model jebakan kemiskinan sederhana (ilustratif).

    k_{t+1} = (1 - delta) k_t + s f(k_t)
    f(k)    = max{A_L k^alpha, A_H k^alpha - F}

Titik tetap positif memenuhi phi(k) = s f(k) - delta k = 0. Titik tetap tak
stabil k_hat adalah akar positif terkecil tempat phi berpindah dari negatif ke
positif. Modal minimum z* = max{0, k_hat - k0}.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict

import numpy as np


@dataclass
class ModalParam:
    alpha: float = 0.5
    A_L: float = 1.0
    A_H: float = 4.0
    F: float = 8.0
    s: float = 0.25
    delta: float = 0.1
    k0: float = 3.0

    def cek(self):
        if not (0 < self.alpha < 1):
            raise ValueError("alpha harus di (0, 1).")
        if self.A_L <= 0 or self.A_H <= 0 or self.F < 0:
            raise ValueError("A_L, A_H harus positif dan F >= 0.")
        if not (0 < self.s <= 1) or not (0 < self.delta <= 1):
            raise ValueError("s dan delta harus di (0, 1].")
        if self.k0 < 0:
            raise ValueError("k0 tidak boleh negatif.")


def produksi(k, p: ModalParam):
    k = np.asarray(k, dtype=float)
    ka = np.power(np.maximum(k, 0.0), p.alpha)
    return np.maximum(p.A_L * ka, p.A_H * ka - p.F)


def phi(k, p: ModalParam):
    return p.s * produksi(k, p) - p.delta * np.asarray(k, dtype=float)


def _bisection(fn, a, b, iters=200):
    fa = fn(a)
    for _ in range(iters):
        m = 0.5 * (a + b)
        fm = fn(m)
        if fa * fm <= 0:
            b = m
        else:
            a, fa = m, fm
        if b - a < 1e-12 * max(1.0, abs(m)):
            break
    return 0.5 * (a + b)


def titik_tetap(p: ModalParam, k_maks: float | None = None, n_grid: int = 20000) -> list[dict]:
    """Mencari semua titik tetap positif secara numerik (grid log + biseksi)."""
    p.cek()
    if k_maks is None:
        # batas atas aman: s*A_H*k^alpha = delta*k  ->  k = (s*A_H/delta)^(1/(1-alpha))
        k_maks = 4.0 * (p.s * max(p.A_H, p.A_L) / p.delta) ** (1 / (1 - p.alpha)) + 10.0
    grid = np.geomspace(1e-8, k_maks, n_grid)
    nilai = phi(grid, p)
    hasil = []
    fn = lambda x: float(phi(x, p))
    for i in range(n_grid - 1):
        a, b = nilai[i], nilai[i + 1]
        if a == 0:
            continue
        if a * b < 0 or b == 0:
            akar = _bisection(fn, grid[i], grid[i + 1]) if b != 0 else grid[i + 1]
            jenis = "stabil" if a > 0 else "tak stabil"
            hasil.append({"k": float(akar), "jenis": jenis})
    return hasil


def lintasan(p: ModalParam, k_awal: float, n: int = 60) -> np.ndarray:
    k = np.empty(n + 1)
    k[0] = k_awal
    for t in range(n):
        k[t + 1] = (1 - p.delta) * k[t] + p.s * float(produksi(k[t], p))
    return k


def analisis_modal(p: ModalParam) -> dict:
    tt = titik_tetap(p)
    tak_stabil = [x["k"] for x in tt if x["jenis"] == "tak stabil"]
    k_hat = min(tak_stabil) if tak_stabil else None
    if k_hat is None:
        z = None
        pesan = (
            "Pada parameter yang dipilih model tidak memiliki jebakan kemiskinan "
            "(tidak ada titik tetap tak stabil), sehingga modal minimum tidak terdefinisi."
        )
    else:
        z = max(0.0, k_hat - p.k0)
        pesan = (
            f"Ambang jebakan k_hat = {k_hat:.3f}. Dengan modal awal k0 = {p.k0:g}, "
            f"suntikan minimum z* = {z:.3f} (satuan modal ilustratif)."
        )
    return {
        "parameter": asdict(p),
        "titik_tetap": tt,
        "k_hat": k_hat,
        "z_star": z,
        "ada_jebakan": k_hat is not None,
        "pesan": pesan,
    }
