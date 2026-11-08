"""Uji matematika wajib (bagian 8 spesifikasi) dan uji tambahan."""

import json
from pathlib import Path

import numpy as np
import pytest

from naik_kelas import (
    analisis_modal,
    bobot_ahp,
    bobot_entropi,
    bobot_manual,
    ces,
    cusum,
    estimasi_posterior,
    estimasi_zakat,
    gradien,
    hitung_transisi,
    kendall_tau,
    kontribusi,
    matriks_fundamental,
    nilai_asesmen,
    nisab_rupiah,
    normalisasi,
    parameter_bawaan,
    peluang_serap,
    simulasi_lintasan,
    skor_bulanan,
    tentukan_tahap,
    waktu_serap,
    ModalParam,
)
from naik_kelas.sensitivitas import analisis_sensitivitas
from naik_kelas.sintetis import bangkitkan
from naik_kelas.tahap import status_bantuan

# ---------------------------------------------------------------- Uji wajib 1: CES
S1 = [0.5, 1.0]
W1 = [0.5, 0.5]


def test_ces_rho_satu_rata_rata_berbobot():
    assert ces(S1, W1, 1.0) == pytest.approx(0.75, abs=1e-12)


def test_ces_rho_nol_rata_rata_geometrik():
    assert ces(S1, W1, 0.0) == pytest.approx(np.sqrt(0.5), abs=1e-9)
    assert ces(S1, W1, 1e-6) == pytest.approx(0.7071, abs=1e-4)  # kontinu di sekitar 0
    assert ces(S1, W1, -1e-6) == pytest.approx(0.7071, abs=1e-4)


def test_ces_rho_negatif_besar_mendekati_min():
    assert ces(S1, W1, -50.0) == pytest.approx(0.5, abs=0.01)
    assert ces(S1, W1, -5000.0) == pytest.approx(0.5, abs=1e-3)  # stabil numerik


def test_ces_sk_nol_untuk_rho_tidak_positif():
    assert ces([0.0, 1.0], W1, 0.0) == 0.0
    assert ces([0.0, 1.0], W1, -3.0) == 0.0
    assert ces([0.0, 1.0], W1, 1.0) == pytest.approx(0.5)
    assert ces([0.0, 0.0], W1, 2.0) == 0.0
    # bobot nol mengabaikan indikator bernilai nol
    assert ces([0.0, 0.8], [0.0, 1.0], -2.0) == pytest.approx(0.8)


# ---------------------------------------------------------------- Uji wajib 2: Markov
Q2 = np.array([[0.5, 0.2], [0.1, 0.6]])
R2 = np.array([[0.3], [0.3]])


def test_markov_matriks_fundamental():
    M = matriks_fundamental(Q2)
    np.testing.assert_allclose(M, [[2.222, 1.111], [0.556, 2.778]], atol=1e-3)


def test_markov_waktu_serap():
    np.testing.assert_allclose(waktu_serap(Q2), [3.333, 3.333], atol=1e-3)


def test_markov_peluang_serap():
    np.testing.assert_allclose(peluang_serap(Q2, R2), [[1.0], [1.0]], atol=1e-12)


# ---------------------------------------------------------------- Uji wajib 3: rentang
@pytest.mark.parametrize("seed", range(25))
def test_rentang_normalisasi_G_dan_bobot(seed):
    rng = np.random.default_rng(seed)
    K = int(rng.integers(2, 8))
    x = rng.normal(0, 5, K)
    l = rng.normal(0, 1, K)
    u = l + rng.uniform(0.1, 3, K)
    s = normalisasi(x, l, u)
    assert np.all((s >= 0) & (s <= 1))
    w = rng.dirichlet(np.ones(K))
    assert w.sum() == pytest.approx(1.0)
    for rho in [-50, -2, -0.5, 0.0, 0.3, 1, 3]:
        g = ces(s, w, rho)
        assert 0.0 <= g <= 1.0
        c = kontribusi(s, w, rho)
        assert c.sum() == pytest.approx(g, abs=1e-9)  # dekomposisi Euler
    assert bobot_manual(rng.uniform(0, 1, K)).sum() == pytest.approx(1.0)
    assert bobot_entropi(rng.uniform(0, 1, (30, K))).sum() == pytest.approx(1.0)


def test_bobot_tidak_berjumlah_satu_ditolak():
    with pytest.raises(ValueError):
        ces([0.5, 0.5], [0.5, 0.6], 1.0)


# ---------------------------------------------------------------- Uji wajib 4: monoton
@pytest.mark.parametrize("seed", range(25))
def test_monoton(seed):
    rng = np.random.default_rng(100 + seed)
    K = 5
    s = rng.uniform(0, 1, K)
    s[rng.integers(0, K)] = 0.0 if seed % 3 == 0 else s[0]
    w = rng.dirichlet(np.ones(K))
    for rho in [-20, -1, 0.0, 0.5, 1, 2]:
        g0 = ces(s, w, rho)
        for k in range(K):
            s2 = s.copy()
            s2[k] = min(1.0, s2[k] + rng.uniform(0, 0.5))
            assert ces(s2, w, rho) >= g0 - 1e-12


# ---------------------------------------------------------------- Uji wajib 5: CUSUM
def test_cusum_deret_konstan_di_atas_mu0_tanpa_peringatan():
    r = cusum([1.2] * 36, mu0=1.0, kappa=0.1, h=1.0)
    assert r["alarm"] == []
    assert np.all(r["S"] == 0)
    r = cusum([1.0] * 36, mu0=1.0, kappa=0.0, h=0.5)  # tepat di mu0 juga aman
    assert r["alarm"] == []


def test_cusum_memicu_pada_penurunan_dan_memberi_alasan():
    y = [1.0] * 6 + [0.5] * 6
    r = cusum(y, mu0=1.0, kappa=0.1, h=1.0)
    # S naik 0,4 per bulan sejak bulan ke-7 -> 0,4; 0,8; 1,2 > 1 pada bulan ke-9
    assert r["alarm_pertama"] == 8
    assert "periode ke-9" in r["alasan"]
    assert r["aktif_sekarang"]


# ---------------------------------------------------------------- Uji wajib 6: sensitivitas
def test_kendall_tau_satu_bila_bobot_sampel_sama():
    rng = np.random.default_rng(1)
    S = rng.uniform(0, 1, (40, 5))
    w = np.array([0.3, 0.2, 0.15, 0.15, 0.2])
    r = analisis_sensitivitas(
        S, w, 0.5, [0.3, 0.42, 0.55, 0.7], np.zeros(40), 1.0,
        sampel_bobot=np.tile(w, (10, 1)),
    )
    assert np.all(r["tau"] == pytest.approx(1.0))
    assert r["proporsi_ganti_rata"] == 0.0


def test_kendall_tau_nilai_dikenal():
    assert kendall_tau([1, 2, 3, 4], [1, 2, 3, 4]) == pytest.approx(1.0)
    assert kendall_tau([1, 2, 3, 4], [4, 3, 2, 1]) == pytest.approx(-1.0)
    assert kendall_tau([1, 2, 3], [1, 3, 2]) == pytest.approx(1 / 3)


def test_sensitivitas_sampel_dirichlet():
    rng = np.random.default_rng(2)
    S = rng.uniform(0, 1, (30, 5))
    r = analisis_sensitivitas(S, [0.3, 0.2, 0.15, 0.15, 0.2], 0.5, [0.3, 0.42, 0.55, 0.7],
                              np.zeros(30), 1.0, n_sampel=200, seed=3)
    assert -1 <= r["tau_q05"] <= r["tau_rata"] <= r["tau_q95"] <= 1
    assert 0 <= r["proporsi_ganti_rata"] <= 1


# ---------------------------------------------------------------- Uji tambahan
def test_tahap_dan_syarat_nisab():
    amb = [0.3, 0.42, 0.55, 0.7]
    assert tentukan_tahap(0.1, amb, 0, 1)["tahap"] == 1
    assert tentukan_tahap(0.42, amb, 0, 1)["tahap"] == 3
    r = tentukan_tahap(0.9, amb, 50, 100)
    assert r["tahap"] == 4 and r["ditahan_nisab"]
    assert tentukan_tahap(0.9, amb, 100, 100)["tahap"] == 5
    with pytest.raises(ValueError):
        tentukan_tahap(0.5, [0.3, 0.2, 0.55, 0.7], 0, 1)


def test_nisab_dan_zakat():
    N = nisab_rupiah(85, 1_000_000)
    assert N == 85_000_000
    assert estimasi_zakat(100_000_000, N)["estimasi"] == pytest.approx(2_500_000)
    assert estimasi_zakat(10_000_000, N)["estimasi"] == 0.0


def test_status_bantuan_bertahap():
    assert status_bantuan([2, 3, 3]) == "Bantuan dan pendampingan penuh"
    assert status_bantuan([3, 4, 4]) == "Penurunan bantuan bertahap"
    assert status_bantuan([3] + [4] * 6) == "Lulus: pemantauan ringan"
    assert status_bantuan([3, 6]) == "Keluar/gagal: tinjau ulang"


def test_ahp_matriks_konsisten():
    w_benar = np.array([0.5, 0.3, 0.2])
    A = w_benar[:, None] / w_benar[None, :]
    r = bobot_ahp(A)
    np.testing.assert_allclose(r["bobot"], w_benar, atol=1e-9)
    assert r["lambda_max"] == pytest.approx(3.0)
    assert r["CR"] == pytest.approx(0.0, abs=1e-9) and r["konsisten"]


def test_ahp_tak_konsisten_ditandai():
    A = np.array([[1, 9, 1 / 9], [1 / 9, 1, 9], [9, 1 / 9, 1]])
    r = bobot_ahp(A)
    assert r["CR"] > 0.1 and not r["konsisten"]


def test_ahp_parameter_bawaan():
    r = bobot_ahp(parameter_bawaan()["ahp_matriks"])
    assert r["bobot"].sum() == pytest.approx(1.0)
    assert r["konsisten"]


def test_entropi_kolom_konstan_berbobot_nol():
    S = np.column_stack([np.full(10, 0.5), np.linspace(0.01, 1, 10)])
    w = bobot_entropi(S)
    assert w[0] == pytest.approx(0.0) and w[1] == pytest.approx(1.0)


def test_gradien_menunjuk_penghambat():
    g = gradien([0.2, 0.9], [0.5, 0.5], 0.5)
    assert g[0] > g[1]
    assert np.isinf(gradien([0.0, 0.9], [0.5, 0.5], 0.5)[0])


def test_hitung_transisi_berhenti_di_penyerap():
    n = hitung_transisi([[1, 2, 2, 5, 3], [3, 6, 1]])
    assert n[0, 1] == 1 and n[1, 1] == 1 and n[1, 4] == 1 and n[2, 5] == 1
    assert n.sum() == 4


def test_posterior_tanpa_data_sama_dengan_prior_rata():
    alpha = np.array(parameter_bawaan()["markov"]["prior_alpha"])
    r = estimasi_posterior(np.zeros((4, 6)), alpha, n_sampel=300, seed=0)
    np.testing.assert_allclose(r["P_rata"].sum(axis=1), 1.0)
    np.testing.assert_allclose(r["B_rata"].sum(axis=1), 1.0, atol=1e-9)
    assert np.all(r["t_bawah"] <= r["t_rata"] + 1e-9)
    assert np.all(r["t_rata"] <= r["t_atas"] + 1e-9)


def test_simulasi_monte_carlo_mendekati_analitik():
    P = np.zeros((6, 6))
    P[:4, :4] = np.array([[0.6, 0.3, 0, 0], [0.1, 0.6, 0.2, 0], [0, 0.1, 0.6, 0.2], [0, 0, 0.1, 0.7]])
    P[0, 5] = 0.1
    P[1, 5] = 0.1
    P[2, 5] = 0.1
    P[3, 4] = 0.2
    P[4, 4] = P[5, 5] = 1
    analitik = waktu_serap(P[:4, :4])[0]
    sim = simulasi_lintasan(P, 1, 400, n_sim=4000, seed=1)
    assert sim["rata_waktu_terserap"] == pytest.approx(analitik, rel=0.06)
    B = peluang_serap(P[:4, :4], P[:4, 4:])
    assert sim["proporsi_muzakki"] == pytest.approx(B[0, 0], abs=0.03)


def test_modal_minimum_default():
    r = analisis_modal(ModalParam())
    # akar analitik cabang teknologi tinggi: x^2 - 10x + 20 = 0, k = x^2
    k_hat = ((10 - np.sqrt(20)) / 2) ** 2
    assert r["ada_jebakan"]
    assert r["k_hat"] == pytest.approx(k_hat, rel=1e-6)
    assert r["z_star"] == pytest.approx(k_hat - 3.0, rel=1e-6)
    stabil = [x["k"] for x in r["titik_tetap"] if x["jenis"] == "stabil"]
    assert stabil[0] == pytest.approx(6.25, rel=1e-6)
    assert stabil[-1] == pytest.approx(((10 + np.sqrt(20)) / 2) ** 2, rel=1e-6)


def test_modal_tanpa_jebakan_diberi_peringatan():
    r = analisis_modal(ModalParam(F=0.0))
    assert not r["ada_jebakan"] and r["z_star"] is None
    assert "tidak memiliki jebakan" in r["pesan"]


def test_asesmen_aturan_transparan():
    konf = parameter_bawaan()["asesmen"]
    semua3 = {q["kode"]: 3 for q in konf["pertanyaan"]}
    assert nilai_asesmen(semua3, konf)["rekomendasi"] == "Produktif"
    gugur = dict(semua3, motivasi=0)
    r = nilai_asesmen(gugur, konf)
    assert r["rekomendasi"] == "Tetap konsumtif" and len(r["alasan"]) == 2
    semua1 = {q["kode"]: 1 for q in konf["pertanyaan"]}
    assert nilai_asesmen(semua1, konf)["rekomendasi"] == "Tetap konsumtif"


def test_generator_sintetis_deterministik():
    a = bangkitkan(n=12, n_bulan=6)
    b = bangkitkan(n=12, n_bulan=6)
    assert a == b
    assert a["label"] == "SINTETIS"
    assert all(m["alias"].startswith("Mustahik ") for m in a["mustahik"])


def test_skor_bulanan_menyimpan_versi_dan_kontribusi():
    p = parameter_bawaan()
    d = bangkitkan(n=6, n_bulan=6)
    r = skor_bulanan(d["mustahik"][0], 5, p)
    assert r["versi"] == p["versi"]
    if r["G"] is not None:
        assert sum(r["kontribusi"]) == pytest.approx(r["G"])


def test_fixture_rujukan_konsisten_dengan_mesin():
    """Fixture uji silang TypeScript harus selaras dengan mesin Python saat ini."""
    akar = Path(__file__).resolve().parents[2]
    rujukan = json.loads((akar / "tests" / "fixtures" / "rujukan_skor.json").read_text())
    data = json.loads((akar / "public" / "data" / "sintetis.json").read_text())
    p = parameter_bawaan()
    peta = {m["id"]: m for m in data["mustahik"]}
    for baris in rujukan[::7]:
        r = skor_bulanan(peta[baris["id"]], baris["bulan"], p)
        assert r["tahap"] == baris["tahap"]
        if baris["G"] is not None:
            assert r["G"] == pytest.approx(baris["G"], abs=1e-12)
