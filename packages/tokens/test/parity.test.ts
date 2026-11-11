import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as tokens from '../src';

const dir = join(import.meta.dirname, '..', 'generated');
const swift = readFileSync(join(dir, 'swift', 'StanceTokens.swift'), 'utf8');
const kotlin = readFileSync(join(dir, 'kotlin', 'StanceTokens.kt'), 'utf8');
const resolved = JSON.parse(readFileSync(join(dir, 'json', 'tokens.resolved.json'), 'utf8'));

const camel = (s: string) => s.replace(/[-_.]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());
const themeVar = (name: string) => camel(name);

/** Extracts `role: hex` for one theme block from generated native source. */
function nativeColors(source: string, theme: string, pattern: RegExp): Map<string, string> {
  const start = source.indexOf(
    `${themeVar(theme)}`,
    source.indexOf(`name${source === swift ? ':' : ' ='} "${theme}"`) - 120,
  );
  const block = source.slice(start, source.indexOf('shadows', start));
  return new Map([...block.matchAll(pattern)].map((m) => [m[1]!, m[2]!.toUpperCase()]));
}

describe('cross-platform token parity', () => {
  for (const theme of [tokens.light, tokens.dark, tokens.highContrast]) {
    const expected = Object.entries(resolved.themes[theme.name])
      .filter(([k]) => k.startsWith('color.'))
      .map(
        ([k, v]) =>
          [camel(k.slice(6)), (v as { value: { hex: string; alpha: number } }).value] as const,
      );

    it(`Swift ${theme.name} colours match the source`, () => {
      const actual = nativeColors(swift, theme.name, /(\w+): StanceRGBA\(hex: 0x([0-9A-F]{6})/g);
      expect(actual.size).toBe(expected.length);
      for (const [role, value] of expected) expect(actual.get(role), role).toBe(value.hex.slice(1));
    });

    it(`Kotlin ${theme.name} colours match the source`, () => {
      const actual = nativeColors(kotlin, theme.name, /(\w+) = 0x([0-9A-F]{8}),/g);
      expect(actual.size).toBe(expected.length);
      for (const [role, value] of expected) {
        const alpha = Math.round(value.alpha * 255)
          .toString(16)
          .padStart(2, '0')
          .toUpperCase();
        expect(actual.get(role), role).toBe(`${alpha}${value.hex.slice(1)}`);
      }
    });

    it(`web ${theme.name} colours match the source`, () => {
      for (const [k, v] of Object.entries(resolved.themes[theme.name])) {
        if (!k.startsWith('color.')) continue;
        const { hex, alpha } = (v as { value: { hex: string; alpha: number } }).value;
        const css = theme.colors[k.slice(6) as keyof tokens.ThemeColors];
        if (alpha === 1) expect(css).toBe(hex);
        else expect(css.startsWith('rgba(')).toBe(true);
      }
    });
  }

  it('brand colours are identical on every platform', () => {
    expect(swift).toContain('public static let ivory: StanceRGBA = StanceRGBA(hex: 0xFCF6EB)');
    expect(swift).toContain('public static let indigo: StanceRGBA = StanceRGBA(hex: 0x140C2E)');
    expect(kotlin).toContain('const val ivory: Long = 0xFFFCF6EB');
    expect(kotlin).toContain('const val indigo: Long = 0xFF140C2E');
    expect(tokens.brand).toEqual({ ivory: '#FCF6EB', indigo: '#140C2E' });
  });

  it('spacing is identical on every platform (rem × 16 = pt = dp)', () => {
    for (const [key, rem] of Object.entries(tokens.space)) {
      const px = rem === '0' ? 0 : rem.endsWith('rem') ? parseFloat(rem) * 16 : parseFloat(rem);
      const id = `space${camel(String(key).replace('.', '_'))}`;
      expect(swift, id).toMatch(new RegExp(`static let ${id}: Double = ${px}\\b`));
      expect(kotlin, id).toMatch(new RegExp(`const val ${id}: Float = ${px}f`));
    }
  });
});
