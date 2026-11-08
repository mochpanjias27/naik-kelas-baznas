"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, Save } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Bagian, CatatanKalibrasi, NAMA_PENDEK } from "@/components/ui";
import { useAplikasi } from "@/lib/aplikasi";
import { bobotAhp, bobotEntropi, bobotManual, cekAmbang, nisabRupiah, type Parameter } from "@/lib/engine";
import { angka, rupiah } from "@/lib/format";

const SKALA_SAATY = [1 / 9, 1 / 7, 1 / 5, 1 / 3, 1, 3, 5, 7, 9];
const labelSaaty = (v: number) => (v >= 1 ? String(Math.round(v)) : `1/${Math.round(1 / v)}`);
const dekatSaaty = (v: number) => SKALA_SAATY.reduce((a, b) => (Math.abs(Math.log(b / v)) < Math.abs(Math.log(a / v)) ? b : a));

function Angka({ label, nilai, ubah, step = 0.01, min, bantu }: { label: string; nilai: number; ubah: (v: number) => void; step?: number; min?: number; bantu?: string }) {
  return (
    <div>
      <label className="label text-xs">{label}</label>
      <input type="number" className="masukan py-2" value={Number.isFinite(nilai) ? nilai : ""} step={step} min={min} onChange={(e) => ubah(Number(e.target.value))} />
      {bantu && <p className="mt-1 text-[11px] text-abu">{bantu}</p>}
    </div>
  );
}

function validasi(p: Parameter): string[] {
  const g: string[] = [];
  try {
    cekAmbang(p.ambang);
  } catch (e) {
    g.push((e as Error).message);
  }
  p.indikator.forEach((i) => i.u <= i.l && g.push(`Indikator "${i.nama}": u harus > l.`));
  if (p.bobot.some((w) => !(w >= 0)) || p.bobot.reduce((a, b) => a + b, 0) <= 0) g.push("Bobot harus ≥ 0 dan jumlahnya positif.");
  if (!Number.isFinite(p.rho)) g.push("ρ harus berupa angka.");
  if (!(p.had_kifayah_rt_bulanan > 0)) g.push("Had kifayah harus positif.");
  if (!(p.nisab_gram > 0) || !(p.harga_emas_per_gram > 0)) g.push("Nisab dan harga emas harus positif.");
  if (!(p.cusum.h > 0) || p.cusum.kappa < 0) g.push("CUSUM: h > 0 dan κ ≥ 0.");
  if (p.markov.prior_alpha.flat().some((a) => !(a > 0))) g.push("Prior Dirichlet harus positif.");
  if (!(p.markov.langkah_bulan >= 1)) g.push("Langkah Markov minimal 1 bulan.");
  return g;
}

function Isi() {
  const { parameter, simpanParameter, resetParameter, riwayatParameter, hasil } = useAplikasi();
  const [d, setD] = useState<Parameter>(() => structuredClone(parameter));
  const [ket, setKet] = useState("");
  const [pesan, setPesan] = useState("");
  const ubah = (f: (p: Parameter) => void) =>
    setD((x) => {
      const y = structuredClone(x);
      f(y);
      return y;
    });
  const galat = validasi(d);
  const wNorm = useMemo(() => {
    try {
      return bobotManual(d.bobot);
    } catch {
      return d.bobot.map(() => NaN);
    }
  }, [d.bobot]);
  const ahp = useMemo(() => {
    try {
      return bobotAhp(d.ahp_matriks);
    } catch {
      return null;
    }
  }, [d.ahp_matriks]);
  const entropi = useMemo(() => {
    const S = hasil.filter((h) => h.terakhir.s).map((h) => h.terakhir.s!);
    return S.length > 1 ? bobotEntropi(S) : null;
  }, [hasil]);
  const K = d.indikator.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Pengaturan parameter model</h1>
          <p className="teks-kecil">
            Versi aktif: <b className="text-tinta">{parameter.versi}</b>. Menyimpan membuat versi baru; setiap skor mencatat versi yang dipakai.
          </p>
          <CatatanKalibrasi />
        </div>
        <button className="tombol-garis" onClick={() => { resetParameter(); setD(structuredClone(riwayatParameter[0].parameter)); setPesan("Parameter dikembalikan ke nilai bawaan (versi baru)."); }}>
          <RotateCcw size={16} /> Nilai bawaan
        </button>
      </div>

      <Bagian judul="Indikator dan normalisasi">
        <div className="overflow-x-auto">
          <table className="tabel">
            <thead>
              <tr>
                <th>Indikator</th>
                <th>Satuan</th>
                <th>l (bawah)</th>
                <th>u (atas)</th>
              </tr>
            </thead>
            <tbody>
              {d.indikator.map((ind, k) => (
                <tr key={ind.kode}>
                  <td className="font-semibold">{ind.nama}</td>
                  <td className="text-xs text-abu">{ind.satuan}</td>
                  <td>
                    <input type="number" step={0.05} className="masukan w-24 py-1.5" value={ind.l} onChange={(e) => ubah((p) => (p.indikator[k].l = Number(e.target.value)))} />
                  </td>
                  <td>
                    <input type="number" step={0.05} className="masukan w-24 py-1.5" value={ind.u} onChange={(e) => ubah((p) => (p.indikator[k].u = Number(e.target.value)))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-abu">sₖ = min{"{"}1, max{"{"}0, (xₖ − lₖ)/(uₖ − lₖ){"}"}{"}"}</p>
      </Bagian>

      <Bagian judul="Pembobotan indikator">
        <div className="mb-4 flex flex-wrap gap-2">
          {(["manual", "ahp", "entropi"] as const).map((m) => (
            <button key={m} onClick={() => ubah((p) => (p.metode_bobot = m))} className={`rounded-full px-4 py-2 text-sm font-semibold ${d.metode_bobot === m ? "bg-ungu-600 text-white" : "bg-white text-abu ring-1 ring-garis"}`}>
              {m === "manual" ? "Input manual" : m === "ahp" ? "AHP" : "Entropi"}
            </button>
          ))}
        </div>

        {d.metode_bobot === "manual" && (
          <div className="grid gap-3 sm:grid-cols-5">
            {d.indikator.map((ind, k) => (
              <Angka key={ind.kode} label={ind.nama} nilai={d.bobot[k]} ubah={(v) => ubah((p) => (p.bobot[k] = v))} bantu={`dinormalkan: ${angka(wNorm[k], 3)}`} />
            ))}
          </div>
        )}

        {d.metode_bobot === "ahp" && (
          <div>
            <p className="mb-2 text-sm text-abu">Isi segitiga atas (skala Saaty 1/9–9: seberapa penting baris dibanding kolom). Segitiga bawah otomatis resiprokal.</p>
            <div className="overflow-x-auto">
              <table className="tabel text-center">
                <thead>
                  <tr>
                    <th></th>
                    {d.indikator.map((i) => (
                      <th key={i.kode} className="text-center">{i.kode}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.indikator.map((ri, i) => (
                    <tr key={ri.kode}>
                      <td className="text-left font-semibold">{ri.kode}</td>
                      {d.indikator.map((_, j) => (
                        <td key={j}>
                          {i === j ? (
                            "1"
                          ) : i < j ? (
                            <select
                              className="rounded-lg border border-garis px-1 py-1 text-sm"
                              value={dekatSaaty(d.ahp_matriks[i][j])}
                              onChange={(e) =>
                                ubah((p) => {
                                  const v = Number(e.target.value);
                                  p.ahp_matriks[i][j] = v;
                                  p.ahp_matriks[j][i] = 1 / v;
                                })
                              }
                            >
                              {SKALA_SAATY.map((v) => (
                                <option key={v} value={v}>
                                  {labelSaaty(v)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-abu">{labelSaaty(d.ahp_matriks[i][j])}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ahp && (
              <div className={`mt-3 flex flex-wrap items-center gap-3 rounded-xl p-3 text-sm ${ahp.konsisten ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>
                {ahp.konsisten ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>
                  λ<sub>max</sub> = {angka(ahp.lambda_max, 3)} · CR = <b>{angka(ahp.CR, 3)}</b> {ahp.konsisten ? "(konsisten, ≤ 0,1)" : "(TIDAK konsisten, > 0,1: tinjau ulang perbandingan)"}
                </span>
                <span>Bobot: {ahp.bobot.map((w) => angka(w, 3)).join(" · ")}</span>
                <button className="tombol-garis px-3 py-1.5 text-sm" onClick={() => ubah((p) => (p.bobot = ahp.bobot.map((w) => +w.toFixed(6))))}>
                  Gunakan bobot AHP
                </button>
              </div>
            )}
          </div>
        )}

        {d.metode_bobot === "entropi" && entropi && (
          <div>
            <p className="text-sm text-abu">Bobot entropi Shannon dari sebaran sₖ seluruh usaha aktif pada bulan terakhir (data sintetis). Indikator yang lebih bervariasi mendapat bobot lebih besar.</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {d.indikator.map((ind, k) => (
                <span key={ind.kode} className="rounded-full bg-ungu-50 px-3 py-1.5">
                  {ind.kode}: <b>{angka(entropi[k], 3)}</b>
                </span>
              ))}
            </div>
            <button className="tombol-garis mt-3 px-3 py-1.5 text-sm" onClick={() => ubah((p) => (p.bobot = entropi.map((w) => +w.toFixed(6))))}>
              Gunakan bobot entropi
            </button>
          </div>
        )}
        <p className="mt-3 text-sm">
          Bobot yang akan disimpan: <b>{wNorm.map((w) => angka(w, 3)).join(" · ")}</b>
        </p>
      </Bagian>

      <Bagian judul="Agregasi CES dan ambang tahap">
        <div className="grid gap-3 sm:grid-cols-5">
          <Angka label="ρ (substitusi)" nilai={d.rho} step={0.1} ubah={(v) => ubah((p) => (p.rho = v))} bantu="1 = rata-rata; 0 = geometrik; negatif = mendekati minimum" />
          {d.ambang.map((a, i) => (
            <Angka key={i} label={`τ${i + 1}: masuk ${NAMA_PENDEK[i + 2]}`} nilai={a} step={0.01} ubah={(v) => ubah((p) => (p.ambang[i] = v))} />
          ))}
        </div>
      </Bagian>

      <Bagian judul="Had kifayah, nisab, dan aturan bantuan">
        <div className="grid gap-3 sm:grid-cols-3">
          <Angka label="Had kifayah rumah tangga per bulan (Rp)" nilai={d.had_kifayah_rt_bulanan} step={50000} ubah={(v) => ubah((p) => (p.had_kifayah_rt_bulanan = v))} />
          <Angka label="Berat nisab (gram emas)" nilai={d.nisab_gram} step={1} ubah={(v) => ubah((p) => (p.nisab_gram = v))} />
          <Angka label="Harga emas per gram (Rp)" nilai={d.harga_emas_per_gram} step={10000} ubah={(v) => ubah((p) => (p.harga_emas_per_gram = v))} />
          <Angka label="Ambang bulan aktif (kelangsungan)" nilai={d.ambang_bulan_aktif} step={1} ubah={(v) => ubah((p) => (p.ambang_bulan_aktif = v))} />
          <Angka label="Jendela rata-rata (bulan)" nilai={d.jendela_rata_bulan} step={1} ubah={(v) => ubah((p) => (p.jendela_rata_bulan = Math.max(1, Math.round(v))))} />
          <Angka label="Lama penurunan bantuan bertahap (bulan)" nilai={d.bulan_penurunan_bertahap} step={1} ubah={(v) => ubah((p) => (p.bulan_penurunan_bertahap = Math.max(1, Math.round(v))))} />
        </div>
        <p className="mt-2 text-sm">
          Nisab = {d.nisab_gram} g × {rupiah(d.harga_emas_per_gram)} = <b>{(() => { try { return rupiah(nisabRupiah(d.nisab_gram, d.harga_emas_per_gram)); } catch { return "–"; } })()}</b>
        </p>
        <p className="mt-1 text-xs font-medium text-amber-700">Dasar nisab dan haul perlu dikonfirmasi pada rujukan fikih. Harga emas dan had kifayah adalah penanda tempat.</p>
      </Bagian>

      <div className="grid gap-5 lg:grid-cols-2">
        <Bagian judul="Peringatan dini CUSUM">
          <div className="grid grid-cols-2 gap-3">
            <Angka label="μ₀ (acuan, relatif basis)" nilai={d.cusum.mu0} step={0.05} ubah={(v) => ubah((p) => (p.cusum.mu0 = v))} />
            <Angka label="κ (kelonggaran)" nilai={d.cusum.kappa} step={0.05} ubah={(v) => ubah((p) => (p.cusum.kappa = v))} />
            <Angka label="h (ambang peringatan)" nilai={d.cusum.h} step={0.1} ubah={(v) => ubah((p) => (p.cusum.h = v))} />
            <Angka label="Bulan basis" nilai={d.cusum.basis_bulan} step={1} ubah={(v) => ubah((p) => (p.cusum.basis_bulan = Math.max(1, Math.round(v))))} />
          </div>
        </Bagian>
        <Bagian judul="Sensitivitas dan asesmen">
          <div className="grid grid-cols-2 gap-3">
            <Angka label="Sampel sensitivitas" nilai={d.sensitivitas.n_sampel} step={100} ubah={(v) => ubah((p) => (p.sensitivitas.n_sampel = Math.max(10, Math.round(v))))} />
            <Angka label="Konsentrasi Dirichlet c" nilai={d.sensitivitas.konsentrasi} step={1} ubah={(v) => ubah((p) => (p.sensitivitas.konsentrasi = v))} />
            <Angka label="Ambang produktif asesmen (0–100)" nilai={d.asesmen.ambang_produktif} step={1} ubah={(v) => ubah((p) => (p.asesmen.ambang_produktif = v))} />
          </div>
        </Bagian>
      </div>

      <Bagian judul="Rantai Markov: prior pakar Dirichlet (α)">
        <div className="mb-3 grid max-w-md grid-cols-2 gap-3">
          <Angka label="Langkah transisi (bulan)" nilai={d.markov.langkah_bulan} step={1} ubah={(v) => ubah((p) => (p.markov.langkah_bulan = Math.max(1, Math.round(v))))} />
          <Angka label="Sampel posterior" nilai={d.markov.n_sampel} step={100} ubah={(v) => ubah((p) => (p.markov.n_sampel = Math.max(10, Math.round(v))))} />
        </div>
        <div className="overflow-x-auto">
          <table className="tabel text-center">
            <thead>
              <tr>
                <th>dari \ ke</th>
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <th key={k} className="text-center">{NAMA_PENDEK[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.markov.prior_alpha.map((r, i) => (
                <tr key={i}>
                  <td className="text-left font-semibold">{NAMA_PENDEK[i + 1]}</td>
                  {r.map((v, j) => (
                    <td key={j}>
                      <input type="number" step={0.1} min={0.01} className="w-16 rounded-lg border border-garis px-1.5 py-1 text-sm" value={v} onChange={(e) => ubah((p) => (p.markov.prior_alpha[i][j] = Number(e.target.value)))} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-abu">Jumlah α per baris ≈ kekuatan keyakinan pakar dalam satuan &quot;transisi semu&quot;.</p>
      </Bagian>

      <div className="kartu sticky bottom-20 z-20 p-4 sm:bottom-4">
        {galat.length > 0 && (
          <ul className="mb-3 list-disc rounded-xl bg-red-50 py-2 pl-8 pr-3 text-sm text-red-800">
            {galat.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        )}
        {pesan && <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{pesan}</p>}
        <div className="flex flex-wrap gap-2">
          <input className="masukan flex-1" placeholder="Catatan perubahan (mis. ambang hasil FGD pakar)" value={ket} onChange={(e) => setKet(e.target.value)} />
          <button
            className="tombol-cta"
            disabled={galat.length > 0}
            onClick={() => {
              simpanParameter({ ...d, bobot: wNorm, status: "Nilai awal untuk demonstrasi, belum dikalibrasi" }, ket || "Perubahan parameter");
              setPesan(`Tersimpan sebagai versi baru lokal-${riwayatParameter.length + 1}. Semua skor dihitung ulang.`);
              setKet("");
            }}
          >
            <Save size={16} /> Simpan versi baru
          </button>
        </div>
      </div>

      <Bagian judul="Riwayat versi parameter">
        <ul className="divide-y divide-garis text-sm">
          {[...riwayatParameter].reverse().map((r) => (
            <li key={r.versi + r.waktu} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                <b>{r.versi}</b> · {r.catatan}
              </span>
              <span className="text-xs text-abu">{r.waktu === "bawaan" ? "bawaan" : new Date(r.waktu).toLocaleString("id-ID")}</span>
            </li>
          ))}
        </ul>
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
