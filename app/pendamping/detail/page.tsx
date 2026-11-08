"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, ArrowLeft, BellRing, CheckCircle2, ClipboardCheck, Flag, HandCoins, HeartHandshake, Circle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Bagian, CatatanKalibrasi, Memuat, PernyataanAmil, TahapBadge, TahapIkon, WARNA_TAHAP } from "@/components/ui";
import { GrafikCusum, GrafikG, KontribusiIndikator } from "@/components/grafik";
import { useAplikasi } from "@/lib/aplikasi";
import { NAMA_TAHAP, estimasiZakat, nisabRupiah, nilaiAsesmen } from "@/lib/engine";
import { angka, labelBulan, rupiah } from "@/lib/format";
import { rekomendasiTindakan } from "@/lib/teks";

function Isi() {
  const id = useSearchParams().get("id") ?? "";
  const { peta, parameter, bulan, data, asesmen, sesi } = useAplikasi();
  const a = peta.get(id);
  if (!data) return <Memuat />;
  if (!a) return <p className="kartu p-6">Mustahik dengan kode &quot;{id}&quot; tidak ditemukan.</p>;
  const t = a.terakhir;
  const n = a.skor.length;
  const b = a.m.bulanan;
  const N = nisabRupiah(parameter.nisab_gram, parameter.harga_emas_per_gram);
  const zakat = estimasiZakat(b.kekayaan[n - 1], N, parameter.tarif_zakat);
  const rek = rekomendasiTindakan(a, parameter);
  const asAwal = nilaiAsesmen(a.m.asesmen_awal, parameter.asesmen);
  const asLokal = asesmen.filter((x) => x.mustahik_id === id).sort((x, y) => y.dibuat.localeCompare(x.dibuat));
  const kunj = [...a.m.kunjungan].sort((x, y) => y.tanggal.localeCompare(x.tanggal));
  const kel = data.kelompok.find((k) => k.kode === a.m.kelompok);
  const bolehAksi = sesi?.peran === "pendamping";

  return (
    <div className="space-y-4">
      <Link href="/pendamping/" className="inline-flex items-center gap-1 text-sm font-semibold text-abu hover:text-ungu-700">
        <ArrowLeft size={16} /> Daftar mustahik
      </Link>

      <div className="kartu p-5">
        <div className="flex items-center gap-4">
          <TahapIkon tahap={t.tahap} ukuran={56} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">{a.m.alias}</h1>
            <div className="text-sm text-abu">
              {a.m.id} · {a.m.sektor} · {a.m.wilayah}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <TahapBadge tahap={t.tahap} />
              {a.berisiko && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-t1">
                  <AlertTriangle size={12} /> Berisiko
                </span>
              )}
              {a.stagnan && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Stagnan</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-abu">Indeks G</div>
            <div className="text-3xl font-extrabold" style={{ color: WARNA_TAHAP[t.tahap] }}>
              {angka(t.G)}
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-abu">{t.alasan}</p>
        <div className="mt-3 rounded-xl bg-ungu-50 px-3 py-2 text-sm">
          Status bantuan: <b>{a.statusBantuan}</b>
        </div>
        {a.proyeksi && <p className="mt-2 text-xs text-abu">Bulan terakhir adalah proyeksi dari {a.proyeksi.hari} hari catatan mustahik.</p>}
        {bolehAksi && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href={`/pendamping/kunjungan/?id=${id}`} className="tombol-utama">
              <HeartHandshake size={17} /> Kunjungan
            </Link>
            <Link href={`/pendamping/asesmen/?id=${id}`} className="tombol-garis">
              <ClipboardCheck size={17} /> Asesmen
            </Link>
          </div>
        )}
      </div>

      <Bagian judul="Rekomendasi tindakan">
        <ul className="space-y-2">
          {rek.map((r, i) => (
            <li key={i} className={`rounded-xl border p-3 text-sm ${r.mendesak ? "border-red-200 bg-red-50" : "border-garis"}`}>
              <div className="font-semibold">{r.teks}</div>
              <div className="mt-0.5 text-xs text-abu">Dasar: {r.dasar}</div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-abu">Aturan sederhana dan terbuka, bukan prediksi. Pendamping dapat mengabaikannya.</p>
      </Bagian>

      <Bagian judul="Lintasan indeks graduasi">
        <GrafikG skor={a.skor} bulan={bulan} ambang={parameter.ambang} />
        <div className="mt-2 flex flex-wrap gap-1">
          {a.tahap.map((th, i) => (
            <span key={i} title={`${labelBulan(bulan[i])}: ${NAMA_TAHAP[th]}`} className="h-2.5 flex-1 rounded-sm" style={{ background: WARNA_TAHAP[th], minWidth: 6 }} />
          ))}
        </div>
        <p className="mt-1 text-xs text-abu">Pita warna = tahap per bulan. Garis putus = ambang τ.</p>
      </Bagian>

      <Bagian judul="Penjelasan skor bulan terakhir" aksi={<CatatanKalibrasi teks="Parameter belum dikalibrasi" />}>
        <KontribusiIndikator skor={t} parameter={parameter} />
      </Bagian>

      <Bagian judul={<span className="flex items-center gap-2"><BellRing size={18} className="text-t1" /> Peringatan dini (CUSUM)</span>}>
        <GrafikCusum S={a.cusum.S} h={parameter.cusum.h} bulan={bulan} />
        <p className={`mt-2 rounded-xl px-3 py-2 text-sm ${a.cusum.aktif_sekarang ? "bg-red-50 text-red-800" : "bg-latar text-abu"}`}>{a.cusum.alasan}</p>
        {a.alasanRisiko.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm">
            {a.alasanRisiko.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-abu">
          y = laba bulanan ÷ rata-rata laba {parameter.cusum.basis_bulan} bulan pertama; μ₀={parameter.cusum.mu0}, κ={parameter.cusum.kappa}, h={parameter.cusum.h}. Tidak ada klaim
          akurasi.
        </p>
      </Bagian>

      <Bagian judul="Profil dan baseline">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {[
            ["Kelompok intervensi", `${a.m.kelompok}: ${kel?.nama}`],
            ["Anggota rumah tangga", `${a.m.anggota_rt} orang`],
            ["Lama usaha saat awal", `${a.m.bulan_usaha_awal} bulan`],
            ["Pendamping", a.m.pendamping],
            ["Omzet bulan pertama", rupiah(b.omzet[0])],
            ["Laba bulan pertama", rupiah(b.omzet[0] - b.biaya[0])],
            ["Kekayaan bersih awal", rupiah(b.kekayaan[0])],
            ["Asesmen awal", `${angka(asAwal.skor, 0)} → ${asAwal.rekomendasi}`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-abu">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-abu">Variabel diselaraskan dengan skema DTSEN/SiMBA (kompatibel skema, bukan klaim integrasi). Tanpa data identitas asli.</p>
        {asLokal.length > 0 && (
          <div className="mt-3 rounded-xl bg-latar p-3 text-sm">
            Asesmen terbaru ({asLokal[0].dibuat.slice(0, 10)}): skor {angka(asLokal[0].skor, 0)} → {asLokal[0].rekomendasi}; keputusan amil: <b>{asLokal[0].keputusan_amil}</b>
          </div>
        )}
      </Bagian>

      <Bagian judul="Buku usaha (6 bulan terakhir)">
        <div className="overflow-x-auto">
          <table className="tabel">
            <thead>
              <tr>
                <th>Bulan</th>
                <th className="text-right">Omzet</th>
                <th className="text-right">Laba</th>
                <th className="text-right">Tabungan</th>
                <th className="text-right">Peng. RT</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.min(6, n) }, (_, j) => n - 1 - j).map((i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap">
                    {labelBulan(bulan[i])}
                    {a.proyeksi && i === n - 1 ? "*" : ""}
                  </td>
                  <td className="text-right">{rupiah(b.omzet[i])}</td>
                  <td className="text-right">{rupiah(b.omzet[i] - b.biaya[i])}</td>
                  <td className="text-right">{rupiah(b.tabungan[i])}</td>
                  <td className="text-right">{rupiah(b.pengeluaran[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bagian>

      <Bagian judul={<span className="flex items-center gap-2"><Flag size={18} /> Milestone usaha</span>}>
        <ul className="space-y-2">
          {a.m.milestone.map((ms) => (
            <li key={ms.teks} className="flex items-start gap-2 text-sm">
              {ms.bulan_tercapai !== null ? <CheckCircle2 size={18} className="shrink-0 text-t4" /> : <Circle size={18} className="shrink-0 text-abu" />}
              <span>
                {ms.teks}
                {ms.bulan_tercapai !== null && <span className="text-xs text-abu"> · tercapai {labelBulan(bulan[ms.bulan_tercapai])}</span>}
              </span>
            </li>
          ))}
          {a.m.kunjungan
            .filter((k) => k.milestone)
            .map((k) => (
              <li key={k.tanggal + k.milestone} className="flex items-start gap-2 text-sm">
                <CheckCircle2 size={18} className="shrink-0 text-ungu-600" />
                <span>
                  {k.milestone} <span className="text-xs text-abu">· dicatat {k.tanggal}</span>
                </span>
              </li>
            ))}
        </ul>
      </Bagian>

      <Bagian judul="Riwayat kunjungan">
        <ul className="divide-y divide-garis text-sm">
          {kunj.slice(0, 8).map((k, i) => (
            <li key={i} className="py-2.5">
              <div className="flex justify-between">
                <b>{k.tanggal}</b>
                {k.lokal && <span className="text-xs font-semibold text-ungu-600">baru (perangkat)</span>}
              </div>
              <div className="text-xs text-abu">
                Periksa: {data.ceklis.filter((_, j) => k.ceklis[j]).join(", ") || "–"}
                {k.hambatan.length > 0 && ` · Hambatan: ${k.hambatan.join(", ")}`}
              </div>
              {k.catatan && <div className="mt-0.5 text-xs">{k.catatan}</div>}
            </li>
          ))}
          {kunj.length === 0 && <li className="py-2 text-abu">Belum ada kunjungan.</li>}
        </ul>
      </Bagian>

      <Bagian judul={<span className="flex items-center gap-2"><HandCoins size={18} /> Nisab dan zakat (informasi)</span>}>
        <div className="text-sm">
          Kekayaan bersih: <b>{rupiah(b.kekayaan[n - 1])}</b> · Nisab ({parameter.nisab_gram} g × {rupiah(parameter.harga_emas_per_gram)}/g): <b>{rupiah(N)}</b>
        </div>
        <div className="mt-1 text-sm">
          {zakat.mencapai_nisab ? (
            <>
              Estimasi zakat ({parameter.tarif_zakat * 100}%): <b>{rupiah(zakat.estimasi)}</b>
            </>
          ) : (
            <>Belum mencapai nisab ({angka((b.kekayaan[n - 1] / N) * 100, 1)}% dari nisab).</>
          )}
        </div>
        <p className="mt-2 text-xs font-medium text-amber-700">{zakat.catatan} Harga emas adalah penanda tempat.</p>
      </Bagian>
      <PernyataanAmil />
    </div>
  );
}

export default function Halaman() {
  return (
    <Shell peran={["pendamping", "manajer"]}>
      <Suspense fallback={<Memuat />}>
        <Isi />
      </Suspense>
    </Shell>
  );
}
