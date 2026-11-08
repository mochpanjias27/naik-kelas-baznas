export * from "./tipe";
export * from "./ces";
export * from "./tahap";
export * from "./bobot";
export * from "./markov";
export * from "./cusum";
export * from "./sensitivitas";
export * from "./modal";
export * from "./asesmen";
export * from "./indikator";
export * from "./acak";

import bawaan from "../../engine/naik_kelas/parameter_bawaan.json";
import type { Parameter } from "./tipe";

export const PARAMETER_BAWAAN = bawaan as unknown as Parameter;
