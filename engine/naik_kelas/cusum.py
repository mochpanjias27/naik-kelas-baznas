"""Peringatan dini dengan CUSUM satu sisi (mendeteksi penurunan).

    S_t = max{0, S_{t-1} + (mu0 - y_t) - kappa},   S_0 = 0
    peringatan bila S_t > h

Tidak ada klaim akurasi; ini aturan pemantauan yang transparan.
"""

from __future__ import annotations

import numpy as np


def cusum(y, mu0: float, kappa: float, h: float, reset: bool = False) -> dict:
    if kappa < 0 or h <= 0:
        raise ValueError("kappa harus >= 0 dan h harus > 0.")
    y = np.asarray(y, dtype=float)
    S = np.zeros(y.size)
    prev = 0.0
    alarm = []
    for t, yt in enumerate(y):
        if np.isnan(yt):
            S[t] = prev
            continue
        st = max(0.0, prev + (mu0 - yt) - kappa)
        S[t] = st
        if st > h:
            alarm.append(t)
            if reset:
                st = 0.0
        prev = st
    pertama = alarm[0] if alarm else None
    if pertama is None:
        alasan = "Tidak ada peringatan: akumulasi penurunan belum melampaui ambang h."
    else:
        # cari awal episode penurunan (S terakhir bernilai 0 sebelum alarm)
        awal = pertama
        while awal > 0 and S[awal - 1] > 0:
            awal -= 1
        alasan = (
            f"Peringatan pada periode ke-{pertama + 1}: sejak periode ke-{awal + 1}, "
            f"nilai berada di bawah acuan mu0 = {mu0:g} (setelah dikurangi kelonggaran "
            f"kappa = {kappa:g}) hingga akumulasinya S = {S[pertama]:.3f} > h = {h:g}."
        )
    return {
        "S": S,
        "alarm": alarm,
        "alarm_pertama": pertama,
        "aktif_sekarang": bool(S.size and S[-1] > h),
        "alasan": alasan,
    }
