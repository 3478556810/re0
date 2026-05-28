import { PresetWind3Options, Theme } from "@unocss/preset-wind3";

//#region src/index.d.ts
interface PresetUnoOptions extends PresetWind3Options {}
/**
 * @deprecated Use `presetWind3` from `@unocss/preset-wind3` instead
 */
declare const presetUno: import("@unocss/core").PresetFactory<Theme, PresetUnoOptions>;
//#endregion
export { PresetUnoOptions, type Theme, presetUno as default, presetUno };