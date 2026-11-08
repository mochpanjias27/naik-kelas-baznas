"use client";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, CloudUpload, Clock, NotebookPen, Sparkles } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Bagian, Memuat, PernyataanAmil, TahapIkon, WARNA_TAHAP } from "@/components/ui";
import { useAplikasi } from "@/lib/aplikasi";
import { NAMA_TAHAP } from "@/lib/engine";
import { labelBulan, rupiah, rupiahRingkas } from "@/lib/format";
import { SARAN_MUSTAHIK } from "@/lib/teks";

function Isi() {
  const { sesi, peta, parameter, bulan, catatan, sinkron, daring } = useAplikasi();
  const [pesan, setPesan] = useState("");
  const a = peta.get(sesi!.mustahik_id!);
  if (!a) return <Memuat />;
  const t = a.terakhir;
  const n = a.skor.length;
  const b = a.m.bulanan;
  const amb = parameter.ambang;
  const berikut = t.tahap < 5 ? amb[t.tahap - 1] : null;
  const sebelum = t.tahap > 1 && t.tahap <= 5 ? amb[t.tahap - 2] : 0;
  const kemajuan = t.G !== null && berikut ? Math.min(1, Math.max(0, (t.G - sebelum) / (berikut - sebelum))) : 1;
  const milik = catatan.filter((c) => c.mustahik_id === a.m.id).sort((x, y) => y.dibuat.localeCompare(x.dibuat));
  const belum = milik.filter((c) => !c.tersinkron).length;
  const tiga = [n - 3, n - 2, n - 1].filter((i) => i >= 0);

  return (
    <div className="space-y-4">
      <div className="hero-ungu relative overflow-hidden rounded-[1.6rem] p-5 text-white">
        <div className="melayang-lambat absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <div className="text-sm text-white/80">Assalamu&apos;alaikum,</div>
        <div className="text-2xl font-extrabold">{a.m.alias}</div>
        <div className="mt-0.5 text-sm text-white/70">
          {a.m.sektor} · {a.m.wilayah}
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 text-tinta">
          <TahapIkon tahap={t.tahap} ukuran={54} />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-abu">Tahap saat ini</div>
            <div className="text-xl font-extrabold" style={{ color: WARNA_TAHAP[t.tahap] }}>
              {NAMA_TAHAP[t.tahap]}
            </div>
            {berikut && t.G !== null && (
              <>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ungu-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-ungu-600 to-ungu-400" style={{ width: `${kemajuan * 100}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-abu">
                  {Math.round(kemajuan * 100)}% menuju {NAMA_TAHAP[t.tahap + 1]}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Link href="/mustahik/catat/" className="tombol-cta w-full py-4 text-lg">
        <NotebookPen size={22} /> Catat hari ini
      </Link>

      {t.penghambat !== null && t.penghambat !== undefined && t.tahap < 5 && (
        <div className="kartu flex gap-3 p-4">
          <Sparkles className="mt-0.5 shrink-0 text-ungu-600" size={20} />
          <p className="text-sm">
            Yang paling membantu untuk naik tahap: <b>{SARAN_MUSTAHIK[parameter.indikator[t.penghambat].kode]}</b>.
          </p>
        </div>
      )}

      <Bagian judul="Ringkasan 3 bulan terakhir">
        <div className="grid grid-cols-3 gap-2">
          {tiga.map((i) => {
            const laba = b.omzet[i] - b.biaya[i];
            return (
              <div key={i} className="rounded-2xl bg-latar p-3">
                <div className="text-xs font-bold text-abu">
                  {labelBulan(bulan[i])}
                  {a.proyeksi && i === n - 1 && <span className="ml-1 text-ungu-600">*</span>}
                </div>
                <div className="mt-2 text-[11px] text-abu">Omzet</div>
                <div className="font-bold">{rupiahRingkas(b.omzet[i])}</div>
                <div className="mt-1 text-[11px] text-abu">Laba</div>
                <div className="font-bold" style={{ color: laba >= 0 ? "var(--color-t4)" : "var(--color-t1)" }}>
                  {rupiahRingkas(laba)}
                </div>
                <div className="mt-1 text-[11px] text-abu">Tabungan</div>
                <div className="font-bold">{rupiahRingkas(b.tabungan[i])}</div>
              </div>
            );
          })}
        </div>
        {a.proyeksi && <p className="mt-2 text-xs text-abu">* Bulan berjalan: proyeksi dari {a.proyeksi.hari} hari tercatat (rata-rata harian × 30).</p>}
        <div className="mt-3 rounded-xl bg-ungu-50 px-3 py-2 text-sm">
          Status bantuan: <b>{a.statusBantuan}</b>
        </div>
      </Bagian>

      <Bagian
        judul="Catatan saya"
        aksi={
          <button
            className="tombol-garis px-3 py-1.5 text-sm"
            disabled={!belum}
            onClick={async () => {
              try {
                const r = await sinkron();
                setPesan(r.mode === "luring" ? "Sedang luring. Catatan akan dikirim otomatis saat daring." : `${r.jumlah} catatan tersinkron (${r.mode === "server" ? "ke server" : "simulasi, tanpa server"}).`);
              } catch (e) {
                setPesan((e as Error).message);
              }
            }}
          >
            <CloudUpload size={15} /> Sinkronkan
          </button>
        }
      >
        {pesan && <p className="mb-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{pesan}</p>}
        {!daring && <p className="mb-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">Anda sedang luring. Catatan tetap tersimpan di perangkat.</p>}
        {milik.length === 0 ? (
          <p className="teks-kecil">Belum ada catatan di perangkat ini. Tekan &quot;Catat hari ini&quot; untuk mulai.</p>
        ) : (
          <ul className="divide-y divide-garis">
            {milik.slice(0, 8).map((c) => (
              <li key={c.uid} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <div className="font-semibold">{c.tanggal}</div>
                  <div className="text-xs text-abu">
                    Omzet {rupiah(c.omzet)} · Biaya {rupiah(c.biaya)}
                  </div>
                </div>
                {c.tersinkron ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={14} /> {c.sinkron_mode === "server" ? "Terkirim" : "Tersinkron (simulasi)"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <Clock size={14} /> Menunggu
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Bagian>
      <PernyataanAmil ringkas />
    </div>
  );
}

export default function Halaman() {
  return (
    <Shell peran="mustahik">
      <Isi />
    </Shell>
  );
}
