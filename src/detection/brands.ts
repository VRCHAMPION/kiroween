import { normaliseConfusables } from './normalise';
import { isIpHost, registrableDomain, suffixLabelCount } from './links';

export interface Brand {
  name: string;
  /** Normalised names that identify the brand inside a domain label. */
  keys: readonly string[];
  /** Registrable domains the brand really uses. */
  official: readonly string[];
}

/** Brands often imitated in India. Real names are needed for detection; no lookups are made. */
export const BRANDS: readonly Brand[] = [
  { name: 'PayPal', keys: ['paypal'], official: ['paypal.com', 'paypal.me'] },
  { name: 'SBI', keys: ['sbi', 'onlinesbi', 'statebank'], official: ['sbi.co.in', 'onlinesbi.sbi', 'sbi.bank.in', 'onlinesbi.com'] },
  { name: 'HDFC Bank', keys: ['hdfc', 'hdfcbank'], official: ['hdfcbank.com', 'hdfc.bank.in'] },
  { name: 'ICICI Bank', keys: ['icici', 'icicibank'], official: ['icicibank.com', 'icici.bank.in'] },
  { name: 'Axis Bank', keys: ['axisbank'], official: ['axisbank.com', 'axis.bank.in'] },
  { name: 'Paytm', keys: ['paytm'], official: ['paytm.com', 'paytm.in'] },
  { name: 'PhonePe', keys: ['phonepe'], official: ['phonepe.com'] },
  { name: 'Amazon', keys: ['amazon'], official: ['amazon.in', 'amazon.com'] },
  { name: 'Flipkart', keys: ['flipkart'], official: ['flipkart.com'] },
  { name: 'India Post', keys: ['indiapost'], official: ['indiapost.gov.in'] },
  { name: 'Blue Dart', keys: ['bluedart'], official: ['bluedart.com'] },
  { name: 'Delhivery', keys: ['delhivery'], official: ['delhivery.com'] },
  { name: 'Google', keys: ['google'], official: ['google.com', 'google.co.in'] },
  { name: 'Microsoft', keys: ['microsoft'], official: ['microsoft.com'] },
  { name: 'Apple', keys: ['apple', 'icloud'], official: ['apple.com', 'icloud.com'] },
  { name: 'Netflix', keys: ['netflix'], official: ['netflix.com'] },
  { name: 'WhatsApp', keys: ['whatsapp'], official: ['whatsapp.com'] },
  { name: 'NPCI', keys: ['npci', 'bhim'], official: ['npci.org.in', 'bhimupi.org.in'] },
  { name: 'Income Tax Department', keys: ['incometax'], official: ['incometax.gov.in'] },
  { name: 'UIDAI', keys: ['uidai', 'aadhaar', 'aadhar'], official: ['uidai.gov.in'] },
  { name: 'IRCTC', keys: ['irctc'], official: ['irctc.co.in'] },
];

export function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return prev[b.length];
}

export type LookalikeMatch =
  | { kind: 'brand'; brand: Brand; imitation: boolean }
  | { kind: 'foreign-script' };

/** Checks whether a host imitates a known brand or hides foreign look-alike letters. */
export function findBrandLookalike(host: string): LookalikeMatch | undefined {
  const lower = host.toLowerCase();
  if (lower === '' || isIpHost(lower)) {
    return undefined;
  }
  const registrable = registrableDomain(lower);
  if (BRANDS.some((b) => b.official.includes(registrable))) {
    return undefined;
  }
  const labels = lower.split('.');
  const names = labels.slice(0, Math.max(0, labels.length - suffixLabelCount(labels)));
  for (const label of names) {
    const candidates = new Set([label, label.replace(/-/g, ''), ...label.split('-')].filter((c) => c.length > 0));
    for (const raw of candidates) {
      const folded = normaliseConfusables(raw);
      for (const brand of BRANDS) {
        for (const key of brand.keys) {
          const hit =
            folded === key ||
            (key.length >= 6 && levenshtein(folded, key) <= 1) ||
            (key.length >= 6 && folded.includes(key));
          if (hit) {
            return { kind: 'brand', brand, imitation: raw !== key && !raw.includes(key) };
          }
        }
      }
    }
  }
  if ([...lower].some((ch) => ch.charCodeAt(0) > 0x7f) || /(^|\.)xn--/.test(lower)) {
    return { kind: 'foreign-script' };
  }
  return undefined;
}