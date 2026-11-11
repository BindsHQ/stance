import { describe, expect, it } from 'vitest';
import * as tokens from '../src';
import { pairs, hcBoost } from '../scripts/contrast-pairs.mjs';

const all = [tokens.light, tokens.dark, tokens.highContrast];

describe('WCAG 2.2 AA contrast', () => {
  for (const theme of all) {
    describe(theme.name, () => {
      for (const [fg, bg, min] of pairs as [
        keyof tokens.ThemeColors,
        keyof tokens.ThemeColors,
        number,
      ][]) {
        const required = theme.name === 'high-contrast' ? hcBoost(min) : min;
        it(`${fg} on ${bg} ≥ ${required}:1`, () => {
          expect(tokens.contrastRatio(theme.colors[fg], theme.colors[bg])).toBeGreaterThanOrEqual(
            required,
          );
        });
      }
    });
  }
});

describe('theme completeness', () => {
  it('every theme defines the same roles', () => {
    const roles = Object.keys(tokens.light.colors).sort();
    for (const theme of all) expect(Object.keys(theme.colors).sort()).toEqual(roles);
  });
  it('brand colours are the official Binds values', () => {
    expect(tokens.brand).toEqual({ ivory: '#FCF6EB', indigo: '#140C2E' });
    expect(tokens.light.colors['bg-canvas']).toBe('#FCF6EB');
    expect(tokens.light.colors['fg-default']).toBe('#140C2E');
    expect(tokens.dark.colors['bg-canvas']).toBe('#140C2E');
    expect(tokens.dark.colors['fg-default']).toBe('#FCF6EB');
  });
  it('the ink scale stays between the two brand colours', () => {
    const lums = Object.values(tokens.ink).map(tokens.luminance);
    for (let i = 1; i < lums.length; i++) expect(lums[i]).toBeLessThan(lums[i - 1]!);
  });
});

describe('themeScript', () => {
  it('produces a self-contained IIFE that applies a valid theme', () => {
    const src = tokens.themeScript({ storageKey: 'theme', defaultTheme: 'light' });
    const store = new Map<string, string>([['theme', 'dark']]);
    const el = {
      attrs: {} as Record<string, string>,
      style: {} as Record<string, string>,
      classes: new Set<string>(),
    };
    const document = {
      documentElement: {
        setAttribute: (k: string, v: string) => (el.attrs[k] = v),
        style: el.style,
        classList: {
          toggle: (c: string, on: boolean) => (on ? el.classes.add(c) : el.classes.delete(c)),
        },
      },
    };
    const localStorage = { getItem: (k: string) => store.get(k) ?? null };
    const window = { matchMedia: () => ({ matches: false }) };
    new Function('document', 'localStorage', 'window', src)(document, localStorage, window);
    expect(el.attrs['data-theme']).toBe('dark');
    expect(el.classes.has('dark')).toBe(true);
  });
  it('falls back to the default for unknown stored values', () => {
    const src = tokens.themeScript({ defaultTheme: 'high-contrast' });
    const attrs: Record<string, string> = {};
    const document = {
      documentElement: {
        setAttribute: (k: string, v: string) => (attrs[k] = v),
        style: {},
        classList: { toggle() {} },
      },
    };
    new Function('document', 'localStorage', 'window', src)(
      document,
      { getItem: () => 'purple' },
      { matchMedia: () => ({ matches: false }) },
    );
    expect(attrs['data-theme']).toBe('high-contrast');
  });
});
