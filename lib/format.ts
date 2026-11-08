export const rupiah = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? "–"
    : "Rp" + Math.round(v).toLocaleString("id-ID");

export const rupiahRingkas = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1e9) return `Rp${(v / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (a >= 1e6) return `Rp${(v / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (a >= 1e3) return `Rp${(v / 1e3).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  return `Rp${Math.round(v)}`;
};

export const angka = (v: number | null | undefined, d = 2) =>
  v === null || v === undefined || !Number.isFinite(v) ? "–" : v.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });

export const persen = (v: number, d = 0) => `${(v * 100).toLocaleString("id-ID", { maximumFractionDigits: d })}%`;

const NAMA_BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const labelBulan = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${NAMA_BULAN[m - 1]} ${String(y).slice(2)}`;
};

export const hariIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
