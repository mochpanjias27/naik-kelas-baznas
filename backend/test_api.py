import os
import tempfile

os.environ["NAIK_KELAS_DB"] = os.path.join(tempfile.mkdtemp(), "uji.sqlite3")

from fastapi.testclient import TestClient  # noqa: E402

from backend.main import app  # noqa: E402

klien = TestClient(app)
M = {"X-Peran": "manajer"}
P = {"X-Peran": "pendamping"}


def test_kesehatan():
    assert klien.get("/kesehatan").json()["status"] == "ok"


def test_peran_wajib():
    assert klien.post("/skor", json={"x": [1, 0.1, 0.1, 0.5, 0.6]}).status_code == 401
    assert klien.post("/bobot/ahp", json={"matriks": [[1]]}, headers=P).status_code == 403


def test_skor():
    r = klien.post("/skor", json={"x": [1.0, 0.1, 0.1, 0.5, 0.6], "kekayaan_bersih": 1e6}, headers=P).json()
    assert 0 <= r["G"] <= 1 and 1 <= r["tahap"] <= 5
    assert abs(sum(r["kontribusi"]) - r["G"]) < 1e-9
    assert "keputusan akhir" in r["pernyataan"]


def test_markov_dan_modal():
    n = [[0] * 6 for _ in range(4)]
    r = klien.post("/markov", json={"n": n, "n_sampel": 50}, headers=M).json()
    assert len(r["t_rata"]) == 4
    r = klien.post("/modal", json={}, headers=M).json()
    assert r["ada_jebakan"]


def test_sinkron_dan_audit():
    c = {"uid": "u1", "mustahik_id": "M001", "tanggal": "2026-11-08", "omzet": 100000, "biaya": 60000}
    r = klien.post("/sinkron", json={"catatan": [c]}, headers={"X-Peran": "mustahik"}).json()
    assert r["diterima"] == ["u1"]
    log = klien.get("/audit", headers=M).json()
    assert log[0]["aksi"] == "sinkron"
