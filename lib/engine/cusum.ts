// CUSUM satu sisi untuk penurunan. Port dari engine/naik_kelas/cusum.py.

export function cusum(y: number[], mu0: number, kappa: number, h: number, reset = false) {
  if (kappa < 0 || h <= 0) throw new Error("kappa harus >= 0 dan h harus > 0.");
  const S: number[] = [];
  const alarm: number[] = [];
  let prev = 0;
  y.forEach((yt, t) => {
    if (!Number.isFinite(yt)) {
      S.push(prev);
      return;
    }
    let st = Math.max(0, prev + (mu0 - yt) - kappa);
    S.push(st);
    if (st > h) {
      alarm.push(t);
      if (reset) st = 0;
    }
    prev = st;
  });
  const pertama = alarm.length ? alarm[0] : null;
  let alasan: string;
  if (pertama === null) {
    alasan = "Tidak ada peringatan: akumulasi penurunan belum melampaui ambang h.";
  } else {
    let awal = pertama;
    while (awal > 0 && S[awal - 1] > 0) awal--;
    alasan =
      `Peringatan pada periode ke-${pertama + 1}: sejak periode ke-${awal + 1}, ` +
      `nilai berada di bawah acuan mu0 = ${mu0} (setelah dikurangi kelonggaran ` +
      `kappa = ${kappa}) hingga akumulasinya S = ${S[pertama].toFixed(3)} > h = ${h}.`;
  }
  return { S, alarm, alarm_pertama: pertama, aktif_sekarang: S.length > 0 && S[S.length - 1] > h, alasan };
}
