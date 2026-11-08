"""Lintasan graduasi sebagai rantai Markov dengan keadaan penyerap.

Indeks keadaan (0-basis):
    0..3 : tahap 1-4 (transien)
    4    : tahap 5 Muzakki (penyerap)
    5    : Keluar/gagal (penyerap)

    P = [[Q, R], [0, I]],  M = (I - Q)^-1,  t = M 1,  B = M R

Estimasi Bayes: setiap baris transien ~ Dirichlet(alpha_j); posterior
Dirichlet(alpha_j + n_j). Interval kredibel diperoleh dengan sampling.
"""

from __future__ import annotations

import numpy as np

N_TRANSIEN = 4
N_KEADAAN = 6


def _cek_QR(Q, R):
    Q = np.asarray(Q, dtype=float)
    R = np.asarray(R, dtype=float)
    if R.ndim == 1:
        R = R[:, None]
    if Q.shape[0] != Q.shape[1] or R.shape[0] != Q.shape[0]:
        raise ValueError("Ukuran Q dan R tidak serasi.")
    if np.any(Q < -1e-12) or np.any(R < -1e-12):
        raise ValueError("Peluang transisi tidak boleh negatif.")
    baris = Q.sum(axis=1) + R.sum(axis=1)
    if not np.allclose(baris, 1.0, atol=1e-6):
        raise ValueError("Setiap baris [Q R] harus berjumlah 1.")
    return Q, R


def matriks_fundamental(Q) -> np.ndarray:
    Q = np.asarray(Q, dtype=float)
    I = np.eye(Q.shape[0])
    return np.linalg.inv(I - Q)


def waktu_serap(Q) -> np.ndarray:
    """Rata-rata banyaknya langkah sebelum terserap, dari tiap keadaan transien."""
    M = matriks_fundamental(Q)
    return M @ np.ones(M.shape[0])


def peluang_serap(Q, R) -> np.ndarray:
    Q, R = _cek_QR(Q, R)
    return matriks_fundamental(Q) @ R


def hitung_transisi(lintasan_list, langkah: int = 1) -> np.ndarray:
    """Menghitung matriks frekuensi transisi n (4 x 6).

    lintasan_list: daftar barisan tahap (1..6) per individu. Transisi diambil
    tiap `langkah` periode. Setelah mencapai keadaan penyerap (5 atau 6),
    sisa barisan diabaikan (asumsi penyerapan).
    """
    n = np.zeros((N_TRANSIEN, N_KEADAAN))
    for seq in lintasan_list:
        seq = [int(x) for x in seq if x is not None]
        sub = seq[::langkah]
        for a, b in zip(sub[:-1], sub[1:]):
            if a >= 5:
                break
            n[a - 1, b - 1] += 1
            if b >= 5:
                break
    return n


def ringkas_P(P) -> dict:
    P = np.asarray(P, dtype=float)
    Q = P[:N_TRANSIEN, :N_TRANSIEN]
    R = P[:N_TRANSIEN, N_TRANSIEN:]
    M = matriks_fundamental(Q)
    return {"Q": Q, "R": R, "M": M, "t": M @ np.ones(N_TRANSIEN), "B": M @ R}


def estimasi_posterior(n, alpha, n_sampel: int = 2000, seed: int = 0, tingkat: float = 0.95) -> dict:
    """Rata-rata posterior dan interval kredibel untuk t dan B."""
    n = np.asarray(n, dtype=float)
    alpha = np.asarray(alpha, dtype=float)
    if n.shape != (N_TRANSIEN, N_KEADAAN) or alpha.shape != n.shape:
        raise ValueError("n dan alpha harus berukuran 4 x 6.")
    if np.any(alpha <= 0):
        raise ValueError("Parameter prior Dirichlet harus positif.")
    post = alpha + n
    P_rata = post / post.sum(axis=1, keepdims=True)
    rng = np.random.default_rng(seed)
    t_s = np.empty((n_sampel, N_TRANSIEN))
    B_s = np.empty((n_sampel, N_TRANSIEN, 2))
    for i in range(n_sampel):
        P = np.vstack([rng.dirichlet(post[j]) for j in range(N_TRANSIEN)])
        r = ringkas_P(P)
        t_s[i] = r["t"]
        B_s[i] = r["B"]
    a = (1 - tingkat) / 2
    rata = ringkas_P(P_rata)
    return {
        "P_rata": P_rata,
        "t_rata": rata["t"],
        "B_rata": rata["B"],
        "t_bawah": np.quantile(t_s, a, axis=0),
        "t_atas": np.quantile(t_s, 1 - a, axis=0),
        "B_bawah": np.quantile(B_s, a, axis=0),
        "B_atas": np.quantile(B_s, 1 - a, axis=0),
        "tingkat": tingkat,
    }


def simulasi_lintasan(P, keadaan_awal: int, n_langkah: int, n_sim: int = 1000, seed: int = 0) -> dict:
    """Simulasi Monte Carlo. keadaan_awal dalam 1..6 (tahap)."""
    P = np.asarray(P, dtype=float)
    rng = np.random.default_rng(seed)
    cum = np.cumsum(P, axis=1)
    keadaan = np.full(n_sim, keadaan_awal - 1)
    sebaran = np.zeros((n_langkah + 1, N_KEADAAN))
    sebaran[0] = np.bincount(keadaan, minlength=N_KEADAAN) / n_sim
    waktu = np.full(n_sim, np.nan)
    for t in range(1, n_langkah + 1):
        u = rng.random(n_sim)
        baru = np.array([np.searchsorted(cum[s], u[i], side="right") for i, s in enumerate(keadaan)])
        baru = np.minimum(baru, N_KEADAAN - 1)
        baru_serap = (baru >= N_TRANSIEN) & (keadaan < N_TRANSIEN)
        waktu[baru_serap] = t
        keadaan = baru
        sebaran[t] = np.bincount(keadaan, minlength=N_KEADAAN) / n_sim
    return {
        "sebaran": sebaran,
        "proporsi_muzakki": float(sebaran[-1, 4]),
        "proporsi_keluar": float(sebaran[-1, 5]),
        "rata_waktu_terserap": float(np.nanmean(waktu)) if np.any(~np.isnan(waktu)) else None,
    }
