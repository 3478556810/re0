import { a as WebFontProcessor, i as WebFontMeta, n as Provider, o as WebFontsOptions, r as ResolvedWebFontMeta, s as WebFontsProviders, t as Axes } from "./types-Bbb4MXF_.mjs";
//#region src/preset.d.ts
declare function normalizedFontMeta(meta: WebFontMeta | string, defaultProvider: WebFontsProviders): ResolvedWebFontMeta;
//#endregion
//#region src/providers/google.d.ts
declare function createGoogleCompatibleProvider(name: WebFontsProviders, host: string): Provider;
//#endregion
//#region src/providers/zeoseven.d.ts
declare const ZeoSevenFontsProvider: Provider;
//#endregion
//#region src/index.d.ts
/**
 * Preset for using web fonts by provide just the names.
 *
 * @see https://unocss.dev/presets/web-fonts
 */
declare const presetWebFonts: import("@unocss/core").PresetFactory<any, WebFontsOptions>;
//#endregion
export { Axes, Provider, ResolvedWebFontMeta, WebFontMeta, WebFontProcessor, WebFontsOptions, WebFontsProviders, ZeoSevenFontsProvider, createGoogleCompatibleProvider as createGoogleProvider, presetWebFonts as default, presetWebFonts, normalizedFontMeta };