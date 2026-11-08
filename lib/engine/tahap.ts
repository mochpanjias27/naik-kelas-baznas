// Penentuan tahap graduasi. Port dari engine/naik_kelas/tahap.py.

export const NAMA_TAHAP: Record<number, string> = {
  1: "Rentan",
  2: "Memulai",
  3: "Bertahan",
  4: "Mandiri (muktafi)",
  5: "Muzakki",
  6: "Keluar/gagal",
};

export const CATATAN_FIKIH = "Dasar nisab dan haul perlu dikonfirmasi pada rujukan fikih.";

export function nisabRupiah(gram: number, hargaPerGram: number): number {
  if (gram <= 0 || hargaPerGram <= 0) throw new Error("Berat nisab dan harga emas harus positif.");
  return gram * hargaPerGram;
}

export function cekAmbang(ambang: number[]) {
  if (ambang.length !== 4) throw new Error("Diperlukan tepat empat ambang.");
  const [a, b, c, d] = ambang;
  if (!(0 < a && a < b && b < c && c < d && d < 1)) throw new Error("Ambang harus memenuhi 0 < t1 < t2 < t3 < t4 < 1.");
}

export function tentukanTahap(g: number, ambang: number[], kekayaan: number, nisab: number) {
  cekAmbang(ambang);
  let tahap = 1 + ambang.filter((a) => g >= a).length;
  let alasan = `G = ${g.toFixed(3)} melampaui ${tahap - 1} dari 4 ambang.`;
  let ditahan = false;
  if (tahap === 5 && kekayaan < nisab) {
    tahap = 4;
    ditahan = true;
    alasan += " Tahap 5 ditahan karena kekayaan bersih belum mencapai nisab.";
  }
  return { tahap, nama: NAMA_TAHAP[tahap], alasan, ditahan_nisab: ditahan };
}

export function estimasiZakat(kekayaan: number, nisab: number, tarif = 0.025) {
  const wajib = kekayaan >= nisab;
  return { mencapai_nisab: wajib, estimasi: wajib ? tarif * kekayaan : 0, catatan: CATATAN_FIKIH };
}

export function statusBantuan(riwayat: number[], bulanBertahap = 6): string {
  if (riwayat.length === 0) return "Belum ada data";
  const terakhir = riwayat[riwayat.length - 1];
  if (terakhir === 6) return "Keluar/gagal: tinjau ulang";
  if (terakhir <= 3) return "Bantuan dan pendampingan penuh";
  let beruntun = 0;
  for (let i = riwayat.length - 1; i >= 0; i--) {
    if (riwayat[i] >= 4 && riwayat[i] <= 5) beruntun++;
    else break;
  }
  return beruntun >= bulanBertahap ? "Lulus: pemantauan ringan" : "Penurunan bantuan bertahap";
}
