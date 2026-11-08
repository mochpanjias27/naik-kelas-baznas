"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Bagian, CatatanKalibrasi, Stat, TahapBadge } from "@/components/ui";
import { GrafikBatang } from "@/components/grafik";
import { useAplikasi } from "@/lib/aplikasi";
import { analisisSensitivitas, bobotTernormal, nisabRupiah } from "@/lib/engine";
import { angka, persen } from "@/lib/format";

function histogram(v: number[], lo: number, hi: number, bin: number) {
  const lebar = (hi - lo) / bin;
  const c = new Array(bin).fill(0);
  v.forEach((x) => {
    const i = Math.min(bin - 1, Math.max(0, Math.floor((x - lo) / lebar)));
    c[i]++;
  });
  return c.map((n, i) => ({ b: (lo + (i + 0.5) * lebar).toFixed(2), n }));
}

function Isi() {
  const { hasil, parameter, catatAudit } = useAplikasi();
  const [nSampel, setNSampel] = useState(parameter.sensitivitas.n_sampel);
  const [konsentrasi, setKonsentrasi] = useState(parameter.sensitivitas.konsentrasi);
  const [sibuk, setSibuk] = useState(false);
  const [r, setR] = useState<ReturnType<typeof analisisSensitivitas> | null>(null);

  const aktif = useMemo(() => hasil.filter((h) => h.terakhir.G !== null && h.terakhir.s), [hasil]);

  const jalankan = () => {
    setSibuk(true);
    setTimeout(() => {
      const out = analisisSensitivitas({
        S: aktif.map((h) => h.terakhir.s!),
        wDasar: bobotTernormal(parameter),
        rho: parameter.rho,
        ambang: parameter.ambang,
        kekayaan: aktif.map((h) => h.m.bulanan.kekayaan[h.m.bulanan.kekayaan.length - 1]),
        nisab: nisabRupiah(parameter.nisab_gram, parameter.harga_emas_per_gram),
        nSampel,
        konsentrasi,
        seed: 1,
      });
      setR(out);
      setSibuk(false);
      void catatAudit("analisis_sensitivitas", { n_sampel: nSampel, konsentrasi, versi: parameter.versi });
    }, 30);
  };

  const rawan = r
    ? aktif
        .map((h, i) => ({ h, p: r.peluang_ganti_per_orang[i] }))
        .sort((a, b) => b.p - a.p)
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Analisis sensitivitas bobot</h1>
        <p className="teks-kecil">
          Seberapa stabil peringkat dan tahap mustahik bila bobot indikator diubah? Bobot sampel w ~ Dirichlet(c · w₀) di sekitar bobot dasar w₀. Dihitung untuk{" "}
          {aktif.length} usaha aktif pada bulan terakhir.
        </p>
        <CatatanKalibrasi />
      </div>

      <Bagian judul="Pengaturan">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="ns">
              Jumlah sampel
            </label>
            <input id="ns" type="number" min={10} max={5000} className="masukan w-36" value={nSampel} onChange={(e) => setNSampel(Math.max(10, Math.min(5000, Number(e.target.value))))} />
          </div>
          <div>
            <label className="label" htmlFor="kc">
              Konsentrasi c
            </label>
            <input id="kc" type="number" min={1} step={1} className="masukan w-36" value={konsentrasi} onChange={(e) => setKonsentrasi(Math.max(0.5, Number(e.target.value)))} />
          </div>
          <button className="tombol-cta" disabled={sibuk} onClick={jalankan}>
            <Play size={16} /> {sibuk ? "Menghitung…" : "Jalankan analisis"}
          </button>
        </div>
        <p className="mt-2 text-xs text-abu">c kecil = bobot sampel menyebar jauh dari w₀ (uji lebih keras); c besar = perubahan bobot kecil.</p>
      </Bagian>

      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat nilai={angka(r.tau_rata, 3)} label="Rata-rata Kendall τ" sub="terhadap peringkat dasar" warna="#5b3df5" />
            <Stat nilai={`${angka(r.tau_q05, 2)}–${angka(r.tau_q95, 2)}`} label="Rentang τ (5%–95%)" />
            <Stat nilai={persen(r.proporsi_ganti_rata, 1)} label="Rata-rata berganti tahap" sub="proporsi mustahik per sampel" warna="var(--color-oranye-500)" />
            <Stat nilai={r.tau.length} label="Sampel bobot" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Bagian judul="Sebaran Kendall τ">
              <GrafikBatang data={histogram(r.tau, Math.min(...r.tau), 1, 20)} kunci="n" label="Jumlah sampel" />
            </Bagian>
            <Bagian judul="Sebaran proporsi berganti tahap">
              <GrafikBatang data={histogram(r.proporsi_ganti_tahap, 0, Math.max(0.01, ...r.proporsi_ganti_tahap), 20)} kunci="n" warna="#ff5a36" label="Jumlah sampel" />
            </Bagian>
          </div>
          <Bagian judul="10 mustahik dengan tahap paling sensitif terhadap bobot">
            <ul className="divide-y divide-garis text-sm">
              {rawan.map(({ h, p }) => (
                <li key={h.m.id} className="flex items-center justify-between gap-2 py-2">
                  <Link href={`/pendamping/detail/?id=${h.m.id}`} className="hover:text-ungu-700">
                    <b>{h.m.alias}</b> <span className="text-xs text-abu">G {angka(h.terakhir.G)}</span>
                  </Link>
                  <span className="flex items-center gap-2">
                    <TahapBadge tahap={h.terakhir.tahap} />
                    <span className="w-16 text-right font-semibold">{persen(p, 0)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-abu">Persentase = peluang tahap berubah di bawah bobot sampel. Biasanya mustahik dengan G dekat ambang.</p>
          </Bagian>
        </>
      )}
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
