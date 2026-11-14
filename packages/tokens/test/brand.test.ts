import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as tokens from '../src';
import { runBrandCli } from '../src/brand-cli';
import { fitAccent, normalizeHex, resolveBrand } from '../src/brand-engine.js';
import { brandRecipe } from '../src/generated';

const dir = join(import.meta.dirname, '..', 'generated', 'json');
const resolved = JSON.parse(readFileSync(join(dir, 'tokens.resolved.json'), 'utf8'));
const recipeJson = JSON.parse(readFileSync(join(dir, 'brand-recipe.json'), 'utf8'));
const fixture = JSON.parse(readFileSync(join(dir, 'brand-fixture.json'), 'utf8')) as {
  brands: {
    brand: tokens.Brand;
    ink: Record<string, string>;
    themes: Record<string, Record<string, tokens.BrandColor>>;
    contrastFailures: tokens.BrandContrastFailure[];
  }[];
};
const themeNames = ['light', 'dark', 'high-contrast'] as const;
type Published = { value: { hex: string; alpha: number } };

const channels = (hex: string) => tokens.hexToRgb(hex);
const maxDelta = (a: string, b: string) =>
  Math.max(...channels(a).map((c, i) => Math.abs(c - channels(b)[i]!)));

describe('the Binds pair reproduces the published tokens', () => {
  const binds = resolveBrand(brandRecipe, tokens.bindsBrand);

  it('rebuilds the ink scale exactly from the positions in the source', () => {
    expect(binds.ink).toEqual(tokens.ink);
  });

  for (const theme of themeNames) {
    it(`resolves every ${theme} role (derived literals within 1/255)`, () => {
      const roles = Object.entries(resolved.themes[theme] as Record<string, Published>).filter(
        ([k]) => k.startsWith('color.'),
      );
      expect(Object.keys(binds.themes[theme]!)).toHaveLength(roles.length);
      for (const [key, { value }] of roles) {
        const role = key.slice('color.'.length);
        const got = binds.themes[theme]![role]!;
        const kind = brandRecipe.themes.find((t) => t.name === theme)!.roles[role]!.kind;
        expect(got.alpha, `${theme} ${role} alpha`).toBe(value.alpha);
        expect(maxDelta(got.hex, value.hex), `${theme} ${role}`).toBeLessThanOrEqual(
          kind === 'derive' ? 1 : 0,
        );
      }
    });
  }

  it('createBrandTheme(bindsBrand) passes every contrast check', () => {
    expect(tokens.createBrandTheme(tokens.bindsBrand).report).toEqual([]);
  });

  it('only the derived literals differ, and by at most one step per channel', () => {
    const differing: string[] = [];
    for (const theme of themeNames)
      for (const [role, c] of Object.entries(binds.themes[theme]!))
        if (c.hex !== (resolved.themes[theme][`color.${role}`] as Published).value.hex)
          differing.push(`${theme} ${role}`);
    expect(differing.sort()).toEqual(
      ['dark bg-scrim', 'light bg-overlay', 'light bg-surface', 'light bg-surface-raised'].sort(),
    );
  });
});

describe('shared fixture', () => {
  it('holds the Binds pair and three reference brands with accents', () => {
    expect(fixture.brands.map((b) => b.brand.name)).toEqual([
      'Binds',
      'Harbour',
      'Sage',
      'Graphite',
    ]);
    expect(fixture.brands.slice(1).every((b) => b.brand.accent)).toBe(true);
  });

  it('every fixture brand passes every contrast check in every theme', () => {
    for (const entry of fixture.brands)
      expect(entry.contrastFailures, entry.brand.name).toEqual([]);
  });

  for (const entry of fixture.brands) {
    it(`${entry.brand.name}: createBrandTheme matches the fixture`, () => {
      const { themes, report } = tokens.createBrandTheme(entry.brand);
      for (const theme of themeNames)
        for (const [role, c] of Object.entries(entry.themes[theme]!))
          expect(themes[theme].colors[role as keyof tokens.ThemeColors], `${theme} ${role}`).toBe(
            c.alpha === 1
              ? c.hex
              : `rgba(${tokens.hexToRgb(c.hex).join(', ')}, ${String(+c.alpha.toFixed(4))})`,
          );
      expect(report).toEqual(entry.contrastFailures);
      expect(resolveBrand(brandRecipe, entry.brand).ink).toEqual(entry.ink);
    });
  }

  it('the JSON recipe matches the recipe compiled into the package', () => {
    expect(recipeJson.ink).toEqual(brandRecipe.ink);
    expect(recipeJson.themes).toEqual(brandRecipe.themes);
  });
});

describe('reference brands', () => {
  const harbour = { name: 'Harbour', light: '#F2F8FF', dark: '#0A1A50', accent: '#FF5A36' };
  const sage = {
    name: 'Sage',
    light: '#F4F2EC',
    dark: '#171D1A',
    accent: { light: '#5E7361', dark: '#8FA892' },
  };

  it('maps the brand pair onto canvas, text and the ink scale', () => {
    const { themes } = tokens.createBrandTheme(sage);
    expect(themes.light.colors['bg-canvas']).toBe('#F4F2EC');
    expect(themes.light.colors['fg-default']).toBe('#171D1A');
    expect(themes.dark.colors['bg-canvas']).toBe('#171D1A');
    expect(themes.dark.colors['fg-default']).toBe('#F4F2EC');
    // The ink scale runs monotonically from light to dark.
    const lums = Object.values(resolveBrand(brandRecipe, sage).ink).map(tokens.luminance);
    for (let i = 1; i < lums.length; i++) expect(lums[i]).toBeLessThan(lums[i - 1]!);
  });

  it('keeps status colours literal', () => {
    const a = tokens.createBrandTheme(harbour).themes;
    for (const theme of themeNames)
      for (const role of ['danger-fg', 'success-fg', 'warning-fg', 'danger-border'] as const)
        expect(a[theme].colors[role]).toBe(tokens.themes[theme].colors[role]);
  });

  it('derives surfaces, scrims and interactive washes from the pair', () => {
    const { themes } = tokens.createBrandTheme(harbour);
    expect(themes.light.colors['bg-surface']).toBe(tokens.mixOklab('#F2F8FF', '#FFFFFF', 0.55));
    expect(themes.light.colors['bg-scrim']).toBe('rgba(10, 26, 80, 0.48)');
    expect(themes.light.colors['interactive-hover']).toBe('rgba(10, 26, 80, 0.06)');
    expect(themes.dark.colors['interactive-hover']).toBe('rgba(242, 248, 255, 0.07)');
    const scrim = tokens.mixOklab('#0A1A50', '#000000', 0.405);
    expect(themes.dark.colors['bg-scrim']).toBe(`rgba(${tokens.hexToRgb(scrim).join(', ')}, 0.64)`);
  });
});

describe('accent', () => {
  const base = { name: 'Plain', light: '#F7F5F0', dark: '#1D2A3A' };

  it('defaults to dark in the light themes and light in the dark theme', () => {
    const { themes } = tokens.createBrandTheme(base);
    expect(themes.light.colors['accent-bg']).toBe('#1D2A3A');
    expect(themes['high-contrast'].colors['accent-bg']).toBe('#1D2A3A');
    expect(themes.dark.colors['accent-bg']).toBe('#F7F5F0');
    expect(themes.light.colors['accent-fg']).toBe('#F7F5F0');
    expect(themes.dark.colors['accent-fg']).toBe('#1D2A3A');
  });

  it('uses an accent unchanged where it already passes', () => {
    // #2357D9 reads at 4.5:1 or more on these light canvases, and white text passes on it.
    const accent = '#2357D9';
    const { themes } = tokens.createBrandTheme({ ...base, accent });
    for (const role of ['accent-bg', 'focus-ring', 'fg-link'] as const)
      expect(themes.light.colors[role], role).toBe(accent);
    expect(themes.light.colors['accent-fg']).toBe('#F7F5F0');
  });

  it('fits lightness, keeping hue, until every accent pair passes', () => {
    const accent = '#7A7A7A';
    const { themes, report } = tokens.createBrandTheme({ ...base, dark: '#101B2D', accent });
    expect(report).toEqual([]);
    // Text darkens on light canvases and lightens on dark ones.
    const L = (hex: string) => tokens.hexToOklab(hex)[0];
    expect(L(themes.light.colors['fg-link'])).toBeLessThan(L(accent));
    expect(L(themes.dark.colors['fg-link'])).toBeGreaterThan(L(accent));
    const [, a, b] = tokens.hexToOklab(accent);
    const [, a2, b2] = tokens.hexToOklab(themes.light.colors['fg-link']);
    expect(Math.abs(a2 - a)).toBeLessThan(0.01);
    expect(Math.abs(b2 - b)).toBeLessThan(0.01);
  });

  it('finds the passing lightness closest to the start', () => {
    const canvas = '#F7F5F0';
    const fitted = fitAccent('#7A7A7A', [canvas], 4.5, 0);
    expect(tokens.contrastRatio(fitted, canvas)).toBeGreaterThanOrEqual(4.5);
    // One 8 bit step lighter fails.
    const [r] = tokens.hexToRgb(fitted);
    const lighter = normalizeHex(
      `#${[r + 1, r + 1, r + 1].map((c) => c.toString(16).padStart(2, '0')).join('')}`,
    );
    expect(tokens.contrastRatio(lighter, canvas)).toBeLessThan(4.5);
  });

  it('shades hover and active from the fitted fill, away from the foreground', () => {
    const accent = '#2357D9';
    const { themes } = tokens.createBrandTheme({ ...base, accent });
    const fill = themes.light.colors['accent-bg'];
    expect(themes.light.colors['accent-bg-hover']).toBe(tokens.mixOklab(fill, '#1D2A3A', 0.15));
    expect(themes.light.colors['accent-bg-active']).toBe(tokens.mixOklab(fill, '#1D2A3A', 0.3));
    // A light accent takes dark text, so its shades move toward the light colour.
    const yellow = tokens.createBrandTheme({ ...base, accent: '#FFC94D' }).themes.light.colors;
    expect(yellow['accent-fg']).toBe('#1D2A3A');
    expect(yellow['accent-bg-hover']).toBe(tokens.mixOklab(yellow['accent-bg'], '#F7F5F0', 0.15));
  });

  it('gives the dark theme its own accent, and high contrast the light one', () => {
    const { themes } = tokens.createBrandTheme({
      ...base,
      accent: { light: '#2357D9', dark: '#8FB0FF' },
    });
    expect(themes.light.colors['accent-bg']).toBe('#2357D9');
    expect(themes.dark.colors['accent-bg']).toBe('#8FB0FF');
    expect(tokens.hexToOklab(themes['high-contrast'].colors['accent-bg'])[1]).toBeCloseTo(
      tokens.hexToOklab('#2357D9')[1],
      1,
    );
  });

  it('keeps high contrast links and selection on the brand pair', () => {
    const { themes } = tokens.createBrandTheme({ ...base, accent: '#FF5A36' });
    expect(themes['high-contrast'].colors['fg-link']).toBe('#1D2A3A');
    expect(themes['high-contrast'].colors['interactive-selected-fg']).toBe('#F7F5F0');
  });

  it('passes every check for awkward accents', () => {
    for (const accent of [
      '#7A7A7A',
      '#FFFF00',
      '#00FFFF',
      '#FF00FF',
      '#000000',
      '#FFFFFF',
      '#808080',
    ])
      expect(tokens.createBrandTheme({ ...base, dark: '#101B2D', accent }).report, accent).toEqual(
        [],
      );
  });

  it('picks the foreground with the higher contrast on the accent', () => {
    expect(
      tokens.createBrandTheme({ ...base, accent: '#2357D9' }).themes.light.colors['accent-fg'],
    ).toBe('#F7F5F0');
    expect(
      tokens.createBrandTheme({ ...base, accent: '#FFC94D' }).themes.light.colors['accent-fg'],
    ).toBe('#1D2A3A');
  });
});

describe('contrast report', () => {
  it('flags a deliberately poor pair', () => {
    const { report } = tokens.createBrandTheme({ name: 'Fog', light: '#DDDDDD', dark: '#999999' });
    expect(report.length).toBeGreaterThan(10);
    const first = report.find((f) => f.theme === 'light' && f.fg === 'fg-default');
    expect(first).toMatchObject({ bg: 'bg-canvas', required: 4.5 });
    expect(first!.ratio).toBeLessThan(4.5);
    expect(report.some((f) => f.theme === 'high-contrast' && f.required === 7)).toBe(true);
    expect(tokens.formatBrandReport(report)[0]).toMatch(/^light: fg-default on bg-canvas is /);
  });

  it('rejects colours that are not hex', () => {
    expect(() => tokens.createBrandTheme({ name: 'X', light: 'ivory', dark: '#000' })).toThrow(
      /light must be a #RGB or #RRGGBB colour/,
    );
  });
});

describe('CSS output', () => {
  const { css, themes } = tokens.createBrandTheme({
    name: 'Acme',
    light: '#F7F5F0',
    dark: '#1D2A3A',
  });
  const publishedPath = join(import.meta.dirname, '..', 'dist', 'css', 'tokens.css');
  const published = existsSync(publishedPath) ? readFileSync(publishedPath, 'utf8') : '';
  const selectors = (text: string) =>
    [...text.matchAll(/^\s*([^{}\n/@][^{}\n]*?)\s*[,{]\s*$/gm)].map((m) => m[1]!.trim());

  it('overrides the same theme selectors the token stylesheet and ThemeScript use', () => {
    for (const selector of [
      ':root',
      "[data-theme='light']",
      "[data-theme='dark']",
      "[data-theme='high-contrast']",
      ':root:not([data-theme])',
    ])
      expect(selectors(css), selector).toContain(selector);
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('@media (prefers-contrast: more)');
    // Every selector the published stylesheet uses for a theme is covered.
    for (const s of selectors(published)) expect(selectors(css)).toContain(s);
  });

  it('declares every colour role and the scale variables', () => {
    for (const role of Object.keys(themes.light.colors))
      expect(css).toContain(`--st-color-${role}: `);
    expect(css).toContain('--st-color-brand-ivory: #F7F5F0;');
    expect(css).toContain('--st-color-ink-500: ');
    expect(css).not.toMatch(/--st-shadow|--st-font/);
  });

  it('scopes to a selector when asked', () => {
    const scoped = tokens.createBrandTheme(
      { name: 'Acme', light: '#F7F5F0', dark: '#1D2A3A' },
      { scope: "[data-brand='acme']" },
    ).css;
    expect(scoped).toContain("[data-brand='acme'] {");
    expect(scoped).toContain(":root[data-theme='dark'] [data-brand='acme'],");
    expect(scoped).toContain("[data-brand='acme'] [data-theme='dark'] {");
    expect(scoped).toContain(":root:not([data-theme]) [data-brand='acme'] {");
    expect(scoped).not.toMatch(/^:root,?\s*$/m);
  });
});

describe('stance-brand CLI', () => {
  const run = (...args: string[]) => {
    const io = { out: '', err: '', files: {} as Record<string, string> };
    const code = runBrandCli(args, {
      stdout: (t) => (io.out += t),
      stderr: (t) => (io.err += t),
      writeFile: (p, t) => (io.files[p] = t),
    });
    return { code, ...io };
  };

  it('writes CSS to standard output', () => {
    const r = run('--light', '#F7F5F0', '--dark=#101B2D', '--name', 'Acme');
    expect(r.code).toBe(0);
    expect(r.out).toContain('Stance brand theme "Acme"');
    expect(r.out).toContain("[data-theme='dark'] {");
    expect(r.err).toContain('every contrast check passes');
  });

  it('writes to --out', () => {
    const r = run('--light', '#F7F5F0', '--dark', '#101B2D', '--out', 'brand.css');
    expect(r.code).toBe(0);
    expect(r.out).toBe('');
    expect(r.files['brand.css']).toContain('--st-color-bg-canvas: #F7F5F0;');
  });

  it('exits non-zero with --check when contrast fails', () => {
    const poor = ['--light', '#DDDDDD', '--dark', '#999999'];
    expect(run(...poor).code).toBe(0);
    const r = run(...poor, '--check');
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/contrast checks fail/);
    expect(r.err).toMatch(/light: fg-default on bg-canvas/);
  });

  it('explains missing or invalid arguments', () => {
    expect(run('--light', '#fff').code).toBe(2);
    expect(run('--light', 'nope', '--dark', '#000').err).toMatch(/light must be/);
    expect(run('--colour', 'x').code).toBe(2);
    expect(run('--help').out).toContain('Usage: stance-brand');
    expect(run('--light', '#fff', '--dark', '#000', '--accent-dark', '#888').code).toBe(2);
  });

  it('takes a separate dark theme accent', () => {
    const r = run(
      ...['--light', '#F7F5F0', '--dark', '#101B2D', '--accent', '#2357D9'],
      ...['--accent-dark', '#8FB0FF', '--check'],
    );
    expect(r.code).toBe(0);
    expect(r.out).toContain('--st-color-accent-bg: #8FB0FF;');
  });
});
