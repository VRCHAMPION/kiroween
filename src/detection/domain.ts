import { getData } from './data-loader';
import { fallbackSuffixLabelCount } from './domain-fallback';

export interface ParsedDomain {
  /** The host as given, lower-cased, without a trailing dot. */
  host: string;
  /** The part an organisation registers, such as "secure-login.xyz". The host itself for IPs and hosts with no public ending. */
  registrable: string;
  /** The registrable domain without its public ending, such as "secure-login". */
  name: string;
  /** The public ending, such as "co.in". Empty when there is none. */
  suffix: string;
  /** Everything in front of the registrable domain, such as "paypal.com". */
  subdomain: string;
  isIp: boolean;
}

export function isIpHost(host: string): boolean {
  if (/^\[[0-9a-f:.]+\]$/i.test(host)) {
    return true;
  }
  const parts = host.split('.');
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

function fallbackParse(host: string): ParsedDomain {
  const labels = host.split('.');
  const suffixCount = fallbackSuffixLabelCount(labels);
  if (labels.length <= suffixCount) {
    return { host, registrable: host, name: host, suffix: '', subdomain: '', isIp: false };
  }
  const registrableLabels = labels.slice(-(suffixCount + 1));
  return {
    host,
    registrable: registrableLabels.join('.'),
    name: registrableLabels[0],
    suffix: labels.slice(-suffixCount).join('.'),
    subdomain: labels.slice(0, -(suffixCount + 1)).join('.'),
    isIp: false,
  };
}

/**
 * Splits a host into its registrable domain, public ending and subdomain.
 * Uses the Public Suffix List once the detection data has loaded and a small table before that.
 * Never throws. The host stays in the form it was given (Unicode or `xn--`).
 */
export function parseDomain(input: string): ParsedDomain {
  const host = String(input).trim().toLowerCase().replace(/\.+$/, '');
  try {
    if (host === '' || isIpHost(host)) {
      return { host, registrable: host, name: host, suffix: '', subdomain: '', isIp: host !== '' };
    }
    const data = getData();
    if (!data) {
      return fallbackParse(host);
    }
    const r = data.parse(host);
    if (!r.domain || !r.publicSuffix) {
      return { host, registrable: host, name: host, suffix: r.publicSuffix ?? '', subdomain: '', isIp: false };
    }
    const name = r.domain.slice(0, Math.max(0, r.domain.length - r.publicSuffix.length - 1));
    return { host, registrable: r.domain, name, suffix: r.publicSuffix, subdomain: r.subdomain ?? '', isIp: false };
  } catch {
    return { host, registrable: host, name: host, suffix: '', subdomain: '', isIp: false };
  }
}
