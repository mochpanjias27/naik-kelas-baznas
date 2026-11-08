"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, PauseCircle, Search } from "lucide-react";
import { Shell } from "@/components/Shell";
import { NAMA_PENDEK, PernyataanAmil, TahapBadge, WARNA_TAHAP } from "@/components/ui";
import { useAplikasi } from "@/lib/aplikasi";
import { angka } from "@/lib/format";

function Isi() {
  const { hasil, sesi, data } = useAplikasi();
  const [cari, setCari] = useState("");
  const [tahap, setTahap] = useState<number | null>(null);
  const [filter, setFilter] = useState<"semua" | "risiko" | "stagnan">("semua");
  const [kel, setKel] = useState("Semua");

  const wilayahku = useMemo(() => hasil.filter((h) => sesi!.wilayah === "Semua" || h.m.wilayah === sesi!.wilayah), [hasil, sesi]);
  const daftar = wilayahku
    .filter((h) => !cari || h.m.alias.toLowerCase().includes(cari.toLowerCase()) || h.m.id.toLowerCase().includes(cari.toLowerCase()))
    .filter((h) => tahap === null || h.terakhir.tahap === tahap)
    .filter((h) => filter === "semua" || (filter === "risiko" ? h.berisiko : h.stagnan))
    .filter((h) => kel === "Semua" || h.m.kelompok === kel)
    .sort((a, b) => Number(b.berisiko) - Number(a.berisiko) || (a.terakhir.G ?? -1) - (b.terakhir.G ?? -1));

  const hitung = (t: number) => wilayahku.filter((h) => h.terakhir.tahap === t).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Mustahik dampingan</h1>
        <p className="teks-kecil">
          {wilayahku.length} mustahik · {wilayahku.filter((h) => h.berisiko).length} berisiko · {wilayahku.filter((h) => h.stagnan).length} stagnan
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-garis bg-white px-3">
        <Search size={18} className="text-abu" />
        <input className="w-full bg-transparent py-3 outline-none" placeholder="Cari nama samaran atau kode" value={cari} onChange={(e) => setCari(e.target.value)} />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button onClick={() => setTahap(null)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${tahap === null ? "bg-tinta text-white" : "bg-white text-abu ring-1 ring-garis"}`}>
          Semua tahap
        </button>
        {[1, 2, 3, 4, 5, 6].map((t) => (
          <button
            key={t}
            onClick={() => setTahap(tahap === t ? null : t)}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ring-1"
            style={tahap === t ? { background: WARNA_TAHAP[t], color: "white", borderColor: WARNA_TAHAP[t] } : { background: "white", color: WARNA_TAHAP[t], boxShadow: `inset 0 0 0 1px ${WARNA_TAHAP[t]}40` }}
          >
            {NAMA_PENDEK[t]} · {hitung(t)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["semua", "risiko", "stagnan"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filter === f ? "bg-ungu-600 text-white" : "bg-white text-abu ring-1 ring-garis"}`}>
            {f === "semua" ? "Semua status" : f === "risiko" ? "Berisiko" : "Stagnan"}
          </button>
        ))}
        <select className="rounded-full border border-garis bg-white px-3 py-1.5 text-sm font-semibold text-abu" value={kel} onChange={(e) => setKel(e.target.value)} aria-label="Kelompok intervensi">
          <option value="Semua">Semua kelompok</option>
          {data?.kelompok.map((k) => (
            <option key={k.kode} value={k.kode}>
              {k.kode}: {k.nama}
            </option>
          ))}
        </select>
      </div>

      <ul className="kartu divide-y divide-garis overflow-hidden">
        {daftar.length === 0 && <li className="p-6 text-center text-sm text-abu">Tidak ada mustahik yang cocok.</li>}
        {daftar.map((h) => (
          <li key={h.m.id}>
            <Link href={`/pendamping/detail/?id=${h.m.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ungu-50/50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{h.m.alias}</span>
                  {h.berisiko && <AlertTriangle size={15} className="text-t1" aria-label="Berisiko" />}
                  {h.stagnan && <PauseCircle size={15} className="text-t2" aria-label="Stagnan" />}
                </div>
                <div className="truncate text-xs text-abu">
                  {h.m.sektor} · Kelompok {h.m.kelompok} · {h.m.wilayah}
                </div>
              </div>
              <div className="text-right">
                <TahapBadge tahap={h.terakhir.tahap} />
                <div className="mt-1 text-xs text-abu">G {angka(h.terakhir.G)}</div>
              </div>
              <ChevronRight size={18} className="text-abu" />
            </Link>
          </li>
        ))}
      </ul>
      <PernyataanAmil ringkas />
    </div>
  );
}

export default function Halaman() {
  return (
    <Shell peran={["pendamping", "manajer"]}>
      <Isi />
    </Shell>
  );
}
