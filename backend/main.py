"""Backend FastAPI prototipe "Naik Kelas".

Menyediakan mesin matematika lewat HTTP dan endpoint sinkronisasi catatan
usaha ke SQLite (mode demo). Jalankan dari akar repo:

    uvicorn backend.main:app --reload --port 8000

Autentikasi di sini adalah token peran sederhana untuk demonstrasi
(header X-Peran: mustahik | pendamping | manajer), BUKAN autentikasi produksi.
"""

from __future__ import annotations

import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

import numpy as np
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

AKAR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AKAR / "engine"))

from naik_kelas import (  # noqa: E402
    ModalParam,
    analisis_modal,
    bobot_ahp,
    bobot_entropi,
    ces,
    cusum,
    estimasi_posterior,
    kontribusi,
    nilai_asesmen,
    nisab_rupiah,
    normalisasi,
    parameter_bawaan,
    tentukan_tahap,
)

DB_PATH = Path(os.environ.get("NAIK_KELAS_DB", AKAR / "backend" / "demo.sqlite3"))

app = FastAPI(title="Naik Kelas API (prototipe riset)", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("NAIK_KELAS_CORS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

Peran = Literal["mustahik", "pendamping", "manajer"]


def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.execute(
        """CREATE TABLE IF NOT EXISTS catatan (
            uid TEXT PRIMARY KEY, mustahik_id TEXT, tanggal TEXT,
            omzet REAL, biaya REAL, tabungan REAL, pengeluaran REAL,
            catatan TEXT, diterima TEXT)"""
    )
    con.execute(
        """CREATE TABLE IF NOT EXISTS log_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT, waktu TEXT, peran TEXT, aksi TEXT, detail TEXT)"""
    )
    return con


def audit(peran: str, aksi: str, detail: dict | None = None):
    with db() as con:
        con.execute(
            "INSERT INTO log_audit (waktu, peran, aksi, detail) VALUES (?,?,?,?)",
            (datetime.now(timezone.utc).isoformat(), peran, aksi, json.dumps(detail or {})),
        )


def peran_dari_header(x_peran: str | None = Header(default=None)) -> str:
    if x_peran not in ("mustahik", "pendamping", "manajer"):
        raise HTTPException(401, "Header X-Peran wajib: mustahik | pendamping | manajer (mode demo).")
    return x_peran


def wajib(*izin: str):
    def cek(peran: str = Depends(peran_dari_header)) -> str:
        if peran not in izin:
            raise HTTPException(403, f"Peran '{peran}' tidak berwenang.")
        return peran

    return cek


def _json(o):
    if isinstance(o, np.ndarray):
        return o.tolist()
    if isinstance(o, dict):
        return {k: _json(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_json(v) for v in o]
    if isinstance(o, (np.floating, np.integer)):
        return o.item()
    return o


PERNYATAAN = "Alat bantu keputusan. Skor tidak menentukan hak penerima; keputusan akhir ada pada amil."


@app.get("/kesehatan")
def kesehatan():
    return {"status": "ok", "label": "SINTETIS/DEMO", "pernyataan": PERNYATAAN}


@app.get("/parameter")
def ambil_parameter():
    return parameter_bawaan()


class SkorIn(BaseModel):
    x: list[float]
    kekayaan_bersih: float = 0.0
    parameter: dict | None = None


@app.post("/skor")
def skor(body: SkorIn, peran: str = Depends(wajib("pendamping", "manajer"))):
    p = body.parameter or parameter_bawaan()
    l = [i["l"] for i in p["indikator"]]
    u = [i["u"] for i in p["indikator"]]
    if len(body.x) != len(l):
        raise HTTPException(422, "Jumlah indikator tidak sesuai parameter.")
    s = normalisasi(body.x, l, u)
    w = np.asarray(p["bobot"], float)
    w = w / w.sum()
    g = ces(s, w, p["rho"])
    N = nisab_rupiah(p["nisab_gram"], p["harga_emas_per_gram"])
    th = tentukan_tahap(g, p["ambang"], body.kekayaan_bersih, N)
    return _json({"s": s, "G": g, **th, "kontribusi": kontribusi(s, w, p["rho"]), "versi": p["versi"], "pernyataan": PERNYATAAN})


class MatriksIn(BaseModel):
    matriks: list[list[float]]


@app.post("/bobot/ahp")
def ahp(body: MatriksIn, peran: str = Depends(wajib("manajer"))):
    try:
        return _json(bobot_ahp(body.matriks))
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.post("/bobot/entropi")
def entropi(body: MatriksIn, peran: str = Depends(wajib("manajer"))):
    return {"bobot": bobot_entropi(body.matriks).tolist()}


class CusumIn(BaseModel):
    y: list[float]
    mu0: float = 1.0
    kappa: float = 0.1
    h: float = 1.0


@app.post("/cusum")
def hitung_cusum(body: CusumIn, peran: str = Depends(wajib("pendamping", "manajer"))):
    return _json(cusum(body.y, body.mu0, body.kappa, body.h))


class MarkovIn(BaseModel):
    n: list[list[float]]
    alpha: list[list[float]] | None = None
    n_sampel: int = Field(1000, ge=10, le=20000)
    seed: int = 0


@app.post("/markov")
def markov(body: MarkovIn, peran: str = Depends(wajib("manajer"))):
    alpha = body.alpha or parameter_bawaan()["markov"]["prior_alpha"]
    return _json(estimasi_posterior(body.n, alpha, body.n_sampel, body.seed))


class ModalIn(BaseModel):
    alpha: float = 0.5
    A_L: float = 1.0
    A_H: float = 4.0
    F: float = 8.0
    s: float = 0.25
    delta: float = 0.1
    k0: float = 3.0


@app.post("/modal")
def modal(body: ModalIn, peran: str = Depends(wajib("manajer"))):
    try:
        return _json(analisis_modal(ModalParam(**body.model_dump())))
    except (TypeError, ValueError) as e:
        raise HTTPException(422, str(e))


@app.post("/asesmen")
def asesmen(jawaban: dict, peran: str = Depends(wajib("pendamping", "manajer"))):
    try:
        return nilai_asesmen(jawaban, parameter_bawaan()["asesmen"])
    except ValueError as e:
        raise HTTPException(422, str(e))


class CatatanIn(BaseModel):
    uid: str
    mustahik_id: str
    tanggal: str
    omzet: float = Field(ge=0)
    biaya: float = Field(ge=0)
    tabungan: float = Field(0, ge=0)
    pengeluaran: float = Field(0, ge=0)
    catatan: str = ""


class SinkronIn(BaseModel):
    catatan: list[CatatanIn]


@app.post("/sinkron")
def sinkron(body: SinkronIn, peran: str = Depends(wajib("mustahik", "pendamping"))):
    now = datetime.now(timezone.utc).isoformat()
    with db() as con:
        for c in body.catatan:
            con.execute(
                "INSERT OR REPLACE INTO catatan VALUES (?,?,?,?,?,?,?,?,?)",
                (c.uid, c.mustahik_id, c.tanggal, c.omzet, c.biaya, c.tabungan, c.pengeluaran, c.catatan, now),
            )
    audit(peran, "sinkron", {"jumlah": len(body.catatan)})
    return {"diterima": [c.uid for c in body.catatan]}


@app.get("/audit")
def lihat_audit(peran: str = Depends(wajib("manajer"))):
    with db() as con:
        rows = con.execute("SELECT waktu, peran, aksi, detail FROM log_audit ORDER BY id DESC LIMIT 200").fetchall()
    return [{"waktu": w, "peran": p, "aksi": a, "detail": json.loads(d)} for w, p, a, d in rows]
