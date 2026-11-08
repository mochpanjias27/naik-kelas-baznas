"use client";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Shell } from "@/components/Shell";
import { Bagian, CatatanKalibrasi, Stat } from "@/components/ui";
import { GrafikGaris } from "@/components/grafik";
import { MODAL_BAWAAN, analisisModal, batasK, cekModal, lintasanModal, produksi, type ModalParam } from "@/lib/engine";
import { angka } from "@/lib/format";

const BIDANG: { k: keyof ModalParam; label: string; step: number }[] = [
  { k: "alpha", label: "α (elastisitas modal)", step: 0.05 },
  { k: "A_L", label: "A_L (produktivitas teknologi rendah)", step: 0.1 },
  { k: "A_H", label: "A_H (produktivitas teknologi tinggi)", step: 0.1 },
  { k: "F", label: "F (biaya tetap teknologi tinggi)", step: 0.5 },
  { k: "s", label: "s (laju reinvestasi)", step: 0.01 },
  { k: "delta", label: "δ (penyusutan)", step: 0.01 },
  { k: "k0", label: "k₀ (modal awal mustahik)", step: 0.5 },
];

function Isi() {
  const [p, setP] = useState<ModalParam>(MODAL_BAWAAN);
  const hasil = useMemo(() => {
    try {
      cekModal(p);
      return { ok: true as const, r: analisisModal(p) };
    } catch (e) {
      return { ok: false as const, galat: (e as Error).message };
    }
  }, [p]);

  const kurva = useMemo(() => {
    if (!hasil.ok) return [];
    const kMax = Math.min(batasK(p), Math.max(...hasil.r.titik_tetap.map((x) => x.k), p.k0, 10) * 1.3);
    return Array.from({ length: 160 }, (_, i) => {
      const k = (kMax * i) / 159;
      return { k: +k.toFixed(2), sfk: +(p.s * produksi(k, p)).toFixed(4), dk: +(p.delta * k).toFixed(4) };
    });
  }, [p, hasil]);

  const jalur = useMemo(() => {
    if (!hasil.ok) return [];
    const a = lintasanModal(p, p.k0, 40);
    const b = hasil.r.z_star !== null ? lintasanModal(p, p.k0 + hasil.r.z_star * 1.02 + 0.01, 40) : null;
    return a.map((v, t) => ({ b: String(t), "Tanpa suntikan": +v.toFixed(3), ...(b ? { "Dengan suntikan z*": +b[t].toFixed(3) } : {}) }));
  }, [p, hasil]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Kalkulator modal minimum</h1>
        <p className="teks-kecil">
          Model jebakan kemiskinan versi sederhana: kₜ₊₁ = (1−δ)kₜ + s·f(kₜ), f(k) = max{"{"}A_L k^α, A_H k^α − F{"}"}. Untuk demonstrasi konsep, bukan perhitungan nilai bantuan.
        </p>
        <CatatanKalibrasi teks="Semua parameter ilustratif, dalam satuan modal abstrak; belum dikalibrasi." />
      </div>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Bagian judul="Parameter">
          <div className="space-y-3">
            {BIDANG.map((b) => (
              <div key={b.k}>
                <label className="label text-xs" htmlFor={b.k}>
                  {b.label}
                </label>
                <input id={b.k} type="number" step={b.step} className="masukan py-2" value={p[b.k]} onChange={(e) => setP({ ...p, [b.k]: Number(e.target.value) })} />
              </div>
            ))}
            <button className="tombol-garis w-full" onClick={() => setP(MODAL_BAWAAN)}>
              Kembali ke nilai awal
            </button>
          </div>
        </Bagian>
        <div className="space-y-5">
          {!hasil.ok ? (
            <p className="kartu p-4 text-red-700">{hasil.galat}</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Stat nilai={hasil.r.k_hat === null ? "–" : angka(hasil.r.k_hat, 2)} label="Ambang jebakan k̂" />
                <Stat nilai={hasil.r.z_star === null ? "–" : angka(hasil.r.z_star, 2)} label="Modal minimum z*" warna="var(--color-oranye-500)" />
                <Stat nilai={hasil.r.titik_tetap.length} label="Titik tetap positif" />
              </div>
              <div className={`flex gap-2 rounded-2xl p-4 text-sm ${hasil.r.ada_jebakan ? "bg-ungu-50 text-ungu-900" : "bg-amber-50 text-amber-900"}`}>
                {!hasil.r.ada_jebakan && <AlertTriangle size={18} className="shrink-0" />}
                <p>{hasil.r.pesan}</p>
              </div>
              <Bagian judul="Dinamika: s·f(k) vs δk">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={kurva} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke="#ece9f7" vertical={false} />
                    <XAxis dataKey="k" type="number" tick={{ fontSize: 11 }} domain={["dataMin", "dataMax"]} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line dataKey="sfk" name="s·f(k) (investasi)" stroke="#5b3df5" strokeWidth={2.4} dot={false} />
                    <Line dataKey="dk" name="δk (penyusutan)" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 4" />
                    {hasil.r.titik_tetap.map((x) => (
                      <ReferenceDot key={x.k} x={x.k} y={p.delta * x.k} r={5} fill={x.jenis === "stabil" ? "#10b981" : "#e5484d"} stroke="white" />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <p className="mt-1 text-xs text-abu">Titik hijau = titik tetap stabil; merah = tak stabil (ambang jebakan). Di kiri k̂ modal menyusut ke titik rendah.</p>
              </Bagian>
              <Bagian judul="Lintasan modal">
                <GrafikGaris
                  data={jalur}
                  seri={[
                    { kunci: "Tanpa suntikan", warna: "#94a3b8" },
                    ...(hasil.r.z_star !== null ? [{ kunci: "Dengan suntikan z*", warna: "#ff5a36" }] : []),
                  ]}
                />
                <p className="mt-1 text-xs text-abu">Sumbu datar: periode. Suntikan sedikit di atas z* (+2%) agar lintasan melewati ambang k̂.</p>
              </Bagian>
            </>
          )}
        </div>
      </div>
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
