/**
 * Punycode (RFC 3492) decoder. Decode only: this engine reads web addresses, it never writes them.
 * Every function returns its input unchanged when something is wrong, and none of them throws.
 */

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const MAX_LABEL = 256;
const MAX_CODE_POINT = 0x10ffff;

function digitValue(code: number): number {
  if (code >= 0x30 && code <= 0x39) return code - 0x30 + 26; // 0-9
  if (code >= 0x41 && code <= 0x5a) return code - 0x41; // A-Z
  if (code >= 0x61 && code <= 0x7a) return code - 0x61; // a-z
  return BASE;
}

function adapt(delta: number, numPoints: number, first: boolean): number {
  let d = first ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / numPoints);
  let k = 0;
  while (d > ((BASE - T_MIN) * T_MAX) >> 1) {
    d = Math.floor(d / (BASE - T_MIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - T_MIN + 1) * d) / (d + SKEW));
}

/** Decodes the part after "xn--". Returns undefined on any error. */
function decode(input: string): string | undefined {
  if (input.length === 0 || input.length > MAX_LABEL) return undefined;
  const output: number[] = [];
  const basicEnd = input.lastIndexOf('-');
  const basic = basicEnd > 0 ? basicEnd : 0;
  for (let j = 0; j < basic; j += 1) {
    const code = input.charCodeAt(j);
    if (code >= 0x80) return undefined;
    output.push(code);
  }
  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;
  for (let index = basic > 0 ? basic + 1 : 0; index < input.length; ) {
    const oldI = i;
    for (let w = 1, k = BASE; ; k += BASE) {
      if (index >= input.length) return undefined;
      const digit = digitValue(input.charCodeAt(index));
      index += 1;
      if (digit >= BASE) return undefined;
      i += digit * w;
      if (!Number.isSafeInteger(i)) return undefined;
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
      if (!Number.isSafeInteger(w)) return undefined;
    }
    const out = output.length + 1;
    bias = adapt(i - oldI, out, oldI === 0);
    n += Math.floor(i / out);
    i %= out;
    if (n > MAX_CODE_POINT || (n >= 0xd800 && n <= 0xdfff)) return undefined;
    output.splice(i, 0, n);
    i += 1;
  }
  return String.fromCodePoint(...output);
}

/** Decodes one `xn--` label. Labels that are not punycode, or cannot be decoded, come back unchanged. */
export function decodePunycodeLabel(label: string): string {
  try {
    if (!/^xn--/i.test(label)) return label;
    return decode(label.slice(4)) ?? label;
  } catch {
    return label;
  }
}

/** Decodes every `xn--` label of a host. */
export function toUnicodeHost(host: string): string {
  try {
    return host.split('.').map(decodePunycodeLabel).join('.');
  } catch {
    return host;
  }
}

/** True when a label starts with `xn--` but cannot be decoded. */
export function isUndecodableLabel(label: string): boolean {
  return /^xn--/i.test(label) && decodePunycodeLabel(label) === label;
}
