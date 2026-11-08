"use client";
import Link from "next/link";
import { BellRing, CalendarClock, ChevronRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { TahapBadge } from "@/components/ui";
import { useAplikasi } from "@/lib/aplikasi";
import { hariIni } from "@/lib/format";

const tambahBulan = (tgl: string, n: number) => {
  const d = new Date(tgl + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
};

function Isi() {
  const { hasil, sesi } = useAplikasi();
  const kini = hariIni();
  const item = hasil
    .filter((h) => (sesi!.wilayah === "Semua" || h.m.wilayah === sesi!.wilayah) && h.terakhir.tahap !== 6)
    .map((h) => {
      const terakhir = [...h.m.kunjungan].sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
      const interval = h.m.kelompok === "A" ? 6 : 1;
      const jatuh = terakhir?.jadwal_berikut || (terakhir ? tambahBulan(terakhir.tanggal, interval) : kini);
      const mendesak = h.cusum.aktif_sekarang;
      return { h, terakhir: terakhir?.tanggal ?? "–", jatuh: mendesak && jatuh > kini ? kini : jatuh, mendesak };
    })
    .sort((a, b) => a.jatuh.localeCompare(b.jatuh));
  const lewat = item.filter((x) => x.jatuh <= kini);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Jadwal dan pengingat</h1>
        <p className="teks-kecil">
          {lewat.length} kunjungan jatuh tempo per {kini}. Interval bawaan: bulanan (kelompok B, C), 6 bulanan (A). Peringatan CUSUM aktif dijadwalkan segera.
        </p>
      </div>
      <ul className="kartu divide-y divide-garis overflow-hidden">
        {item.slice(0, 60).map(({ h, terakhir, jatuh, mendesak }) => (
          <li key={h.m.id}>
            <Link href={`/pendamping/detail/?id=${h.m.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ungu-50/50">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${mendesak ? "bg-red-50 text-t1" : jatuh <= kini ? "bg-amber-50 text-amber-600" : "bg-ungu-50 text-ungu-600"}`}>
                {mendesak ? <BellRing size={18} /> : <CalendarClock size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{h.m.alias}</div>
                <div className="text-xs text-abu">
                  Terakhir {terakhir} · Jatuh tempo <b className={jatuh <= kini ? "text-t1" : "text-tinta"}>{jatuh}</b>
                  {mendesak && " · peringatan dini"}
                </div>
              </div>
              <TahapBadge tahap={h.terakhir.tahap} />
              <ChevronRight size={18} className="text-abu" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Halaman() {
  return (
    <Shell peran="pendamping">
      <Isi />
    </Shell>
  );
}
