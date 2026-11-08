import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PenyediaAplikasi } from "@/lib/aplikasi";
import { DaftarSW } from "@/components/DaftarSW";

export const metadata: Metadata = {
  title: "Naik Kelas — Prototipe Riset Graduasi Mustahik",
  description:
    "Prototipe riset sistem pendamping dan pemantau graduasi mustahik pengusaha pada program zakat produktif. Data sintetis; alat bantu keputusan amil.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/ikon-192.png", apple: "/ikon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#5b3df5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <PenyediaAplikasi>{children}</PenyediaAplikasi>
        <DaftarSW />
      </body>
    </html>
  );
}
