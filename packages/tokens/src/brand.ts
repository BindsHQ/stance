/**
 * Brand theming: resolve every Stance colour role from a brand's own colours.
 * Implements specs/brand-theming.md. The maths lives in brand-engine.js, shared with the
 * token build; iOS and Android implement the same recipe from the generated tables.
 */
import { cssColor, normalizeHex, resolveBrand } from './brand-engine.js';
import { contrastRatio } from './contrast.js';
import { brandContrastPairs, brandRecipe, themes as baseThemes } from './generated.js';
import type { Theme, ThemeColors, ThemeName } from './generated.js';
import { tokenPrefix } from './naming.js';

export type { BrandColor, BrandRecipe, RoleRecipe } from './brand-engine.js';

/** A brand to theme Stance with. Colours are `#RGB` or `#RRGGBB` hex strings. */
export interface Brand {
  /** Human name, used in diagnostics and in the generated CSS comment. */
  name: string;
  /** The brand's lightest colour: the light canvas and the foreground on dark surfaces. */
  light: string;
  /** The brand's darkest colour: text, the default accent and the dark canvas. */
  dark: string;
  /**
   * Optional colour for primary actions, selection, links and focus. One colour serves every
   * theme; `{ light, dark }` gives the dark theme its own (high contrast uses `light`). Stance
   * adjusts its lightness where needed so every contrast check passes. Without it the accent is
   * `dark` in the light themes and `light` in the dark theme.
   */
  accent?: string | { light: string; dark: string };
}

/**
 * The default Stance palette, Binds Ivory and Indigo. Passing it is the same as passing no
 * brand.
 */
export const bindsBrand: Readonly<Brand> = Object.freeze({
  name: 'Binds',
  light: '#FCF6EB',
  dark: '#140C2E',
});

/** One role pair whose contrast is below the minimum the token tests require. */
export interface BrandContrastFailure {
  theme: ThemeName;
  fg: keyof ThemeColors;
  bg: keyof ThemeColors;
  /** Measured WCAG 2 contrast ratio, rounded to two decimals. */
  ratio: number;
  /** Minimum ratio for this pair in this theme. */
  required: number;
}

export interface BrandTheme {
  /**
   * A stylesheet overriding the `--st-color-*` variables for every theme selector that
   * `@bindshq/stance-tokens/css` uses. Load it after the token stylesheet.
   */
  css: string;
  /** The three themes with the brand applied, in the shape of the exported `themes`. */
  themes: Record<ThemeName, Theme>;
  /** Pairs that fail their contrast minimum. Empty when the brand passes every check. */
  report: BrandContrastFailure[];
}

export interface BrandThemeOptions {
  /**
   * Scope the variables to elements matching this selector instead of the whole document,
   * for example `[data-brand='acme']`. Themes set on <html> and nested `data-theme` elements
   * inside the scope both follow the brand.
   */
  scope?: string;
}

const P = tokenPrefix;
const THEME_NAMES: readonly ThemeName[] = ['light', 'dark', 'high-contrast'];

function brandError(brand: Brand, message: string): never {
  throw new TypeError(`Stance brand${brand?.name ? ` "${brand.name}"` : ''}: ${message}`);
}

/** Validates a brand and returns it with normalised `#RRGGBB` colours. */
export function normalizeBrand(brand: Brand): Brand {
  if (!brand || typeof brand !== 'object') brandError(brand, 'expected an object');
  const hex = (key: string, value: unknown) => {
    try {
      return normalizeHex(String(value));
    } catch {
      return brandError(brand, `${key} must be a #RGB or #RRGGBB colour, got ${value}`);
    }
  };
  const accent = brand.accent;
  return {
    name: brand.name ? String(brand.name) : 'Brand',
    light: hex('light', brand.light),
    dark: hex('dark', brand.dark),
    ...(!accent
      ? {}
      : typeof accent === 'string'
        ? { accent: hex('accent', accent) }
        : {
            accent: {
              light: hex('accent.light', accent.light),
              dark: hex('accent.dark', accent.dark),
            },
          }),
  };
}

/** True when the brand is the Binds palette with no accent. */
export function isBindsBrand(brand: Brand): boolean {
  try {
    const b = normalizeBrand(brand);
    return !b.accent && b.light === bindsBrand.light && b.dark === bindsBrand.dark;
  } catch {
    return false;
  }
}

const declarations = (vars: [string, string][], indent: string) =>
  vars.map(([k, v]) => `${indent}--${P}-${k}: ${v};`).join('\n');

const block = (selectors: string[], body: string, indent = '') =>
  `${indent}${selectors.join(`,\n${indent}`)} {\n${body}\n${indent}}`;

/**
 * Resolves a brand into Stance's three themes (specs/brand-theming.md).
 *
 * ```ts
 * const { css, report } = createBrandTheme({ name: 'Acme', light: '#F7F5F0', dark: '#1D2A3A' });
 * ```
 *
 * Throws a `TypeError` for colours that are not hex. Contrast problems never throw: they are
 * listed in `report` so build tools can decide whether to fail.
 */
export function createBrandTheme(brand: Brand, options: BrandThemeOptions = {}): BrandTheme {
  const b = normalizeBrand(brand);
  const resolved = resolveBrand(brandRecipe, b);

  const themes = Object.fromEntries(
    THEME_NAMES.map((name) => {
      const base: Theme = baseThemes[name];
      const roles = resolved.themes[name] ?? {};
      const colors = Object.fromEntries(
        Object.keys(base.colors).map((role) => {
          const c = roles[role];
          return [role, c ? cssColor(c) : base.colors[role as keyof ThemeColors]];
        }),
      ) as unknown as ThemeColors;
      return [name, { ...base, colors, effects: { ...base.effects } } satisfies Theme];
    }),
  ) as Record<ThemeName, Theme>;

  const report: BrandContrastFailure[] = [];
  for (const name of THEME_NAMES) {
    const roles = resolved.themes[name] ?? {};
    for (const { fg, bg, min, highContrastMin } of brandContrastPairs) {
      const required = name === 'high-contrast' ? highContrastMin : min;
      const ratio = contrastRatio(roles[fg]?.hex ?? '#000', roles[bg]?.hex ?? '#000');
      if (ratio < required)
        report.push({ theme: name, fg, bg, ratio: Math.round(ratio * 100) / 100, required });
    }
  }

  const scale: [string, string][] = [
    ['color-brand-ivory', b.light],
    ['color-brand-indigo', b.dark],
    ...Object.entries(resolved.ink).map(([k, v]): [string, string] => [`color-ink-${k}`, v]),
  ];
  const colorVars = (name: ThemeName) =>
    Object.entries(themes[name].colors).map(([k, v]): [string, string] => [`color-${k}`, v]);
  const t = (name: ThemeName) => `[data-theme='${name}']`;
  const scope = options.scope?.trim();
  const header = `/* Stance brand theme "${b.name.replace(/\*\//g, '')}", generated by @bindshq/stance-tokens. Load after the Stance token stylesheet. */`;

  let css: string;
  if (!scope) {
    css = [
      header,
      block([':root'], declarations(scale, '  ')),
      block([':root', t('light')], declarations(colorVars('light'), '  ')),
      block([t('dark')], declarations(colorVars('dark'), '  ')),
      block([t('high-contrast')], declarations(colorVars('high-contrast'), '  ')),
      `/* Follow the operating system when no theme is set. */\n@media (prefers-color-scheme: dark) {\n${block([':root:not([data-theme])'], declarations(colorVars('dark'), '    '), '  ')}\n}`,
      `@media (prefers-contrast: more) {\n${block([':root:not([data-theme])'], declarations(colorVars('high-contrast'), '    '), '  ')}\n}`,
    ].join('\n\n');
  } else {
    const within = (name: ThemeName) => [`:root${t(name)} ${scope}`, `${scope} ${t(name)}`];
    css = [
      header,
      block([scope], declarations([...scale, ...colorVars('light')], '  ')),
      block(within('light'), declarations(colorVars('light'), '  ')),
      block(within('dark'), declarations(colorVars('dark'), '  ')),
      block(within('high-contrast'), declarations(colorVars('high-contrast'), '  ')),
      `@media (prefers-color-scheme: dark) {\n${block([`:root:not([data-theme]) ${scope}`], declarations(colorVars('dark'), '    '), '  ')}\n}`,
      `@media (prefers-contrast: more) {\n${block([`:root:not([data-theme]) ${scope}`], declarations(colorVars('high-contrast'), '    '), '  ')}\n}`,
    ].join('\n\n');
  }

  return { css: `${css}\n`, themes, report };
}

/** Formats a contrast report as short readable lines, one per failing pair. */
export function formatBrandReport(report: readonly BrandContrastFailure[]): string[] {
  return report.map((f) => `${f.theme}: ${f.fg} on ${f.bg} is ${f.ratio}:1, needs ${f.required}:1`);
}
