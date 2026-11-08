"""Tiga cara pembobotan indikator: manual, AHP, dan entropi."""

from __future__ import annotations

import numpy as np

# Indeks acak (Random Index) Saaty untuk K = 1..10
RI_SAATY = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}


def bobot_manual(w) -> np.ndarray:
    """Menormalkan bobot masukan manual agar berjumlah 1."""
    w = np.asarray(w, dtype=float)
    if np.any(w < 0):
        raise ValueError("Bobot manual tidak boleh negatif.")
    if w.sum() <= 0:
        raise ValueError("Jumlah bobot manual harus positif.")
    return w / w.sum()


def bobot_ahp(A) -> dict:
    """AHP: vektor eigen utama dari matriks perbandingan berpasangan.

    CR = (lambda_max - K) / ((K - 1) * RI). Ditandai tidak konsisten bila CR > 0,1.
    """
    A = np.asarray(A, dtype=float)
    K = A.shape[0]
    if A.ndim != 2 or A.shape[1] != K:
        raise ValueError("Matriks perbandingan harus persegi.")
    if np.any(A <= 0):
        raise ValueError("Entri matriks perbandingan harus positif.")
    if not np.allclose(A * A.T, 1.0, atol=1e-6):
        raise ValueError("Matriks harus resiprokal: a_ji = 1 / a_ij.")
    nilai, vektor = np.linalg.eig(A)
    i = int(np.argmax(nilai.real))
    lam = float(nilai[i].real)
    v = np.abs(vektor[:, i].real)
    w = v / v.sum()
    if K <= 2:
        cr = 0.0
    else:
        ri = RI_SAATY.get(K, 1.49)
        cr = (lam - K) / ((K - 1) * ri)
    return {
        "bobot": w,
        "lambda_max": lam,
        "CR": float(max(cr, 0.0)),
        "konsisten": bool(cr <= 0.1),
    }


def bobot_entropi(S) -> np.ndarray:
    """Bobot entropi Shannon dari matriks n x K nilai indikator (>= 0).

    p_ij = s_ij / sum_i s_ij ;  e_j = -(1/ln n) sum_i p_ij ln p_ij ;
    d_j = 1 - e_j ;  w_j = d_j / sum_j d_j.
    Kolom tanpa variasi atau seluruhnya nol mendapat d_j = 0. Bila semua d_j = 0,
    bobot dibagi rata.
    """
    S = np.asarray(S, dtype=float)
    if S.ndim != 2:
        raise ValueError("Masukan entropi harus matriks n x K.")
    if np.any(S < 0):
        raise ValueError("Nilai indikator untuk entropi harus >= 0.")
    n, K = S.shape
    if n < 2:
        return np.full(K, 1.0 / K)
    d = np.zeros(K)
    for j in range(K):
        kol = S[:, j]
        total = kol.sum()
        if total <= 0:
            continue
        p = kol / total
        p = p[p > 0]
        e = -np.sum(p * np.log(p)) / np.log(n)
        d[j] = max(0.0, 1.0 - e)
    if d.sum() <= 1e-15:
        return np.full(K, 1.0 / K)
    return d / d.sum()
