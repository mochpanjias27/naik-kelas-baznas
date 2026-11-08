"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Memuat } from "@/components/ui";
import { useAplikasi } from "@/lib/aplikasi";
import { hariIni, uid } from "@/lib/format";

function Isi() {
  const id = useSearchParams().get("id") ?? "";
  const { peta, data, tambahKunjungan, sesi } = useAplikasi();
  const router = useRouter();
  const a = peta.get(id);
  const [tanggal, setTanggal] = useState(hariIni());
  const [ceklis, setCeklis] = useState<boolean[]>(() => (data ? data.ceklis.map(() => false) : []));
  const [hambatan, setHambatan] = useState<string[]>([]);
  const [lain, setLain] = useState("");
  const [catatan, setCatatan] = useState("");
  const [milestone, setMilestone] = useState("");
  const [jadwal, setJadwal] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  if (!data) return <Memuat />;
  if (!a) return <p className="kartu p-6">Mustahik tidak ditemukan.</p>;
  const cek = ceklis.length ? ceklis : data.ceklis.map(() => false);

  const simpan = async () => {
    await tambahKunjungan({
      uid: uid(),
      mustahik_id: id,
      tanggal,
      ceklis: cek,
      hambatan: [...hambatan, ...(lain.trim() ? [lain.trim()] : [])],
      catatan,
      milestone,
      jadwal_berikut: jadwal,
      oleh: sesi!.nama,
      dibuat: new Date().toISOString(),
    });
    router.push(`/pendamping/detail/?id=${id}`);
  };

  return (
    <div className="space-y-4">
      <Link href={`/pendamping/detail/?id=${id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-abu hover:text-ungu-700">
        <ArrowLeft size={16} /> {a.m.alias}
      </Link>
      <h1 className="text-2xl font-extrabold">Form kunjungan</h1>

      <div className="kartu space-y-4 p-4">
        <div>
          <label className="label" htmlFor="tgl">
            Tanggal kunjungan
          </label>
          <input id="tgl" type="date" className="masukan" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>
        <div>
          <div className="label">Daftar periksa</div>
          <div className="grid gap-2">
            {data.ceklis.map((c, i) => (
              <button
                key={c}
                type="button"
                onClick={() => setCeklis(cek.map((v, j) => (j === i ? !v : v)))}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left font-semibold ${cek[i] ? "border-ungu-500 bg-ungu-50 text-ungu-800" : "border-garis bg-white"}`}
              >
                <span className={`grid h-6 w-6 place-items-center rounded-md border ${cek[i] ? "border-ungu-600 bg-ungu-600 text-white" : "border-garis"}`}>{cek[i] && <Check size={15} />}</span>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="label">Hambatan yang ditemui</div>
          <div className="flex flex-wrap gap-2">
            {data.hambatan.map((h) => {
              const on = hambatan.includes(h);
              return (
                <button key={h} type="button" onClick={() => setHambatan(on ? hambatan.filter((x) => x !== h) : [...hambatan, h])} className={`rounded-full px-3.5 py-2 text-sm font-semibold ${on ? "bg-oranye-500 text-white" : "bg-white text-abu ring-1 ring-garis"}`}>
                  {h}
                </button>
              );
            })}
          </div>
          <input className="masukan mt-2" placeholder="Hambatan lain (opsional)" value={lain} onChange={(e) => setLain(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="cat">
            Catatan
          </label>
          <textarea id="cat" className="masukan" rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Temuan, kesepakatan, tindak lanjut…" />
        </div>
        <div>
          <label className="label" htmlFor="ms">
            Milestone tercapai (opsional)
          </label>
          <input id="ms" className="masukan" value={milestone} onChange={(e) => setMilestone(e.target.value)} placeholder="Mis. membuka lapak kedua" />
        </div>
        <div>
          <label className="label" htmlFor="jd">
            Jadwal kunjungan berikutnya
          </label>
          <input id="jd" type="date" className="masukan" value={jadwal} onChange={(e) => setJadwal(e.target.value)} />
          <p className="mt-1 text-xs text-abu">Muncul sebagai pengingat di menu Jadwal.</p>
        </div>
      </div>
      <button className="tombol-utama w-full py-4" onClick={simpan}>
        Simpan kunjungan
      </button>
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
