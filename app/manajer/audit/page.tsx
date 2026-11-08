"use client";
import { Shell } from "@/components/Shell";
import { Bagian } from "@/components/ui";
import { useAplikasi } from "@/lib/aplikasi";

function Isi() {
  const { audit } = useAplikasi();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Log audit</h1>
        <p className="teks-kecil">Aksi yang dilakukan di perangkat ini: masuk/keluar, pencatatan, kunjungan, asesmen, perubahan parameter, ekspor, sinkronisasi.</p>
      </div>
      <Bagian judul={`${audit.length} entri`}>
        <div className="overflow-x-auto">
          <table className="tabel">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Peran</th>
                <th>Pengguna</th>
                <th>Aksi</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {audit.slice(0, 300).map((a, i) => (
                <tr key={a.id ?? i}>
                  <td className="whitespace-nowrap text-xs">{new Date(a.waktu).toLocaleString("id-ID")}</td>
                  <td>{a.peran}</td>
                  <td className="whitespace-nowrap">{a.pengguna}</td>
                  <td className="font-semibold">{a.aksi}</td>
                  <td className="max-w-xs truncate font-mono text-xs text-abu" title={a.detail}>
                    {a.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-abu">Mode demo: log disimpan di IndexedDB perangkat. Pada backend FastAPI, log juga disimpan di SQLite (endpoint /audit).</p>
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
