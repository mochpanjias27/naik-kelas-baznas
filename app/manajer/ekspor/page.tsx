"use client";
import { useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Bagian } from "@/components/ui";
import { useAplikasi, type Analisis } from "@/lib/aplikasi";

type Jenis = "skor" | "bulanan" | "ringkasan";

/** Kode anonim: hash FNV-1a dari (garam acak per ekspor + id). Tidak dapat dibalik tanpa garam. */
function anonimkan(id: string, garam: string) {
  let h = 0x811c9dc5;
  for (const ch of garam + id) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return "X" + h.toString(36).toUpperCase().padStart(7, "0");
}

const csvSel = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(6)) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function Isi() {
  const { hasil, parameter, bulan, catatAudit } = useAplikasi();
  const [jenis, setJenis] = useState<Jenis>("skor");
  const [pesan, setPesan] = useState("");

  const bangun = (garam: string) => {
    const kode = (h: Analisis) => anonimkan(h.m.id, garam);
    const kepala: string[] = [];
    const baris: unknown[][] = [];
    const indik = parameter.indikator.map((i) => i.kode);
    if (jenis === "skor") {
      kepala.push("kode_anon", "kelompok", "sektor", "bulan", "proyeksi", "G", "tahap", ...indik.map((k) => `s_${k}`), ...indik.map((k) => `kontribusi_${k}`), "versi_parameter");
      hasil.forEach((h) =>
        h.skor.forEach((s, t) =>
          baris.push([kode(h), h.m.kelompok, h.m.sektor, bulan[t], h.proyeksi && t === h.skor.length - 1 ? 1 : 0, s.G, s.tahap, ...(s.s ?? indik.map(() => null)), ...(s.kontribusi ?? indik.map(() => null)), s.versi]),
        ),
      );
    } else if (jenis === "bulanan") {
      kepala.push("kode_anon", "kelompok", "sektor", "anggota_rt", "bulan", "omzet", "biaya", "pendapatan_lain", "tabungan", "pengeluaran_rt", "kekayaan_bersih", "aktif");
      hasil.forEach((h) => {
        const b = h.m.bulanan;
        b.omzet.forEach((_, t) => baris.push([kode(h), h.m.kelompok, h.m.sektor, h.m.anggota_rt, bulan[t], b.omzet[t], b.biaya[t], b.pendapatan_lain[t], b.tabungan[t], b.pengeluaran[t], b.kekayaan[t], b.aktif[t]]));
      });
    } else {
      kepala.push("kode_anon", "kelompok", "sektor", "tahap_awal", "tahap_akhir", "G_awal", "G_akhir", "berisiko", "stagnan", "status_bantuan", "versi_parameter");
      hasil.forEach((h) => baris.push([kode(h), h.m.kelompok, h.m.sektor, h.tahap[0], h.terakhir.tahap, h.skor[0].G, h.terakhir.G, h.berisiko ? 1 : 0, h.stagnan ? 1 : 0, h.statusBantuan, h.terakhir.versi]));
    }
    const komentar = `# DATA SINTETIS - bukan data nyata. Ekspor teranonimkan (${jenis}); parameter ${parameter.versi} (belum dikalibrasi); dibuat ${new Date().toISOString()}`;
    return [komentar, kepala.join(","), ...baris.map((r) => r.map(csvSel).join(","))].join("\n");
  };

  const unduh = async () => {
    const garam = Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => x.toString(16).padStart(2, "0")).join("");
    const csv = bangun(garam);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `naik-kelas_${jenis}_sintetis_anon.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    await catatAudit("ekspor", { jenis, baris: csv.split("\n").length - 2, versi: parameter.versi });
    setPesan(`Berkas ${a.download} dibuat (${csv.split("\n").length - 2} baris). Aksi tercatat di log audit.`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Ekspor data teranonimkan</h1>
        <p className="teks-kecil">CSV untuk analisis lanjutan (R, Stata, Python, Excel).</p>
      </div>
      <Bagian judul="Pilih data">
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["skor", "Skor bulanan", "G, tahap, s_k, kontribusi, versi parameter per mustahik-bulan"],
              ["bulanan", "Buku usaha bulanan", "Omzet, biaya, tabungan, pengeluaran, kekayaan, status aktif"],
              ["ringkasan", "Ringkasan per mustahik", "Tahap awal/akhir, G, risiko, stagnan, status bantuan"],
            ] as [Jenis, string, string][]
          ).map(([k, j, d]) => (
            <button key={k} onClick={() => setJenis(k)} className={`rounded-2xl border p-4 text-left ${jenis === k ? "border-ungu-500 bg-ungu-50 ring-4 ring-ungu-100" : "border-garis bg-white"}`}>
              <div className="font-bold">{j}</div>
              <div className="mt-1 text-xs text-abu">{d}</div>
            </button>
          ))}
        </div>
        <button className="tombol-cta mt-4" onClick={unduh}>
          <Download size={17} /> Unduh CSV
        </button>
        {pesan && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{pesan}</p>}
      </Bagian>
      <Bagian judul={<span className="flex items-center gap-2"><ShieldCheck size={18} className="text-t4" /> Perlindungan yang diterapkan</span>}>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Kode mustahik diganti kode anonim dari hash dengan garam acak yang berbeda pada setiap ekspor dan tidak disimpan.</li>
          <li>Nama samaran, wilayah, dan nama pendamping tidak diekspor.</li>
          <li>Baris pertama berkas memuat label DATA SINTETIS dan versi parameter.</li>
          <li>Hanya peran manajer yang dapat mengekspor; setiap ekspor tercatat di log audit.</li>
        </ul>
        <p className="mt-2 text-xs text-abu">Untuk data nyata, anonimisasi perlu ditambah (mis. pengelompokan wilayah/umur dan uji risiko identifikasi ulang).</p>
      </Bagian>
    </div>
  );
}

export default function Halaman() {
  return (
    <Shell peran="manajer">
      <Isi />
    </Shell>
  );
}
