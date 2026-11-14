import {
  bindsBrand,
  createBrandTheme,
  formatBrandReport,
  isBindsBrand,
  type Brand,
} from '@bindshq/stance-tokens';

export { bindsBrand, type Brand };

// Bundlers replace `process.env.NODE_ENV` at build time; without one, `process` may not exist.
declare const process: { env: { NODE_ENV?: string } };

export function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV === 'development';
  } catch {
    return false;
  }
}

/** Brands whose contrast report has been logged, so each is reported once. */
const reported = new Set<string>();

/** Short stable hash, so the scope is the same on the server and the client. */
function hash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

export interface BrandStyles {
  scope: string;
  css: string;
}

/**
 * Resolves a brand into CSS scoped to `[data-stance-brand='<key>']`. Returns `null` for the
 * default palette, which the token stylesheet already provides, or for an invalid brand.
 */
export function brandStyles(brand: Brand | 'binds' | undefined): BrandStyles | null {
  if (!brand || brand === 'binds' || isBindsBrand(brand)) return null;
  try {
    const key = `b${hash(`${brand.light}|${brand.dark}|${JSON.stringify(brand.accent ?? '')}`.toLowerCase())}`;
    const { css, report } = createBrandTheme(brand, { scope: `[data-stance-brand='${key}']` });
    if (isDevelopment() && report.length && !reported.has(key)) {
      reported.add(key);
      console.warn(
        `Stance brand "${brand.name}" has ${report.length} contrast ${report.length === 1 ? 'issue' : 'issues'}:\n  ${formatBrandReport(report).join('\n  ')}`,
      );
    }
    return { scope: key, css };
  } catch (error) {
    if (isDevelopment()) console.error(error);
    return null;
  }
}
