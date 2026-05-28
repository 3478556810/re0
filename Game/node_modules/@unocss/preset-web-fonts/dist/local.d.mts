import { a as WebFontProcessor } from "./types-Bbb4MXF_.mjs";
import { Buffer } from "node:buffer";
import { fetch } from "ofetch";

//#region src/local.d.ts
interface LocalFontProcessorOptions {
  /**
   * Current working directory
   *
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Directory to cache the fonts
   *
   * @default 'node_modules/.cache/unocss/fonts'
   */
  cacheDir?: string;
  /**
   * Directory to save the fonts assets
   *
   * @default 'public/assets/fonts'
   */
  fontAssetsDir?: string;
  /**
   * Base URL to serve the fonts from the client
   *
   * @default '/assets/fonts'
   */
  fontServeBaseUrl?: string;
  /**
   * Custom fetch function to provide the font data.
   */
  fetch?: typeof fetch;
  /**
   * Callback invoked when a font file is downloaded during build.
   * Receives the filename and file buffer, useful for emitting fonts
   * directly to the build output instead of relying on public dir copy.
   */
  onDownload?: (filename: string, buf: Buffer) => void | Promise<void>;
}
declare function createLocalFontProcessor(options?: LocalFontProcessorOptions): WebFontProcessor;
//#endregion
export { LocalFontProcessorOptions, createLocalFontProcessor };