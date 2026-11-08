"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CatatanKalibrasi, Memuat, PernyataanAmil } from "@/components/ui";
import { useAplikasi } from "@/lib/aplikasi";
import { nilaiAsesmen } from "@/lib/engine";
import { angka, uid } from "@/lib/format";

const SKALA = ["Tidak ada", "Kurang", "Cukup", "Baik"];

function Isi() {
  const id = useSearchParams().get("id") ?? "";
  const { peta, parameter, tambahAsesmen, sesi } = useAplikasi();
  const router = useRouter();
  const a = peta.get(id);
  const [jawab, setJawab] = useState<Record<string, number>>({});
  const [keputusan, setKeputusan] = useState("");
  const konf = parameter.asesmen;
  const lengkap = konf.pertanyaan.every((q) => jawab[q.kode] !== undefined);
  const hasil = useMemo(() => (lengkap ? nilaiAsesmen(jawab, konf) : null), [jawab, konf, lengkap]);

  if (!a) return <Memuat />;

  return (
    <div className="space-y-4">
      <Link href={`/pendamping/detail/?id=${id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-abu hover:text-ungu-700">
        <ArrowLeft size={16} /> {a.m.alias}
      </Link>
      <div>
        <h1 className="text-2xl font-extrabold">Asesmen kesiapan wirausaha</h1>
        <CatatanKalibrasi teks="Bobot butir dan ambang adalah nilai awal untuk demonstrasi, belum dikalibrasi." />
      </div>

      {konf.pertanyaan.map((q, i) => (
        <div key={q.kode} className="kartu p-4">
          <div className="font-bold">
            {i + 1}. {q.teks}
          </div>
          <div className="mt-0.5 text-xs text-abu">
            Bobot {q.bobot}
            {q.gugur_bila_nol && " · syarat minimal (tidak boleh 0)"}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {SKALA.map((s, v) => (
              <button
                key={s}
                type="button"
                onClick={() => setJawab({ ...jawab, [q.kode]: v })}
                className={`rounded-xl px-1 py-2.5 text-xs font-semibold ${jawab[q.kode] === v ? "bg-ungu-600 text-white" : "bg-latar text-abu ring-1 ring-garis"}`}
              >
                <div className="text-base">{v}</div>
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}

      {hasil && (
        <div className="kartu p-5">
          <div className="text-sm text-abu">Rekomendasi sistem</div>
          <div className={`text-2xl font-extrabold ${hasil.rekomendasi === "Produktif" ? "text-t4" : "text-t2"}`}>{hasil.rekomendasi}</div>
          <div className="mt-1 text-sm">Skor kesiapan: {angka(hasil.skor, 1)} / 100</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-abu">
            {hasil.alasan.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-abu">
            Aturan: Produktif bila skor ≥ {konf.ambang_produktif} dan tidak ada syarat minimal bernilai 0. Skor = 100 × Σ(bobot × jawaban) / Σ(bobot × 3).
          </p>
          <div className="mt-4">
            <div className="label">Keputusan amil</div>
            <div className="grid grid-cols-3 gap-2">
              {["Produktif", "Tetap konsumtif", "Tunda/asesmen ulang"].map((k) => (
                <button key={k} onClick={() => setKeputusan(k)} className={`rounded-xl px-2 py-3 text-sm font-semibold ${keputusan === k ? "bg-tinta text-white" : "bg-white ring-1 ring-garis"}`}>
                  {k}
                </button>
              ))}
            </div>
          </div>
          <button
            className="tombol-utama mt-4 w-full"
            disabled={!keputusan}
            onClick={async () => {
              await tambahAsesmen({ uid: uid(), mustahik_id: id, jawaban: jawab, skor: hasil.skor, rekomendasi: hasil.rekomendasi, keputusan_amil: keputusan, oleh: sesi!.nama, dibuat: new Date().toISOString() });
              router.push(`/pendamping/detail/?id=${id}`);
            }}
          >
            Simpan asesmen
          </button>
        </div>
      )}
      <PernyataanAmil ringkas />
    </div>
  );
}

export default function Halaman() {
  return (
    <Shell peran="pendamping">
      <Suspense fallback={<Memuat />}>
        <Isi />
      </Suspense>
    </Shell>
  );
}
