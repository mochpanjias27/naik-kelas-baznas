"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Parameter, Skor } from "@/lib/engine";
import { angka, labelBulan } from "@/lib/format";
import { NAMA_PENDEK, WARNA_TAHAP } from "./ui";

const sumbu = { fontSize: 11, fill: "#6b6890" };
const kisi = <CartesianGrid stroke="#ece9f7" vertical={false} />;
const tooltipGaya = { borderRadius: 12, border: "1px solid #e7e4f5", fontSize: 12 };

export function GrafikG({ skor, bulan, ambang, tinggi = 220 }: { skor: Skor[]; bulan: string[]; ambang: number[]; tinggi?: number }) {
  const data = skor.map((s, i) => ({ b: labelBulan(bulan[i] ?? bulan[bulan.length - 1]), G: s.G === null ? null : +s.G.toFixed(4), tahap: s.tahap }));
  return (
    <ResponsiveContainer width="100%" height={tinggi}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        {kisi}
        <XAxis dataKey="b" tick={sumbu} interval="preserveStartEnd" minTickGap={18} />
        <YAxis domain={[0, 1]} tick={sumbu} ticks={[0, 0.25, 0.5, 0.75, 1]} />
        {ambang.map((a, i) => (
          <ReferenceLine key={a} y={a} stroke={WARNA_TAHAP[i + 2]} strokeDasharray="4 4" label={{ value: `τ${i + 1}`, position: "right", fontSize: 10, fill: WARNA_TAHAP[i + 2] }} />
        ))}
        <Tooltip contentStyle={tooltipGaya} formatter={(v) => [angka(Number(v), 3), "G"]} />
        <Line
          type="monotone"
          dataKey="G"
          stroke="#5b3df5"
          strokeWidth={2.5}
          connectNulls={false}
          dot={(p: { cx?: number; cy?: number; payload?: { tahap: number }; index?: number }) =>
            p.cx == null || p.cy == null ? <g key={p.index} /> : <circle key={p.index} cx={p.cx} cy={p.cy} r={3.2} fill={WARNA_TAHAP[p.payload!.tahap]} stroke="white" strokeWidth={1} />
          }
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GrafikCusum({ S, h, bulan, tinggi = 180 }: { S: number[]; h: number; bulan: string[]; tinggi?: number }) {
  const data = S.map((v, i) => ({ b: labelBulan(bulan[i] ?? bulan[bulan.length - 1]), S: +v.toFixed(3), alarm: v > h ? +v.toFixed(3) : null }));
  return (
    <ResponsiveContainer width="100%" height={tinggi}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        {kisi}
        <XAxis dataKey="b" tick={sumbu} interval="preserveStartEnd" minTickGap={18} />
        <YAxis tick={sumbu} />
        <ReferenceLine y={h} stroke="#e5484d" strokeDasharray="4 4" label={{ value: "h", position: "right", fontSize: 10, fill: "#e5484d" }} />
        <Tooltip contentStyle={tooltipGaya} />
        <Area type="monotone" dataKey="S" stroke="#8f7bfb" fill="#ebe7ff" />
        <Scatter dataKey="alarm" fill="#e5484d" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function GrafikSebaranTahap({ seri, tinggi = 260 }: { seri: { b: string; [k: string]: number | string }[]; tinggi?: number }) {
  return (
    <ResponsiveContainer width="100%" height={tinggi}>
      <BarChart data={seri} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        {kisi}
        <XAxis dataKey="b" tick={sumbu} interval="preserveStartEnd" minTickGap={14} />
        <YAxis tick={sumbu} />
        <Tooltip contentStyle={tooltipGaya} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {[1, 2, 3, 4, 5, 6].map((t) => (
          <Bar key={t} dataKey={NAMA_PENDEK[t]} stackId="a" fill={WARNA_TAHAP[t]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GrafikGaris({
  data,
  seri,
  domain,
  tinggi = 240,
}: {
  data: Record<string, number | string | null>[];
  seri: { kunci: string; warna: string; nama?: string }[];
  domain?: [number, number];
  tinggi?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={tinggi}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        {kisi}
        <XAxis dataKey="b" tick={sumbu} interval="preserveStartEnd" minTickGap={14} />
        <YAxis tick={sumbu} domain={domain ?? ["auto", "auto"]} />
        <Tooltip contentStyle={tooltipGaya} formatter={(v) => angka(Number(v), 3)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {seri.map((s) => (
          <Line key={s.kunci} type="monotone" dataKey={s.kunci} name={s.nama ?? s.kunci} stroke={s.warna} strokeWidth={2.4} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GrafikArea({ data, seri, tinggi = 260, persen = true }: { data: Record<string, number | string>[]; seri: { kunci: string; warna: string }[]; tinggi?: number; persen?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={tinggi}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        {kisi}
        <XAxis dataKey="b" tick={sumbu} />
        <YAxis tick={sumbu} tickFormatter={(v) => (persen ? `${Math.round(v * 100)}%` : v)} domain={persen ? [0, 1] : ["auto", "auto"]} />
        <Tooltip contentStyle={tooltipGaya} formatter={(v) => (persen ? `${(Number(v) * 100).toFixed(1)}%` : v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {seri.map((s) => (
          <Area key={s.kunci} type="monotone" dataKey={s.kunci} stackId="1" stroke={s.warna} fill={s.warna} fillOpacity={0.85} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GrafikBatang({ data, kunci, warna = "#5b3df5", tinggi = 200, label }: { data: { b: string; [k: string]: number | string }[]; kunci: string; warna?: string; tinggi?: number; label?: string }) {
  return (
    <ResponsiveContainer width="100%" height={tinggi}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        {kisi}
        <XAxis dataKey="b" tick={sumbu} />
        <YAxis tick={sumbu} />
        <Tooltip contentStyle={tooltipGaya} />
        <Bar dataKey={kunci} name={label ?? kunci} fill={warna} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Penjelasan skor: nilai ternormalisasi s_k, bobot w_k, dan kontribusi Euler c_k. */
export function KontribusiIndikator({ skor, parameter }: { skor: Skor; parameter: Parameter }) {
  if (skor.G === null || !skor.s || !skor.kontribusi) return <p className="teks-kecil">Usaha tidak aktif; skor tidak dihitung.</p>;
  const tot = parameter.bobot.reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-3">
      {parameter.indikator.map((ind, k) => {
        const s = skor.s![k];
        const c = skor.kontribusi![k];
        const hambat = skor.penghambat === k;
        return (
          <div key={ind.kode}>
            <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
              <span className="font-semibold">
                {ind.nama}
                {hambat && <span className="ml-2 rounded-full bg-oranye-500/10 px-2 py-0.5 text-[11px] font-bold text-oranye-600">penghambat utama</span>}
              </span>
              <span className="shrink-0 text-xs text-abu">
                s={angka(s)} · w={angka(parameter.bobot[k] / tot)} · <b className="text-tinta">c={angka(c, 3)}</b>
              </span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ungu-50">
              <div className="h-full rounded-full bg-gradient-to-r from-ungu-600 to-ungu-400" style={{ width: `${s * 100}%` }} />
            </div>
            <div className="mt-0.5 text-[11px] text-abu">
              Nilai mentah x = {angka(skor.x![k], 3)} {ind.satuan} · rentang normalisasi [{ind.l}; {ind.u}] · pangsa dari G: {angka((c / skor.G!) * 100, 1)}%
            </div>
          </div>
        );
      })}
      <p className="rounded-xl bg-latar p-3 text-xs text-abu">
        Kontribusi c<sub>k</sub> = s<sub>k</sub>·∂G/∂s<sub>k</sub> (dekomposisi Euler) sehingga Σc<sub>k</sub> = G = <b className="text-tinta">{angka(skor.G, 3)}</b>. &quot;Penghambat utama&quot; adalah
        indikator dengan kenaikan G terbesar bila diperbaiki sedikit. Versi parameter: <b className="text-tinta">{skor.versi}</b>.
      </p>
    </div>
  );
}
