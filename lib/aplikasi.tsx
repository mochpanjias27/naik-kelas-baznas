"use client";
// Status aplikasi: data sintetis, parameter berversi, sesi peran, catatan lokal,
// dan hasil analisis (skor, tahap, CUSUM, risiko) yang dihitung di perangkat.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  PARAMETER_BAWAAN,
  cusum,
  deretCusum,
  skorBulanan,
  statusBantuan,
  type DataSintetis,
  type Mustahik,
  type Parameter,
  type Skor,
} from "./engine";
import { db, semua, simpan, type AsesmenLokal, type CatatanHarian, type KunjunganLokal, type LogAudit } from "./db";
import { hariIni } from "./format";

export type Peran = "mustahik" | "pendamping" | "manajer";
export interface Sesi {
  peran: Peran;
  nama: string;
  mustahik_id?: string;
  wilayah?: string;
}

export interface Analisis {
  m: Mustahik;
  skor: Skor[];
  tahap: number[];
  terakhir: Skor;
  cusum: ReturnType<typeof cusum>;
  berisiko: boolean;
  alasanRisiko: string[];
  stagnan: boolean;
  statusBantuan: string;
  proyeksi: { hari: number } | null;
}

export interface RiwayatParameter {
  versi: string;
  waktu: string;
  catatan: string;
  parameter: Parameter;
}

const K_SESI = "nk_sesi";
const K_PARAM = "nk_parameter_riwayat";
const API = process.env.NEXT_PUBLIC_API_URL || "";

function bacaLS<T>(k: string, cadangan: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : cadangan;
  } catch {
    return cadangan;
  }
}
function tulisLS(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

/** Menggabungkan catatan harian bulan berjalan sebagai bulan baru (proyeksi bulanan). */
function perpanjang(m: Mustahik, catatan: CatatanHarian[], bulanBerjalan: string): { m: Mustahik; hari: number } | null {
  const milik = catatan.filter((c) => c.mustahik_id === m.id && c.tanggal.startsWith(bulanBerjalan));
  const n = m.bulanan.omzet.length;
  if (!milik.length || !m.bulanan.aktif[n - 1]) return null;
  const hari = new Set(milik.map((c) => c.tanggal)).size;
  const f = 30 / hari; // proyeksi: rata-rata per hari tercatat x 30
  const jml = (k: "omzet" | "biaya" | "tabungan" | "pengeluaran") => milik.reduce((a, c) => a + c[k], 0) * f;
  const b = m.bulanan;
  const tab = jml("tabungan");
  const ext = (arr: number[], v: number) => [...arr, v];
  return {
    hari,
    m: {
      ...m,
      bulanan: {
        omzet: ext(b.omzet, jml("omzet")),
        biaya: ext(b.biaya, jml("biaya")),
        pendapatan_lain: ext(b.pendapatan_lain, b.pendapatan_lain[n - 1]),
        tabungan: ext(b.tabungan, tab),
        pengeluaran: ext(b.pengeluaran, jml("pengeluaran")),
        kekayaan: ext(b.kekayaan, b.kekayaan[n - 1] + tab),
        aktif: ext(b.aktif, 1),
        cibest_m: ext(b.cibest_m, b.cibest_m[n - 1]),
        cibest_s: ext(b.cibest_s, b.cibest_s[n - 1]),
      },
    },
  };
}

function analisis(mAsli: Mustahik, p: Parameter, catatan: CatatanHarian[], bulanBerjalan: string): Analisis {
  const ext = perpanjang(mAsli, catatan, bulanBerjalan);
  const m = ext ? ext.m : mAsli;
  const n = m.bulanan.omzet.length;
  const skor = Array.from({ length: n }, (_, t) => skorBulanan(m, t, p));
  const tahap = skor.map((s) => s.tahap);
  const terakhir = skor[n - 1];
  const cs = cusum(deretCusum(m, p), p.cusum.mu0, p.cusum.kappa, p.cusum.h);
  const alasan: string[] = [];
  if (terakhir.tahap !== 6) {
    if (cs.aktif_sekarang) alasan.push("CUSUM: laba menurun berkelanjutan di bawah acuan.");
    const g3 = skor[Math.max(0, n - 4)].G;
    if (g3 !== null && terakhir.G !== null && g3 - terakhir.G > 0.08)
      alasan.push(`Indeks G turun ${(g3 - terakhir.G).toFixed(2)} dalam 3 bulan.`);
    if (n >= 4 && tahap[n - 4] !== 6 && terakhir.tahap < tahap[n - 4]) alasan.push("Tahap turun dibanding 3 bulan lalu.");
  }
  const g6 = skor[Math.max(0, n - 7)].G;
  const stagnan =
    terakhir.tahap <= 3 &&
    tahap.slice(-9).every((t) => t === terakhir.tahap) &&
    g6 !== null &&
    terakhir.G !== null &&
    Math.abs(terakhir.G - g6) < 0.03;
  return {
    m,
    skor,
    tahap,
    terakhir,
    cusum: cs,
    berisiko: alasan.length > 0,
    alasanRisiko: alasan,
    stagnan,
    statusBantuan: statusBantuan(tahap, p.bulan_penurunan_bertahap),
    proyeksi: ext ? { hari: ext.hari } : null,
  };
}

interface Konteks {
  siap: boolean;
  data: DataSintetis | null;
  bulan: string[];
  bulanBerjalan: string;
  parameter: Parameter;
  riwayatParameter: RiwayatParameter[];
  simpanParameter: (p: Parameter, catatan: string) => void;
  resetParameter: () => void;
  sesi: Sesi | null;
  masuk: (s: Sesi) => void;
  keluar: () => void;
  catatan: CatatanHarian[];
  kunjungan: KunjunganLokal[];
  asesmen: AsesmenLokal[];
  audit: LogAudit[];
  tambahCatatan: (c: CatatanHarian, foto?: Blob | null, suara?: Blob | null) => Promise<void>;
  tambahKunjungan: (k: KunjunganLokal) => Promise<void>;
  tambahAsesmen: (a: AsesmenLokal) => Promise<void>;
  catatAudit: (aksi: string, detail?: Record<string, unknown>) => Promise<void>;
  sinkron: () => Promise<{ jumlah: number; mode: "server" | "simulasi" | "luring" }>;
  daring: boolean;
  hasil: Analisis[];
  peta: Map<string, Analisis>;
}

const Ctx = createContext<Konteks | null>(null);

export function PenyediaAplikasi({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataSintetis | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatParameter[]>([]);
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [catatan, setCatatan] = useState<CatatanHarian[]>([]);
  const [kunjungan, setKunjungan] = useState<KunjunganLokal[]>([]);
  const [asesmen, setAsesmen] = useState<AsesmenLokal[]>([]);
  const [audit, setAudit] = useState<LogAudit[]>([]);
  const [daring, setDaring] = useState(true);
  const [lokalSiap, setLokalSiap] = useState(false);

  useEffect(() => {
    fetch("/data/sintetis.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
    setSesi(bacaLS<Sesi | null>(K_SESI, null));
    const r = bacaLS<RiwayatParameter[]>(K_PARAM, []);
    setRiwayat(r.length ? r : [{ versi: PARAMETER_BAWAAN.versi, waktu: "bawaan", catatan: PARAMETER_BAWAAN.status, parameter: PARAMETER_BAWAAN }]);
    (async () => {
      setCatatan(await semua<CatatanHarian>("catatan"));
      setKunjungan(await semua<KunjunganLokal>("kunjungan"));
      setAsesmen(await semua<AsesmenLokal>("asesmen"));
      setAudit((await semua<LogAudit>("audit")).reverse());
      setLokalSiap(true);
    })();
    setDaring(navigator.onLine);
    const on = () => setDaring(true);
    const off = () => setDaring(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const parameter = riwayat.length ? riwayat[riwayat.length - 1].parameter : PARAMETER_BAWAAN;

  const catatAudit = useCallback(
    async (aksi: string, detail: Record<string, unknown> = {}) => {
      const s = bacaLS<Sesi | null>(K_SESI, null);
      const log: LogAudit = { waktu: new Date().toISOString(), peran: s?.peran ?? "-", pengguna: s?.nama ?? "-", aksi, detail: JSON.stringify(detail) };
      const d = await db();
      if (d) log.id = (await d.add("audit", log)) as number;
      setAudit((a) => [log, ...a]);
    },
    [],
  );

  const masuk = useCallback(
    (s: Sesi) => {
      tulisLS(K_SESI, s);
      setSesi(s);
      void catatAudit("masuk", { peran: s.peran });
    },
    [catatAudit],
  );
  const keluar = useCallback(() => {
    void catatAudit("keluar");
    localStorage.removeItem(K_SESI);
    setSesi(null);
  }, [catatAudit]);

  const simpanParameter = useCallback(
    (p: Parameter, ket: string) => {
      setRiwayat((r) => {
        const nomor = r.length + 1;
        const baru = { ...p, versi: `lokal-${nomor}` };
        const out = [...r, { versi: baru.versi, waktu: new Date().toISOString(), catatan: ket, parameter: baru }];
        tulisLS(K_PARAM, out);
        void catatAudit("ubah_parameter", { versi: baru.versi, catatan: ket });
        return out;
      });
    },
    [catatAudit],
  );
  const resetParameter = useCallback(() => {
    simpanParameter(PARAMETER_BAWAAN, "Kembali ke nilai bawaan");
  }, [simpanParameter]);

  const tambahCatatan = useCallback(
    async (c: CatatanHarian, foto?: Blob | null, suara?: Blob | null) => {
      await simpan("catatan", c);
      if (foto) await simpan("lampiran", foto, `${c.uid}:foto`);
      if (suara) await simpan("lampiran", suara, `${c.uid}:suara`);
      setCatatan((x) => [...x.filter((y) => y.uid !== c.uid), c]);
      await catatAudit("catat_usaha", { mustahik: c.mustahik_id, tanggal: c.tanggal });
    },
    [catatAudit],
  );
  const tambahKunjungan = useCallback(
    async (k: KunjunganLokal) => {
      await simpan("kunjungan", k);
      setKunjungan((x) => [...x, k]);
      await catatAudit("kunjungan", { mustahik: k.mustahik_id });
    },
    [catatAudit],
  );
  const tambahAsesmen = useCallback(
    async (a: AsesmenLokal) => {
      await simpan("asesmen", a);
      setAsesmen((x) => [...x, a]);
      await catatAudit("asesmen", { mustahik: a.mustahik_id, rekomendasi: a.rekomendasi, keputusan: a.keputusan_amil });
    },
    [catatAudit],
  );

  const sinkron = useCallback(async () => {
    if (!navigator.onLine) return { jumlah: 0, mode: "luring" as const };
    const belum = catatan.filter((c) => !c.tersinkron);
    if (!belum.length) return { jumlah: 0, mode: API ? ("server" as const) : ("simulasi" as const) };
    let mode: "server" | "simulasi" = "simulasi";
    if (API) {
      const s = bacaLS<Sesi | null>(K_SESI, null);
      const r = await fetch(`${API}/sinkron`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Peran": s?.peran === "pendamping" ? "pendamping" : "mustahik" },
        body: JSON.stringify({ catatan: belum.map(({ uid, mustahik_id, tanggal, omzet, biaya, tabungan, pengeluaran, catatan }) => ({ uid, mustahik_id, tanggal, omzet, biaya, tabungan, pengeluaran, catatan })) }),
      });
      if (!r.ok) throw new Error(`Server menolak sinkronisasi (${r.status}).`);
      mode = "server";
    }
    const baru = belum.map((c) => ({ ...c, tersinkron: true, sinkron_mode: mode }));
    for (const c of baru) await simpan("catatan", c);
    setCatatan((x) => x.map((c) => baru.find((b) => b.uid === c.uid) ?? c));
    await catatAudit("sinkron", { jumlah: baru.length, mode });
    return { jumlah: baru.length, mode };
  }, [catatan, catatAudit]);

  // sinkron otomatis saat kembali daring
  useEffect(() => {
    if (daring && lokalSiap && catatan.some((c) => !c.tersinkron)) void sinkron().catch(() => undefined);
  }, [daring, lokalSiap]); // eslint-disable-line react-hooks/exhaustive-deps

  const bulanBerjalan = hariIni().slice(0, 7);
  const bulan = useMemo(() => {
    if (!data) return [];
    return data.bulan.includes(bulanBerjalan) ? data.bulan : [...data.bulan, bulanBerjalan];
  }, [data, bulanBerjalan]);

  const hasil = useMemo(() => {
    if (!data) return [];
    const kunjByM = new Map<string, KunjunganLokal[]>();
    kunjungan.forEach((k) => kunjByM.set(k.mustahik_id, [...(kunjByM.get(k.mustahik_id) ?? []), k]));
    return data.mustahik.map((m) => {
      const lokal = (kunjByM.get(m.id) ?? []).map((k) => ({
        tanggal: k.tanggal,
        bulan: data.n_bulan,
        ceklis: k.ceklis,
        hambatan: k.hambatan,
        catatan: k.catatan,
        milestone: k.milestone,
        jadwal_berikut: k.jadwal_berikut,
        lokal: true,
      }));
      return analisis({ ...m, kunjungan: [...m.kunjungan, ...lokal] }, parameter, catatan, bulanBerjalan);
    });
  }, [data, parameter, catatan, kunjungan, bulanBerjalan]);

  const peta = useMemo(() => new Map(hasil.map((h) => [h.m.id, h])), [hasil]);

  const nilai: Konteks = {
    siap: !!data && lokalSiap,
    data,
    bulan,
    bulanBerjalan,
    parameter,
    riwayatParameter: riwayat,
    simpanParameter,
    resetParameter,
    sesi,
    masuk,
    keluar,
    catatan,
    kunjungan,
    asesmen,
    audit,
    tambahCatatan,
    tambahKunjungan,
    tambahAsesmen,
    catatAudit,
    sinkron,
    daring,
    hasil,
    peta,
  };
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}

export function useAplikasi() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAplikasi harus di dalam PenyediaAplikasi");
  return c;
}

export const API_URL = API;
