export interface VercelHeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

export interface VercelConfig {
  framework?: string;
  buildCommand?: string;
  outputDirectory?: string;
  headers?: VercelHeaderRule[];
}

export function readVercelConfig(): VercelConfig;
export function sourceToRegExp(source: string): RegExp;
export function headersFor(pathname: string, config?: VercelConfig): [string, string][];
export function responseHeaders(pathname: string, contentType: string, config?: VercelConfig): Record<string, string>;
