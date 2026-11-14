'use client';
import * as React from 'react';
import {
  themeScript,
  type ThemeName,
  type ThemePreference,
  type ThemeScriptOptions,
} from '@bindshq/stance-tokens';
import { cx } from '../../internal/cx.js';
import { brandStyles, type Brand } from './brand.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';

export type { ThemeName, ThemePreference };

export interface ThemeContextValue {
  /** The stored preference, which may be `system`. */
  theme: ThemePreference;
  /** The theme actually applied. */
  resolvedTheme: ThemeName;
  setTheme: (theme: ThemePreference) => void;
  themes: readonly ThemePreference[];
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps extends ThemeScriptOptions {
  children?: React.ReactNode;
  /** Force a theme regardless of preference (e.g. a marketing page that is always light). */
  forcedTheme?: ThemeName;
  /**
   * Optional brand colours for this subtree, in every theme. `"binds"` (or omitting it) keeps
   * the default palette. For a whole app, the CSS from `createBrandTheme` or the `stance-brand`
   * CLI does the same with no runtime cost.
   */
  brand?: Brand | 'binds';
}

const THEMES: readonly ThemePreference[] = ['light', 'dark', 'high-contrast', 'system'];
const isPreference = (v: unknown): v is ThemePreference =>
  typeof v === 'string' && (THEMES as readonly string[]).includes(v);

function systemTheme(respectContrast: boolean): ThemeName {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  if (respectContrast && window.matchMedia('(prefers-contrast: more)').matches)
    return 'high-contrast';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(key: string, legacy: string[]): ThemePreference | null {
  try {
    const value =
      localStorage.getItem(key) ?? legacy.map((k) => localStorage.getItem(k)).find(Boolean) ?? null;
    return isPreference(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Owns the application's appearance: light, dark, high contrast or system.
 * Persists the preference, follows OS changes live, syncs across tabs and
 * applies `data-theme` (and optionally a `dark` class) to <html>.
 * Pair with <ThemeScript> in <head> to avoid a flash before hydration.
 */
export function ThemeProvider({
  children,
  storageKey = 'stance-theme',
  defaultTheme = 'system',
  darkClass = true,
  respectContrastPreference = true,
  legacyStorageKeys = [],
  forcedTheme,
  brand,
}: ThemeProviderProps) {
  const legacyKey = legacyStorageKeys.join('|');
  const [theme, setThemeState] = React.useState<ThemePreference>(defaultTheme);
  const [system, setSystem] = React.useState<ThemeName>('light');

  useIsomorphicLayoutEffect(() => {
    setThemeState(readStored(storageKey, legacyKey ? legacyKey.split('|') : []) ?? defaultTheme);
    setSystem(systemTheme(respectContrastPreference));
  }, [storageKey, legacyKey, defaultTheme, respectContrastPreference]);

  // Follow OS preference changes.
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const queries = [
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-contrast: more)'),
    ];
    const onChange = () => setSystem(systemTheme(respectContrastPreference));
    queries.forEach((q) => q.addEventListener?.('change', onChange));
    return () => queries.forEach((q) => q.removeEventListener?.('change', onChange));
  }, [respectContrastPreference]);

  // Sync across tabs.
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey && isPreference(e.newValue)) setThemeState(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  const resolvedTheme: ThemeName = forcedTheme ?? (theme === 'system' ? system : theme);

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    root.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
    if (darkClass) root.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme, darkClass]);

  const setTheme = React.useCallback(
    (next: ThemePreference) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* storage unavailable (private mode): keep in memory */
      }
    },
    [storageKey],
  );

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, themes: THEMES }),
    [theme, resolvedTheme, setTheme],
  );

  const brandKey =
    typeof brand === 'object'
      ? `${brand.name}|${brand.light}|${brand.dark}|${JSON.stringify(brand.accent)}`
      : brand;
  // Keyed on the brand's values, not on the object's identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const styles = React.useMemo(() => brandStyles(brand), [brandKey]);

  const content = <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  if (!styles) return content;
  // `display: contents` keeps the wrapper out of layout; custom properties still inherit
  // through it. The style is rendered on the server too, so there is no flash on hydration.
  return (
    <div data-stance-brand={styles.scope} style={{ display: 'contents' }}>
      <style dangerouslySetInnerHTML={{ __html: styles.css }} />
      {content}
    </div>
  );
}

/** Access and change the current theme. Must be used inside <ThemeProvider>. */
export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>.');
  return ctx;
}

export interface ThemeScriptProps extends ThemeScriptOptions {
  /** CSP nonce for the inline script. */
  nonce?: string;
}

/** Inline script for <head> that applies the stored theme before first paint. */
export function ThemeScript({ nonce, ...options }: ThemeScriptProps) {
  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript(options) }}
    />
  );
}

export interface ThemeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Theme for this subtree. */
  theme: ThemeName;
  asChild?: never;
}

/** Scopes a theme to a subtree, useful for previews, inverted sections and embedded widgets. */
export const Theme = React.forwardRef<HTMLDivElement, ThemeProps>(function Theme(
  { theme, className, ...props },
  ref,
) {
  return <div ref={ref} data-theme={theme} className={cx('st-theme', className)} {...props} />;
});
