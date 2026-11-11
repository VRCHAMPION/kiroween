/**
 * Entry of the lazy `detection-data` chunk. This is the only file that imports `tldts` (with the
 * Public Suffix List compiled in) and the generated data files, so none of them reach first paint.
 * Load it through `data-loader.ts`, never with a static import.
 */
// The pre-minified build keeps the Public Suffix List about half the size of the default ES module build.
import { parse } from 'tldts/dist/index.esm.min.js';
import { GENERATED_CONFUSABLES } from './data/confusables';
import { TOP_BRANDS } from './data/top-brands';

export interface PslResult {
  domain: string | null;
  publicSuffix: string | null;
  subdomain: string | null;
}

export interface DetectionData {
  /** Splits a lower-case host with the Public Suffix List; private suffixes (such as blogspot.com) are not used. */
  parse: (host: string) => PslResult;
  /** Source character to the Latin letters or digits it imitates (from Unicode confusables.txt). */
  confusables: Readonly<Record<string, string>>;
  /** Registrable domains of famous sites, most visited first. */
  topBrands: readonly string[];
}

export const DATA: DetectionData = {
  parse: (host) => {
    const r = parse(host, { allowPrivateDomains: false, extractHostname: false });
    return { domain: r.domain, publicSuffix: r.publicSuffix, subdomain: r.subdomain };
  },
  confusables: GENERATED_CONFUSABLES,
  topBrands: TOP_BRANDS,
};
