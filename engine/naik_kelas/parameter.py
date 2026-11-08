"""Parameter model bawaan (penanda tempat, belum dikalibrasi).

Berkas JSON yang sama dibaca oleh aplikasi web (TypeScript) agar kedua
implementasi memakai nilai awal yang identik.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path

_BERKAS = Path(__file__).with_name("parameter_bawaan.json")


def parameter_bawaan() -> dict:
    with _BERKAS.open(encoding="utf-8") as f:
        return copy.deepcopy(json.load(f))
