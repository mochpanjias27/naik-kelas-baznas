"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera, CheckCircle2, Mic, Square, Wallet, ShoppingBag, PiggyBank, Home as Rumah } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useAplikasi } from "@/lib/aplikasi";
import { hariIni, rupiah, uid } from "@/lib/format";

function InputRupiah({ id, label, ikon: Ikon, nilai, ubah, bantu }: { id: string; label: string; ikon: typeof Wallet; nilai: string; ubah: (v: string) => void; bantu: string }) {
  return (
    <div className="kartu p-4">
      <label htmlFor={id} className="flex items-center gap-2 text-base font-bold">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-ungu-50 text-ungu-600">
          <Ikon size={18} />
        </span>
        {label}
      </label>
      <div className="mt-3 flex items-center rounded-xl border border-garis bg-white focus-within:border-ungu-500 focus-within:ring-4 focus-within:ring-ungu-100">
        <span className="pl-4 font-semibold text-abu">Rp</span>
        <input
          id={id}
          inputMode="numeric"
          className="w-full rounded-xl bg-transparent px-3 py-3.5 text-xl font-bold outline-none"
          value={nilai ? Number(nilai).toLocaleString("id-ID") : ""}
          onChange={(e) => ubah(e.target.value.replace(/\D/g, "").slice(0, 12))}
          placeholder="0"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[10000, 50000, 100000].map((v) => (
          <button key={v} type="button" className="rounded-full bg-ungu-50 px-3 py-1.5 text-xs font-semibold text-ungu-700" onClick={() => ubah(String(Number(nilai || 0) + v))}>
            +{v / 1000} rb
          </button>
        ))}
        <button type="button" className="rounded-full px-3 py-1.5 text-xs font-semibold text-abu" onClick={() => ubah("")}>
          Hapus
        </button>
      </div>
      <p className="mt-1.5 text-xs text-abu">{bantu}</p>
    </div>
  );
}

function Isi() {
  const { sesi, tambahCatatan, daring } = useAplikasi();
  const router = useRouter();
  const [tanggal, setTanggal] = useState(hariIni());
  const [omzet, setOmzet] = useState("");
  const [biaya, setBiaya] = useState("");
  const [tabungan, setTabungan] = useState("");
  const [peng, setPeng] = useState("");
  const [ket, setKet] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [suara, setSuara] = useState<Blob | null>(null);
  const [rekam, setRekam] = useState(false);
  const [galat, setGalat] = useState("");
  const [selesai, setSelesai] = useState(false);
  const perekam = useRef<MediaRecorder | null>(null);

  const mulaiRekam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const potong: Blob[] = [];
      r.ondataavailable = (e) => potong.push(e.data);
      r.onstop = () => {
        setSuara(new Blob(potong, { type: r.mimeType }));
        stream.getTracks().forEach((t) => t.stop());
      };
      r.start();
      perekam.current = r;
      setRekam(true);
    } catch {
      setGalat("Mikrofon tidak tersedia di perangkat atau izin ditolak.");
    }
  };

  const kirim = async () => {
    setGalat("");
    if (!omzet && !biaya && !tabungan && !peng) return setGalat("Isi minimal satu angka.");
    await tambahCatatan(
      {
        uid: uid(),
        mustahik_id: sesi!.mustahik_id!,
        tanggal,
        omzet: Number(omzet || 0),
        biaya: Number(biaya || 0),
        tabungan: Number(tabungan || 0),
        pengeluaran: Number(peng || 0),
        catatan: ket,
        ada_foto: !!foto,
        ada_suara: !!suara,
        dibuat: new Date().toISOString(),
        tersinkron: false,
      },
      foto,
      suara,
    );
    setSelesai(true);
  };

  if (selesai)
    return (
      <div className="kartu p-8 text-center">
        <CheckCircle2 size={56} className="mx-auto text-t4" />
        <h1 className="mt-3 text-xl font-extrabold">Catatan tersimpan</h1>
        <p className="mt-1 text-sm text-abu">
          Laba hari ini: <b className="text-tinta">{rupiah(Number(omzet || 0) - Number(biaya || 0))}</b>
          <br />
          {daring ? "Catatan disimpan di perangkat dan akan disinkronkan." : "Anda luring. Catatan akan dikirim otomatis saat daring."}
        </p>
        <div className="mt-6 grid gap-2">
          <button className="tombol-utama" onClick={() => router.push("/mustahik/")}>
            Kembali ke beranda
          </button>
          <button
            className="tombol-garis"
            onClick={() => {
              setSelesai(false);
              setOmzet("");
              setBiaya("");
              setTabungan("");
              setPeng("");
              setKet("");
              setFoto(null);
              setSuara(null);
            }}
          >
            Catat lagi
          </button>
        </div>
      </div>
    );

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">Catat usaha</h1>
      <div>
        <label className="label" htmlFor="tgl">
          Tanggal
        </label>
        <input id="tgl" type="date" className="masukan" value={tanggal} max={hariIni()} onChange={(e) => setTanggal(e.target.value)} />
      </div>
      <InputRupiah id="omzet" label="Uang masuk (omzet)" ikon={Wallet} nilai={omzet} ubah={setOmzet} bantu="Semua uang dari penjualan hari ini." />
      <InputRupiah id="biaya" label="Belanja usaha (biaya)" ikon={ShoppingBag} nilai={biaya} ubah={setBiaya} bantu="Bahan baku, sewa, transport untuk usaha." />
      <InputRupiah id="tabungan" label="Ditabung" ikon={PiggyBank} nilai={tabungan} ubah={setTabungan} bantu="Uang yang disisihkan untuk simpanan." />
      <InputRupiah id="peng" label="Pengeluaran rumah tangga" ikon={Rumah} nilai={peng} ubah={setPeng} bantu="Makan, sekolah, listrik, dan lainnya." />

      <div className="kartu space-y-3 p-4">
        <div className="text-base font-bold">Lampiran (opsional)</div>
        <label className="tombol-garis w-full cursor-pointer">
          <Camera size={18} /> {foto ? `Foto: ${foto.name.slice(0, 24)}` : "Foto nota"}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
        </label>
        {typeof window !== "undefined" && "MediaRecorder" in window && (
          <button
            type="button"
            className={rekam ? "tombol-cta w-full" : "tombol-garis w-full"}
            onClick={() => {
              if (rekam) {
                perekam.current?.stop();
                setRekam(false);
              } else void mulaiRekam();
            }}
          >
            {rekam ? <Square size={18} /> : <Mic size={18} />} {rekam ? "Berhenti merekam" : suara ? "Catatan suara tersimpan · rekam ulang" : "Catatan suara"}
          </button>
        )}
        <textarea className="masukan" rows={2} placeholder="Catatan singkat (opsional)" value={ket} onChange={(e) => setKet(e.target.value)} />
        <p className="text-xs text-abu">Lampiran disimpan di perangkat ini saja dalam mode demo.</p>
      </div>

      {galat && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{galat}</p>}
      <button className="tombol-cta w-full py-4 text-lg" onClick={kirim}>
        Simpan catatan
      </button>
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
