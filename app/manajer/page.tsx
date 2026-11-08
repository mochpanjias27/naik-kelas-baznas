"use client";
import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, PauseCircle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Bagian, NAMA_PENDEK, PernyataanAmil, Stat, TahapBadge, WARNA_TAHAP } from "@/components/ui";
import { GrafikGaris, GrafikSebaranTahap } from "@/components/grafik";
import { useAplikasi } from "@/lib/aplikasi";
import { angka, labelBulan, persen } from "@/lib/format";

const WARNA_KEL: Record<string, string> = { A: "#94a3b8", B: "#6c4cf6", C: "#ff5a36" };

function Isi() {
  const { hasil, bulan, data } = useAplikasi();
  const nb = data!.n_bulan; // perbandingan memakai 24 bulan data sintetis (tanpa proyeksi)

  const sebaran = useMemo(
    () =>
      Array.from({ length: nb }, (_, t) => {
        const baris: { b: string; [k: string]: number | string } = { b: labelBulan(bulan[t]) };
        [1, 2, 3, 4, 5, 6].forEach((th) => (baris[NAMA_PENDEK[th]] = hasil.filter((h) => h.tahap[t] === th).length));
        return baris;
      }),
    [hasil, bulan, nb],
  );

  const perKelompok = useMemo(() => {
    const kel = data!.kelompok;
    const garis = Array.from({ length: nb }, (_, t) => {
      const r: Record<string, number | string | null> = { b: labelBulan(bulan[t]) };
      kel.forEach((k) => {
        const g = hasil.filter((h) => h.m.kelompok === k.kode && h.skor[t].G !== null).map((h) => h.skor[t].G!);
        r[k.kode] = g.length ? g.reduce((a, b) => a + b, 0) / g.length : null;
      });
      return r;
    });
    const tabel = kel.map((k) => {
      const anggota = hasil.filter((h) => h.m.kelompok === k.kode);
      const akhir = anggota.map((h) => h.tahap[nb - 1]);
      const naik = anggota.filter((h) => h.tahap[nb - 1] !== 6 && h.tahap[nb - 1] > h.tahap[0]).length;
      const dG = anggota.filter((h) => h.skor[nb - 1].G !== null && h.skor[0].G !== null).map((h) => h.skor[nb - 1].G! - h.skor[0].G!);
      return {
        k,
        n: anggota.length,
        bertahanPlus: akhir.filter((t) => t >= 3 && t <= 5).length / anggota.length,
        keluar: akhir.filter((t) => t === 6).length / anggota.length,
        naik: naik / anggota.length,
        dG: dG.reduce((a, b) => a + b, 0) / Math.max(1, dG.length),
      };
    });
    return { garis, tabel };
  }, [hasil, bulan, data, nb]);

  const aktif = hasil.filter((h) => h.terakhir.tahap !== 6);
  const risiko = hasil.filter((h) => h.berisiko);
  const stagnan = hasil.filter((h) => h.stagnan);
  const rataG = aktif.reduce((a, h) => a + (h.terakhir.G ?? 0), 0) / Math.max(1, aktif.length);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Dasbor program</h1>
        <p className="teks-kecil">Ringkasan agregat seluruh mustahik (data sintetis). Data bulanan: {labelBulan(bulan[0])}–{labelBulan(bulan[nb - 1])}; kartu ringkas memakai bulan terakhir tiap mustahik (termasuk proyeksi bulan berjalan bila ada catatan baru).</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat nilai={aktif.length} label="Usaha aktif" sub={`dari ${hasil.length} mustahik`} />
        <Stat nilai={angka(rataG)} label="Rata-rata indeks G" sub="usaha aktif" warna="#5b3df5" />
        <Stat nilai={risiko.length} label="Berisiko" sub="CUSUM / G turun / tahap turun" warna="var(--color-t1)" />
        <Stat nilai={stagnan.length} label="Stagnan" sub="tahap tetap ±9 bulan" warna="var(--color-t2)" />
        <Stat nilai={hasil.filter((h) => h.terakhir.tahap === 6).length} label="Keluar/gagal" warna="var(--color-t6)" />
      </div>

      <div className="grid gap-3 sm:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((t) => {
          const n = hasil.filter((h) => h.terakhir.tahap === t).length;
          return (
            <div key={t} className="kartu p-3">
              <TahapBadge tahap={t} />
              <div className="mt-2 text-2xl font-extrabold" style={{ color: WARNA_TAHAP[t] }}>
                {n}
              </div>
              <div className="text-xs text-abu">{persen(n / hasil.length)} dari total</div>
            </div>
          );
        })}
      </div>

      <Bagian judul="Sebaran tahap per bulan">
        <GrafikSebaranTahap seri={sebaran} />
      </Bagian>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Bagian judul="Perbandingan kelompok intervensi: rata-rata G">
          <GrafikGaris data={perKelompok.garis} seri={data!.kelompok.map((k) => ({ kunci: k.kode, warna: WARNA_KEL[k.kode] ?? "#333", nama: `${k.kode}: ${k.nama}` }))} domain={[0.2, 0.7]} />
        </Bagian>
        <Bagian judul="Ringkasan bulan ke-24 per kelompok">
          <div className="overflow-x-auto">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Kel.</th>
                  <th className="text-right">n</th>
                  <th className="text-right">Tahap ≥3</th>
                  <th className="text-right">Naik tahap</th>
                  <th className="text-right">Keluar</th>
                  <th className="text-right">ΔG</th>
                </tr>
              </thead>
              <tbody>
                {perKelompok.tabel.map((r) => (
                  <tr key={r.k.kode}>
                    <td>
                      <b>{r.k.kode}</b> <span className="text-xs text-abu">{r.k.nama}</span>
                    </td>
                    <td className="text-right">{r.n}</td>
                    <td className="text-right">{persen(r.bertahanPlus)}</td>
                    <td className="text-right">{persen(r.naik)}</td>
                    <td className="text-right">{persen(r.keluar)}</td>
                    <td className="text-right">{angka(r.dG, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-abu">
            Perbandingan deskriptif pada data sintetis; efek kelompok adalah asumsi generator, bukan temuan. Untuk inferensi kausal diperlukan desain evaluasi
            dan data nyata.
          </p>
        </Bagian>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Bagian judul={<span className="flex items-center gap-2"><AlertTriangle size={18} className="text-t1" /> Mustahik berisiko ({risiko.length})</span>}>
          <ul className="divide-y divide-garis text-sm">
            {risiko.slice(0, 12).map((h) => (
              <li key={h.m.id} className="py-2">
                <Link href={`/pendamping/detail/?id=${h.m.id}`} className="flex items-center justify-between gap-2 hover:text-ungu-700">
                  <span>
                    <b>{h.m.alias}</b> <span className="text-xs text-abu">· Kel. {h.m.kelompok}</span>
                    <div className="text-xs text-abu">{h.alasanRisiko.join(" ")}</div>
                  </span>
                  <TahapBadge tahap={h.terakhir.tahap} />
                </Link>
              </li>
            ))}
            {risiko.length === 0 && <li className="py-2 text-abu">Tidak ada.</li>}
          </ul>
        </Bagian>
        <Bagian judul={<span className="flex items-center gap-2"><PauseCircle size={18} className="text-t2" /> Mustahik stagnan ({stagnan.length})</span>}>
          <ul className="divide-y divide-garis text-sm">
            {stagnan.slice(0, 12).map((h) => (
              <li key={h.m.id} className="py-2">
                <Link href={`/pendamping/detail/?id=${h.m.id}`} className="flex items-center justify-between gap-2 hover:text-ungu-700">
                  <span>
                    <b>{h.m.alias}</b> <span className="text-xs text-abu">· Kel. {h.m.kelompok} · G {angka(h.terakhir.G)}</span>
                  </span>
                  <TahapBadge tahap={h.terakhir.tahap} />
                </Link>
              </li>
            ))}
            {stagnan.length === 0 && <li className="py-2 text-abu">Tidak ada.</li>}
          </ul>
        </Bagian>
      </div>
      <PernyataanAmil />
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
