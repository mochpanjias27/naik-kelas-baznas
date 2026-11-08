"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BarChart3, HeartHandshake, UserRound, ShieldAlert } from "lucide-react";
import { useAplikasi } from "@/lib/aplikasi";
import { LabelSintetis, Logo, PernyataanAmil } from "@/components/ui";

export default function Masuk() {
  const { data, masuk } = useAplikasi();
  const router = useRouter();
  const [mid, setMid] = useState("M001");
  const [wil, setWil] = useState("Semua");

  const wilayah = data ? Array.from(new Set(data.mustahik.map((m) => m.wilayah))).sort() : [];

  return (
    <div className="min-h-screen">
      <div className="hero-ungu px-4 pb-28 pt-5 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Logo terang kecil />
          <LabelSintetis gelap />
        </div>
        <div className="mx-auto mt-10 max-w-4xl">
          <span className="eyebrow bg-white/15 text-white ring-1 ring-white/25">Mode demo</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Pilih peran untuk masuk</h1>
          <p className="mt-2 max-w-xl text-white/80">
            Akun demo tanpa kata sandi. Tidak ada data identitas asli; semua mustahik memakai kode samaran.
          </p>
        </div>
      </div>

      <div className="mx-auto -mt-20 grid max-w-4xl gap-4 px-4 md:grid-cols-3">
        <div className="kartu flex flex-col p-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ungu-50 text-ungu-600">
            <UserRound size={22} />
          </span>
          <h2 className="mt-4 text-lg font-bold">Mustahik pengusaha</h2>
          <p className="mt-1 text-sm text-abu">Mencatat usaha harian dan melihat kemajuan sederhana.</p>
          <label className="label mt-4" htmlFor="mid">
            Akun demo
          </label>
          <select id="mid" className="masukan" value={mid} onChange={(e) => setMid(e.target.value)}>
            {data?.mustahik.slice(0, 30).map((m) => (
              <option key={m.id} value={m.id}>
                {m.alias} · {m.sektor}
              </option>
            ))}
          </select>
          <button
            className="tombol-utama mt-auto w-full"
            style={{ marginTop: "1.25rem" }}
            disabled={!data}
            onClick={() => {
              const m = data!.mustahik.find((x) => x.id === mid)!;
              masuk({ peran: "mustahik", nama: m.alias, mustahik_id: m.id });
              router.push("/mustahik/");
            }}
          >
            Masuk <ArrowRight size={16} />
          </button>
        </div>

        <div className="kartu flex flex-col p-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ungu-50 text-ungu-600">
            <HeartHandshake size={22} />
          </span>
          <h2 className="mt-4 text-lg font-bold">Pendamping / amil</h2>
          <p className="mt-1 text-sm text-abu">Asesmen, kunjungan, catatan, dan rekomendasi tindakan.</p>
          <label className="label mt-4" htmlFor="wil">
            Wilayah dampingan
          </label>
          <select id="wil" className="masukan" value={wil} onChange={(e) => setWil(e.target.value)}>
            <option value="Semua">Semua wilayah (demo)</option>
            {wilayah.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
          <button
            className="tombol-utama w-full"
            style={{ marginTop: "1.25rem" }}
            disabled={!data}
            onClick={() => {
              masuk({ peran: "pendamping", nama: wil === "Semua" ? "Pendamping (semua wilayah)" : `Pendamping ${wil}`, wilayah: wil });
              router.push("/pendamping/");
            }}
          >
            Masuk <ArrowRight size={16} />
          </button>
        </div>

        <div className="kartu flex flex-col p-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ungu-50 text-ungu-600">
            <BarChart3 size={22} />
          </span>
          <h2 className="mt-4 text-lg font-bold">Manajer program</h2>
          <p className="mt-1 text-sm text-abu">Dasbor agregat, lintasan, sensitivitas, parameter, dan ekspor data.</p>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            <ShieldAlert size={15} className="mt-0.5 shrink-0" /> Hanya peran ini yang dapat mengubah parameter dan mengekspor data.
          </div>
          <button
            className="tombol-utama w-full"
            style={{ marginTop: "1.25rem" }}
            disabled={!data}
            onClick={() => {
              masuk({ peran: "manajer", nama: "Manajer Program (demo)" });
              router.push("/manajer/");
            }}
          >
            Masuk <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PernyataanAmil />
      </div>
    </div>
  );
}
