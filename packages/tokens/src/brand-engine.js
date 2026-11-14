// @ts-check
// Brand engine: OKLab colour maths and the role resolver behind brand theming.
//
// Plain JavaScript with JSDoc types so that the token build (scripts/build-tokens.mjs, which
// runs in Node without a TypeScript step) and the published TypeScript API share one
// implementation. iOS and Android implement the same steps from the generated recipe tables;
// see specs/brand-theming.md and generated/json/brand-recipe.json.

/** @typedef {[number, number, number]} Triple */

/**
 * A resolved colour: an uppercase `#RRGGBB` hex and an alpha from 0 to 1.
 * @typedef {{ hex: string, alpha: number }} BrandColor
 */

/**
 * One step of a role recipe. Every semantic colour role in every theme is exactly one of these.
 *
 * - `light`, `dark`: the brand pair.
 * - `ink`: a step of the neutral scale built from the brand pair.
 * - `literal`: a fixed colour that does not depend on the brand (status colours).
 * - `derive`: `from` mixed in OKLab toward `toward` by `amount`, then given `alpha`.
 * - `accentFit`: when the brand has an accent, the theme's starting accent with its OKLab
 *   lightness fitted until it meets `min` contrast (see `fitAccent`); otherwise `fallback`.
 *   `use: 'text' | 'ring'` fits against the resolved roles in `against`, moving toward
 *   `toward`. `use: 'fill'` first picks the foreground (`light` or `dark`, higher contrast on
 *   the starting accent, `light` wins a tie) and fits against that colour, moving away from it.
 * - `accentShade`: when the brand has an accent, the resolved role `of` mixed in OKLab by
 *   `amount` toward the brand colour (`light` or `dark`) that is not the resolved role
 *   `awayFrom`; otherwise `fallback`.
 * - `accentForeground`: `light` or `dark`, whichever has the higher WCAG contrast on the
 *   resolved role named by `on` (`light` wins a tie).
 *
 * @typedef {{ kind: 'light' }
 *   | { kind: 'dark' }
 *   | { kind: 'ink', step: string }
 *   | { kind: 'literal', hex: string, alpha: number }
 *   | { kind: 'derive', from: 'light' | 'dark', toward: 'white' | 'black' | 'light' | 'dark' | null, amount: number, alpha: number }
 *   | { kind: 'accentFit', use: 'text' | 'ring' | 'fill', against: string[], min: number, toward: 'black' | 'white' | null, fallback: RoleRecipe }
 *   | { kind: 'accentShade', of: string, awayFrom: string, amount: number, fallback: RoleRecipe }
 *   | { kind: 'accentForeground', on: string }} RoleRecipe
 */

/**
 * The machine-readable recipe the token build generates from the token source.
 * @typedef {{
 *   version: number,
 *   ink: { step: string, t: number }[],
 *   themes: { name: string, colorScheme: 'light' | 'dark', accent: 'light' | 'dark', roles: Record<string, RoleRecipe> }[],
 * }} BrandRecipe
 */

/**
 * The inputs of a brand. Colours are `#RGB` or `#RRGGBB` hex strings. A single accent is the
 * starting colour in every theme; `{ light, dark }` gives the dark theme its own starting colour
 * (the light and high contrast themes use `light`). Each theme's recipe names which one it uses.
 * @typedef {{ name: string, light: string, dark: string, accent?: string | { light: string, dark: string } | undefined }} BrandInput
 */

/**
 * @typedef {{
 *   ink: Record<string, string>,
 *   themes: Record<string, Record<string, BrandColor>>,
 * }} ResolvedBrand
 */

// ───────────────────────── sRGB ─────────────────────────

/**
 * Parses `#RGB` or `#RRGGBB` (case insensitive, leading `#` optional) into 0 to 255 channels.
 * @param {string} hex
 * @returns {Triple}
 */
export function hexToRgb(hex) {
  const h = String(hex).trim().replace(/^#/, '');
  const full = /^[0-9a-f]{3}$/i.test(h)
    ? h
        .split('')
        .map((x) => x + x)
        .join('')
    : h;
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(full)) throw new Error(`Invalid hex colour: ${hex}`);
  const n = Number.parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Normalises any accepted hex form to uppercase `#RRGGBB`.
 * @param {string} hex
 */
export function normalizeHex(hex) {
  return rgbToHex(hexToRgb(hex));
}

/**
 * Formats 0 to 255 channels as uppercase `#RRGGBB`. Channels are clamped and rounded half up.
 * @param {Triple} rgb
 */
export function rgbToHex(rgb) {
  return (
    '#' +
    rgb
      .map((c) =>
        Math.round(Math.min(255, Math.max(0, c)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .toUpperCase()
  );
}

/** @param {number} c 0 to 1 encoded */
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
/** @param {number} c 0 to 1 linear */
const toEncoded = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

// ───────────────────────── OKLab ─────────────────────────

/**
 * Converts a hex colour to OKLab (Björn Ottosson's 2020 matrices).
 * @param {string} hex
 * @returns {Triple} `[L, a, b]`
 */
export function hexToOklab(hex) {
  const [r, g, b] = /** @type {Triple} */ (hexToRgb(hex).map((c) => toLinear(c / 255)));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * Converts OKLab to a hex colour, clamping out of gamut channels and rounding to 8 bits.
 * @param {Triple} lab
 */
export function oklabToHex([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgbToHex(
    /** @type {Triple} */ (lin.map((c) => toEncoded(Math.min(1, Math.max(0, c))) * 255)),
  );
}

/**
 * Linear interpolation in OKLab: `t = 0` returns `from`, `t = 1` returns `to`.
 * @param {string} from hex
 * @param {string} to hex
 * @param {number} t 0 to 1
 */
export function mixOklab(from, to, t) {
  const a = hexToOklab(from);
  const b = hexToOklab(to);
  return oklabToHex(/** @type {Triple} */ (a.map((v, i) => v + ((b[i] ?? 0) - v) * t)));
}

// ───────────────────────── WCAG contrast ─────────────────────────

/**
 * WCAG 2.x relative luminance of an sRGB hex colour.
 * @param {string} hex
 */
export function luminance(hex) {
  const [r, g, b] = /** @type {Triple} */ (hexToRgb(hex).map((c) => toLinear(c / 255)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2.x contrast ratio between two hex colours, from 1 to 21.
 * @param {string} a
 * @param {string} b
 */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

// ───────────────────────── accent fitting ─────────────────────────

/** Number of bisection steps in `fitAccent`. Part of the cross platform contract. */
export const FIT_ITERATIONS = 32;

/**
 * Fits the OKLab lightness of `start` so that it meets `min` WCAG contrast against every colour
 * in `against`, keeping OKLab a and b.
 *
 * 1. Every candidate is converted to 8 bit hex (clamped and rounded as in `oklabToHex`) before
 *    its contrast is measured.
 * 2. If `start` passes, it is returned unchanged.
 * 3. Otherwise L moves toward `targetL` (0 for black, 1 for white). If L = `targetL` fails too,
 *    that colour is returned.
 * 4. Otherwise bisect with exactly `FIT_ITERATIONS` steps: `lo` = start L (failing),
 *    `hi` = `targetL` (passing); `mid = (lo + hi) / 2`; a passing `mid` becomes `hi`, a failing
 *    one becomes `lo`. The result is the colour at `hi`: the passing lightness found closest to
 *    the start.
 *
 * @param {string} start hex
 * @param {string[]} against hex colours
 * @param {number} min
 * @param {0 | 1} targetL
 * @returns {string} hex
 */
export function fitAccent(start, against, min, targetL) {
  /** @param {string} hex */
  const passes = (hex) => against.every((bg) => contrastRatio(hex, bg) >= min);
  const startHex = normalizeHex(start);
  if (passes(startHex)) return startHex;
  const [L, A, B] = hexToOklab(startHex);
  /** @param {number} l */
  const at = (l) => oklabToHex([l, A, B]);
  if (!passes(at(targetL))) return at(targetL);
  let lo = L;
  /** @type {number} */
  let hi = targetL;
  for (let i = 0; i < FIT_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    if (passes(at(mid))) hi = mid;
    else lo = mid;
  }
  return at(hi);
}

// ───────────────────────── resolver ─────────────────────────

const WHITE = '#FFFFFF';
const BLACK = '#000000';

/**
 * Builds the neutral ink scale for a brand pair.
 * @param {BrandRecipe} recipe
 * @param {string} light hex
 * @param {string} dark hex
 * @returns {Record<string, string>} step to hex
 */
export function inkScale(recipe, light, dark) {
  return Object.fromEntries(recipe.ink.map(({ step, t }) => [step, mixOklab(light, dark, t)]));
}

/**
 * Resolves every role of every theme in the recipe for a brand.
 * @param {BrandRecipe} recipe
 * @param {BrandInput} brand
 * @returns {ResolvedBrand}
 */
export function resolveBrand(recipe, brand) {
  const light = normalizeHex(brand.light);
  const dark = normalizeHex(brand.dark);
  const accents = !brand.accent
    ? undefined
    : typeof brand.accent === 'string'
      ? { light: normalizeHex(brand.accent), dark: normalizeHex(brand.accent) }
      : { light: normalizeHex(brand.accent.light), dark: normalizeHex(brand.accent.dark) };
  const ink = inkScale(recipe, light, dark);
  /** @type {Record<string, string>} */
  const named = { light, dark, white: WHITE, black: BLACK };
  /** @type {Record<string, Record<string, BrandColor>>} */
  const themes = {};
  for (const theme of recipe.themes) {
    const accent = accents?.[theme.accent];
    /** @type {Record<string, BrandColor>} */
    const out = {};
    /** @param {string} role */
    const role = (role) => {
      const cached = out[role];
      if (cached) return cached;
      const recipeFor = theme.roles[role];
      if (!recipeFor) throw new Error(`Unknown role ${role} in theme ${theme.name}`);
      return (out[role] = step(recipeFor));
    };
    /**
     * @param {RoleRecipe} r
     * @returns {BrandColor}
     */
    const step = (r) => {
      switch (r.kind) {
        case 'light':
          return { hex: light, alpha: 1 };
        case 'dark':
          return { hex: dark, alpha: 1 };
        case 'ink': {
          const hex = ink[r.step];
          if (!hex) throw new Error(`Unknown ink step ${r.step}`);
          return { hex, alpha: 1 };
        }
        case 'literal':
          return { hex: normalizeHex(r.hex), alpha: r.alpha };
        case 'derive': {
          const from = /** @type {string} */ (named[r.from]);
          const hex = r.toward
            ? mixOklab(from, /** @type {string} */ (named[r.toward]), r.amount)
            : from;
          return { hex, alpha: r.alpha };
        }
        case 'accentFit': {
          if (!accent) return step(r.fallback);
          if (r.use === 'fill') {
            const fg = contrastRatio(light, accent) >= contrastRatio(dark, accent) ? light : dark;
            const targetL = luminance(fg) > luminance(accent) ? 0 : 1;
            return { hex: fitAccent(accent, [fg], r.min, targetL), alpha: 1 };
          }
          const against = r.against.map((name) => role(name).hex);
          return { hex: fitAccent(accent, against, r.min, r.toward === 'white' ? 1 : 0), alpha: 1 };
        }
        case 'accentShade': {
          if (!accent) return step(r.fallback);
          const toward = role(r.awayFrom).hex === light ? dark : light;
          return { hex: mixOklab(role(r.of).hex, toward, r.amount), alpha: 1 };
        }
        case 'accentForeground': {
          const on = role(r.on).hex;
          return {
            hex: contrastRatio(light, on) >= contrastRatio(dark, on) ? light : dark,
            alpha: 1,
          };
        }
        default:
          throw new Error(`Unknown recipe kind ${JSON.stringify(r)}`);
      }
    };
    for (const name of Object.keys(theme.roles)) role(name);
    // Keep the recipe's role order regardless of resolution order.
    themes[theme.name] = Object.fromEntries(
      Object.keys(theme.roles).map((name) => [name, /** @type {BrandColor} */ (out[name])]),
    );
  }
  return { ink, themes };
}

/**
 * Formats a resolved colour for CSS: hex when opaque, `rgba()` otherwise.
 * Matches the formatting of the published tokens.css.
 * @param {BrandColor} c
 */
export function cssColor(c) {
  if (c.alpha === 1) return c.hex;
  return `rgba(${hexToRgb(c.hex).join(', ')}, ${String(+c.alpha.toFixed(4))})`;
}
