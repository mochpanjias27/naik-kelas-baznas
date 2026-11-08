"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { CircleOff, FlaskConical, HandCoins, Info, LifeBuoy, Scale, ShieldCheck, Sprout, TrendingUp, type LucideIcon } from "lucide-react";
import { NAMA_TAHAP } from "@/lib/engine";

export const WARNA_TAHAP: Record<number, string> = {
  1: "var(--color-t1)",
  2: "var(--color-t2)",
  3: "var(--color-t3)",
  4: "var(--color-t4)",
  5: "var(--color-t5)",
  6: "var(--color-t6)",
};
export const IKON_TAHAP: Record<number, LucideIcon> = { 1: LifeBuoy, 2: Sprout, 3: ShieldCheck, 4: TrendingUp, 5: HandCoins, 6: CircleOff };
export const NAMA_PENDEK: Record<number, string> = { 1: "Rentan", 2: "Memulai", 3: "Bertahan", 4: "Mandiri", 5: "Muzakki", 6: "Keluar" };

export function Logo({ terang = false, kecil = false }: { terang?: boolean; kecil?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-extrabold tracking-tight ${terang ? "text-white" : "text-tinta"}`}>
      <span className={`grid place-items-center rounded-xl ${kecil ? "h-8 w-8" : "h-9 w-9"} ${terang ? "bg-white/15 ring-1 ring-white/30" : "bg-ungu-600 text-white"}`}>
        <TrendingUp size={kecil ? 16 : 18} strokeWidth={2.6} />
      </span>
      <span className={kecil ? "text-lg" : "text-xl"}>Naik Kelas</span>
    </Link>
  );
}

export function TahapIkon({ tahap, ukuran = 44 }: { tahap: number; ukuran?: number }) {
  const I = IKON_TAHAP[tahap];
  return (
    <span className="grid shrink-0 place-items-center rounded-2xl text-white" style={{ background: WARNA_TAHAP[tahap], width: ukuran, height: ukuran }} aria-hidden>
      <I size={ukuran * 0.5} strokeWidth={2.3} />
    </span>
  );
}

export function TahapBadge({ tahap }: { tahap: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `color-mix(in srgb, ${WARNA_TAHAP[tahap]} 14%, white)`, color: WARNA_TAHAP[tahap] }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: WARNA_TAHAP[tahap] }} />
      {tahap <= 5 ? `${tahap}. ` : ""}
      {NAMA_PENDEK[tahap]}
    </span>
  );
}

export function LabelSintetis({ gelap = false }: { gelap?: boolean }) {
  return (
    <span className={`eyebrow ${gelap ? "bg-white/15 text-white ring-1 ring-white/25" : "bg-amber-100 text-amber-800"}`} title="Seluruh data pada aplikasi ini dibangkitkan secara sintetis">
      <FlaskConical size={13} /> SINTETIS
    </span>
  );
}

export function PernyataanAmil({ ringkas = false }: { ringkas?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-ungu-200 bg-ungu-50 px-4 py-3 text-sm text-ungu-900">
      <Scale size={18} className="mt-0.5 shrink-0 text-ungu-600" />
      <p>
        <b>Alat bantu keputusan.</b> Skor tidak menentukan hak penerima; keputusan akhir ada pada amil.
        {!ringkas && " Setiap skor disertai kontribusi indikator dan versi parameter."}
      </p>
    </div>
  );
}

export function CatatanKalibrasi({ teks = "Nilai awal untuk demonstrasi, belum dikalibrasi." }: { teks?: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
      <Info size={13} /> {teks}
    </p>
  );
}

export function Stat({ nilai, label, sub, warna }: { nilai: ReactNode; label: string; sub?: ReactNode; warna?: string }) {
  return (
    <div className="kartu p-4">
      <div className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={warna ? { color: warna } : undefined}>
        {nilai}
      </div>
      <div className="mt-1 text-sm font-semibold text-tinta">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-abu">{sub}</div>}
    </div>
  );
}

export function Bagian({ judul, aksi, children, className = "" }: { judul: ReactNode; aksi?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`kartu p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="judul-bagian">{judul}</h2>
        {aksi}
      </div>
      {children}
    </section>
  );
}

export function Memuat({ teks = "Memuat data sintetis…" }: { teks?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center text-abu">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ungu-200 border-t-ungu-600" />
        {teks}
      </div>
    </div>
  );
}

export function NamaTahap({ tahap }: { tahap: number }) {
  return <>{NAMA_TAHAP[tahap]}</>;
}
