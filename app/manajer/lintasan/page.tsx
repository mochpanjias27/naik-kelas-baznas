"use client";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Bagian, CatatanKalibrasi, NAMA_PENDEK, WARNA_TAHAP } from "@/components/ui";
import { GrafikArea } from "@/components/grafik";
import { useAplikasi } from "@/lib/aplikasi";
import { estimasiPosterior, hitungTransisi, simulasiLintasan } from "@/lib/engine";
import { angka, persen } from "@/lib/format";

const KEADAAN = [1, 2, 3, 4, 5, 6];

function Isi() {
  const { hasil, parameter, data } = useAplikasi();
  const [kel, setKel] = useState("Semua");
  const [awal, setAwal] = useState(2);
  const [horizon, setHorizon] = useState(8);
  const [sim, setSim] = useState<ReturnType<typeof simulasiLintasan> | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const L = parameter.markov.langkah_bulan;
  const nb = data!.n_bulan;

  const est = useMemo(() => {
    const seq = hasil.filter((h) => kel === "Semua" || h.m.kelompok === kel).map((h) => h.tahap.slice(0, nb));
    const n = hitungTransisi(seq, L);
    return { n, post: estimasiPosterior(n, parameter.markov.prior_alpha, parameter.markov.n_sampel, 0) };
  }, [hasil, kel, L, parameter, nb]);

  const P6 = useMemo(() => [...est.post.P_rata, [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1]], [est]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Lintasan sebagai rantai Markov</h1>
          <p className="teks-kecil">
            Transisi diamati tiap {L} bulan. Penyerap: Muzakki dan Keluar/gagal. Estimasi Bayes Dirichlet–multinomial dengan prior pakar.
          </p>
          <CatatanKalibrasi teks="Prior pakar adalah nilai awal untuk demonstrasi, belum dikalibrasi." />
        </div>
        <select className="masukan w-auto" value={kel} onChange={(e) => setKel(e.target.value)} aria-label="Kelompok">
          <option value="Semua">Semua kelompok</option>
          {data!.kelompok.map((k) => (
            <option key={k.kode} value={k.kode}>
              {k.kode}: {k.nama}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Bagian judul="Frekuensi transisi teramati (n)">
          <MatriksTabel M={est.n} format={(v) => String(v)} />
          <p className="mt-2 text-xs text-abu">Total transisi: {est.n.flat().reduce((a, b) => a + b, 0)}. Setelah terserap, sisa lintasan diabaikan.</p>
        </Bagian>
        <Bagian judul="Peluang transisi (rata-rata posterior)">
          <MatriksTabel M={est.post.P_rata} format={(v) => angka(v, 2)} panas />
        </Bagian>
      </div>

      <Bagian judul={`Waktu rata-rata hingga terserap dan peluang penyerapan (interval kredibel ${est.post.tingkat * 100}%)`}>
        <div className="overflow-x-auto">
          <table className="tabel">
            <thead>
              <tr>
                <th>Dari tahap</th>
                <th className="text-right">t (bulan)</th>
                <th className="text-right">P(Muzakki)</th>
                <th className="text-right">P(Keluar)</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="font-semibold" style={{ color: WARNA_TAHAP[i + 1] }}>
                    {i + 1}. {NAMA_PENDEK[i + 1]}
                  </td>
                  <td className="text-right">
                    <b>{angka(est.post.t_rata[i] * L, 1)}</b>
                    <div className="text-xs text-abu">
                      [{angka(est.post.t_bawah[i] * L, 1)}; {angka(est.post.t_atas[i] * L, 1)}]
                    </div>
                  </td>
                  <td className="text-right">
                    <b>{persen(est.post.B_rata[i][0], 1)}</b>
                    <div className="text-xs text-abu">
                      [{persen(est.post.B_bawah[i][0], 1)}; {persen(est.post.B_atas[i][0], 1)}]
                    </div>
                  </td>
                  <td className="text-right">
                    <b>{persen(est.post.B_rata[i][1], 1)}</b>
                    <div className="text-xs text-abu">
                      [{persen(est.post.B_bawah[i][1], 1)}; {persen(est.post.B_atas[i][1], 1)}]
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-abu">
          M = (I − Q)⁻¹, t = M·1 (dikali {L} bulan per langkah), B = M·R. Karena data sintetis hampir tidak memuat transisi ke Muzakki, peluang Muzakki sangat
          bergantung pada prior; interval yang lebar menunjukkan ketidakpastian tersebut. Asumsi Markov orde satu dan homogen waktu perlu diuji pada data nyata.
        </p>
      </Bagian>

      <Bagian judul="Simulasi lintasan (Monte Carlo)">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="awal">
              Tahap awal
            </label>
            <select id="awal" className="masukan" value={awal} onChange={(e) => setAwal(Number(e.target.value))}>
              {[1, 2, 3, 4].map((t) => (
                <option key={t} value={t}>
                  {t}. {NAMA_PENDEK[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="hor">
              Horizon (langkah × {L} bln)
            </label>
            <input id="hor" type="number" min={1} max={40} className="masukan w-32" value={horizon} onChange={(e) => setHorizon(Math.max(1, Math.min(40, Number(e.target.value))))} />
          </div>
          <button
            className="tombol-cta"
            disabled={sibuk}
            onClick={() => {
              setSibuk(true);
              setTimeout(() => {
                setSim(simulasiLintasan(P6, awal, horizon, 2000, 42));
                setSibuk(false);
              }, 30);
            }}
          >
            <Play size={16} /> {sibuk ? "Menyimulasikan…" : "Simulasikan lintasan"}
          </button>
        </div>
        {sim && (
          <div className="mt-4">
            <GrafikArea
              data={sim.sebaran.map((r, i) => ({ b: `${i * L} bln`, ...Object.fromEntries(KEADAAN.map((k, j) => [NAMA_PENDEK[k], r[j]])) }))}
              seri={KEADAAN.map((k) => ({ kunci: NAMA_PENDEK[k], warna: WARNA_TAHAP[k] }))}
            />
            <p className="mt-2 text-sm">
              Dari 2.000 lintasan simulasi (P rata-rata posterior), setelah {horizon * L} bulan: <b>{persen(sim.proporsi_muzakki, 1)}</b> Muzakki, <b>{persen(sim.proporsi_keluar, 1)}</b>{" "}
              keluar/gagal.
              {sim.rata_waktu_terserap !== null && <> Rata-rata waktu terserap (yang terserap dalam horizon): {angka(sim.rata_waktu_terserap * L, 1)} bulan.</>}
            </p>
          </div>
        )}
      </Bagian>
    </div>
  );
}

function MatriksTabel({ M, format, panas = false }: { M: number[][]; format: (v: number) => string; panas?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="tabel text-center">
        <thead>
          <tr>
            <th>dari \ ke</th>
            {KEADAAN.map((k) => (
              <th key={k} className="text-center" style={{ color: WARNA_TAHAP[k] }}>
                {NAMA_PENDEK[k]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {M.map((r, i) => (
            <tr key={i}>
              <td className="text-left font-semibold" style={{ color: WARNA_TAHAP[i + 1] }}>
                {NAMA_PENDEK[i + 1]}
              </td>
              {r.map((v, j) => (
                <td key={j} style={panas ? { background: `rgba(91,61,245,${Math.min(0.85, v)})`, color: v > 0.45 ? "white" : undefined } : undefined}>
                  {format(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
