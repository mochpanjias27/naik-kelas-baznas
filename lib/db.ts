// Penyimpanan lokal offline-first (IndexedDB). Semua catatan dibuat di perangkat
// lebih dulu, lalu disinkronkan saat daring.
import { openDB, type IDBPDatabase } from "idb";

export interface CatatanHarian {
  uid: string;
  mustahik_id: string;
  tanggal: string; // YYYY-MM-DD
  omzet: number;
  biaya: number;
  tabungan: number;
  pengeluaran: number;
  catatan: string;
  ada_foto: boolean;
  ada_suara: boolean;
  dibuat: string;
  tersinkron: boolean;
  sinkron_mode?: "server" | "simulasi";
}

export interface KunjunganLokal {
  uid: string;
  mustahik_id: string;
  tanggal: string;
  ceklis: boolean[];
  hambatan: string[];
  catatan: string;
  milestone: string;
  jadwal_berikut: string;
  oleh: string;
  dibuat: string;
}

export interface AsesmenLokal {
  uid: string;
  mustahik_id: string;
  jawaban: Record<string, number>;
  skor: number;
  rekomendasi: string;
  keputusan_amil: string;
  oleh: string;
  dibuat: string;
}

export interface LogAudit {
  id?: number;
  waktu: string;
  peran: string;
  pengguna: string;
  aksi: string;
  detail: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export function db() {
  if (typeof indexedDB === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB("naik-kelas", 1, {
      upgrade(d) {
        d.createObjectStore("catatan", { keyPath: "uid" });
        d.createObjectStore("kunjungan", { keyPath: "uid" });
        d.createObjectStore("asesmen", { keyPath: "uid" });
        d.createObjectStore("audit", { keyPath: "id", autoIncrement: true });
        d.createObjectStore("lampiran"); // key: `${uid}:foto` | `${uid}:suara` -> Blob
      },
    });
  }
  return dbPromise;
}

export async function semua<T>(store: string): Promise<T[]> {
  const d = await db();
  return d ? ((await d.getAll(store)) as T[]) : [];
}

export async function simpan(store: string, nilai: unknown, kunci?: IDBValidKey) {
  const d = await db();
  if (d) await d.put(store, nilai, kunci);
}

export async function hapusSemua() {
  const d = await db();
  if (!d) return;
  for (const s of ["catatan", "kunjungan", "asesmen", "audit", "lampiran"]) await d.clear(s);
}
