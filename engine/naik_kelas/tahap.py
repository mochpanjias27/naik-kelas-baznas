"""Penentuan tahap graduasi dari indeks G dan syarat keras nisab."""

from __future__ import annotations

NAMA_TAHAP = {
    1: "Rentan",
    2: "Memulai",
    3: "Bertahan",
    4: "Mandiri (muktafi)",
    5: "Muzakki",
    6: "Keluar/gagal",
}

CATATAN_FIKIH = "Dasar nisab dan haul perlu dikonfirmasi pada rujukan fikih."


def nisab_rupiah(nisab_gram: float, harga_emas_per_gram: float) -> float:
    """N = berat nisab (gram emas) x harga emas per gram."""
    if nisab_gram <= 0 or harga_emas_per_gram <= 0:
        raise ValueError("Berat nisab dan harga emas harus positif.")
    return float(nisab_gram) * float(harga_emas_per_gram)


def tentukan_tahap(g: float, ambang, kekayaan_bersih: float, nisab: float) -> dict:
    """Tahap = 1 + banyaknya ambang tau_j yang dilampaui G.

    Syarat keras tahap 5: kekayaan bersih W >= nisab N. Bila G memenuhi ambang
    tahap 5 tetapi W < N, tahap ditahan di 4.
    """
    ambang = [float(a) for a in ambang]
    if len(ambang) != 4:
        raise ValueError("Diperlukan tepat empat ambang.")
    if not (0 < ambang[0] < ambang[1] < ambang[2] < ambang[3] < 1):
        raise ValueError("Ambang harus memenuhi 0 < t1 < t2 < t3 < t4 < 1.")
    tahap = 1 + sum(1 for a in ambang if g >= a)
    alasan = f"G = {g:.3f} melampaui {tahap - 1} dari 4 ambang."
    ditahan = False
    if tahap == 5 and kekayaan_bersih < nisab:
        tahap = 4
        ditahan = True
        alasan += " Tahap 5 ditahan karena kekayaan bersih belum mencapai nisab."
    return {
        "tahap": tahap,
        "nama": NAMA_TAHAP[tahap],
        "alasan": alasan,
        "ditahan_nisab": ditahan,
    }


def estimasi_zakat(kekayaan_bersih: float, nisab: float, tarif: float = 0.025) -> dict:
    """Informasi saja: 2,5% x W bila W >= N."""
    wajib = kekayaan_bersih >= nisab
    return {
        "mencapai_nisab": wajib,
        "estimasi": float(tarif * kekayaan_bersih) if wajib else 0.0,
        "catatan": CATATAN_FIKIH,
    }


def status_bantuan(riwayat_tahap, bulan_bertahap: int = 6) -> str:
    """Graduasi tidak memutus dukungan mendadak.

    - tahap terakhir 6         -> "Keluar/gagal: tinjau ulang"
    - tahap terakhir <= 3      -> "Bantuan dan pendampingan penuh"
    - tahap >= 4 < N bulan     -> "Penurunan bantuan bertahap"
    - tahap >= 4 >= N bulan    -> "Lulus: pemantauan ringan"
    """
    if not riwayat_tahap:
        return "Belum ada data"
    terakhir = riwayat_tahap[-1]
    if terakhir == 6:
        return "Keluar/gagal: tinjau ulang"
    if terakhir <= 3:
        return "Bantuan dan pendampingan penuh"
    beruntun = 0
    for t in reversed(riwayat_tahap):
        if 4 <= t <= 5:
            beruntun += 1
        else:
            break
    if beruntun >= bulan_bertahap:
        return "Lulus: pemantauan ringan"
    return "Penurunan bantuan bertahap"
