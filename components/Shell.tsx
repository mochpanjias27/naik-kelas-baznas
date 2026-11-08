"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  BarChart3,
  ClipboardList,
  Download,
  Home,
  LogOut,
  PencilLine,
  Settings2,
  Shuffle,
  Users,
  Wifi,
  WifiOff,
  Calculator,
  ScrollText,
  GitBranch,
  type LucideIcon,
} from "lucide-react";
import { useAplikasi, type Peran } from "@/lib/aplikasi";
import { LabelSintetis, Logo, Memuat } from "./ui";

const MENU: Record<Peran, { href: string; label: string; ikon: LucideIcon }[]> = {
  mustahik: [
    { href: "/mustahik/", label: "Beranda", ikon: Home },
    { href: "/mustahik/catat/", label: "Catat", ikon: PencilLine },
  ],
  pendamping: [
    { href: "/pendamping/", label: "Mustahik", ikon: Users },
    { href: "/pendamping/jadwal/", label: "Jadwal", ikon: ClipboardList },
  ],
  manajer: [
    { href: "/manajer/", label: "Dasbor", ikon: BarChart3 },
    { href: "/manajer/lintasan/", label: "Lintasan", ikon: GitBranch },
    { href: "/manajer/sensitivitas/", label: "Sensitivitas", ikon: Shuffle },
    { href: "/manajer/modal/", label: "Modal", ikon: Calculator },
    { href: "/manajer/ekspor/", label: "Ekspor", ikon: Download },
    { href: "/manajer/pengaturan/", label: "Parameter", ikon: Settings2 },
    { href: "/manajer/audit/", label: "Audit", ikon: ScrollText },
  ],
};

const NAMA_PERAN: Record<Peran, string> = { mustahik: "Mustahik", pendamping: "Pendamping", manajer: "Manajer program" };

export function Shell({ peran, children, lebar = false }: { peran: Peran | Peran[]; children: ReactNode; lebar?: boolean }) {
  const { sesi, siap, keluar, daring, catatan, parameter } = useAplikasi();
  const router = useRouter();
  const path = usePathname();
  const diizinkan = Array.isArray(peran) ? peran : [peran];
  const boleh = sesi && diizinkan.includes(sesi.peran);

  useEffect(() => {
    if (siap && !boleh) router.replace("/masuk/");
  }, [siap, boleh, router]);

  if (!siap || !boleh || !sesi) return <Memuat />;
  const menu = MENU[sesi.peran];
  const belum = catatan.filter((c) => !c.tersinkron).length;
  const lebarKonten = lebar || sesi.peran === "manajer" ? "max-w-6xl" : "max-w-xl";

  return (
    <div className="min-h-screen pb-24 sm:pb-10">
      <header className="sticky top-0 z-30 border-b border-garis bg-white/85 backdrop-blur">
        <div className={`mx-auto flex items-center justify-between gap-3 px-4 py-3 ${lebarKonten}`}>
          <Logo kecil />
          <div className="flex items-center gap-2">
            <LabelSintetis />
            <span
              className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${daring ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
              title={belum ? `${belum} catatan menunggu sinkronisasi` : "Semua catatan tersinkron"}
            >
              {daring ? <Wifi size={13} /> : <WifiOff size={13} />}
              {daring ? "Daring" : "Luring"}
              {belum > 0 && ` · ${belum}`}
            </span>
            <button onClick={keluar} className="grid h-9 w-9 place-items-center rounded-full border border-garis text-abu hover:text-oranye-500" aria-label="Keluar" title="Keluar">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        {menu.length > 2 && (
          <nav className={`mx-auto hidden gap-1 overflow-x-auto px-4 pb-2 sm:flex ${lebarKonten}`}>
            {menu.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold ${path === m.href ? "bg-ungu-600 text-white" : "text-abu hover:bg-ungu-50 hover:text-ungu-700"}`}
              >
                <m.ikon size={15} /> {m.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className={`mx-auto px-4 py-5 ${lebarKonten}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-abu">
          <span>
            Masuk sebagai <b className="text-tinta">{NAMA_PERAN[sesi.peran]}</b> · {sesi.nama}
          </span>
          <span>
            Parameter <b className="text-tinta">{parameter.versi}</b> · belum dikalibrasi
          </span>
        </div>
        {children}
        <footer className="mt-10 border-t border-garis pt-4 text-center text-xs text-abu">
          Prototipe riset — bukan produk produksi. Data SINTETIS. Skor adalah alat bantu; keputusan akhir pada amil.
        </footer>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-garis bg-white/95 backdrop-blur sm:hidden">
        <div className="flex overflow-x-auto">
          {menu.map((m) => {
            const aktif = path === m.href;
            return (
              <Link key={m.href} href={m.href} className={`flex min-w-[72px] flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${aktif ? "text-ungu-600" : "text-abu"}`}>
                <m.ikon size={22} strokeWidth={aktif ? 2.5 : 2} />
                {m.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
