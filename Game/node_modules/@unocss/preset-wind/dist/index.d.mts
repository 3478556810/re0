import { PresetWind3Options, Theme } from "@unocss/preset-wind3";

//#region src/index.d.ts
interface PresetWindOptions extends PresetWind3Options {}
/**
 * @deprecated Use `presetWind3` from `@unocss/preset-wind3` instead
 */
declare const presetWind: import("@unocss/core").PresetFactory<Theme, PresetWindOptions>;
//#endregion
export { PresetWindOptions, type Theme, presetWind as default, presetWind };