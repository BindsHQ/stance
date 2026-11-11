import * as React from 'react';
import { Button, Theme, useTheme } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'theme-provider',
  name: 'ThemeProvider',
  category: 'theming',
  summary:
    'Owns the appearance: light, dark, high contrast or system, persisted with no flash on load.',
  description:
    'Wrap your application once in ThemeProvider and put ThemeScript in <head>. The provider resolves the preference (including the operating system’s colour-scheme and contrast settings), persists it, syncs it across tabs and applies data-theme to <html>. Use Theme to scope a theme to part of a page, and useTheme to read or change it.',
  imports: ['ThemeProvider', 'ThemeScript', 'Theme', 'useTheme'],
  status: 'stable',
  examples: [
    { name: 'CurrentTheme', title: 'Reading and changing the theme' },
    {
      name: 'ScopedThemes',
      title: 'Scoped themes',
      description: 'Theme sets data-theme on a wrapper so a section can differ from the page.',
    },
    {
      name: 'InvertedSection',
      title: 'Inverted call to action',
      description:
        'A dark band on a light page, built with a scoped theme rather than hard-coded colours.',
    },
  ],
  props: [
    {
      component: 'ThemeProvider',
      name: 'defaultTheme',
      type: "'light' | 'dark' | 'high-contrast' | 'system'",
      default: "'system'",
      description: 'Used when no preference is stored.',
    },
    {
      component: 'ThemeProvider',
      name: 'storageKey',
      type: 'string',
      default: "'stance-theme'",
      description: 'localStorage key for the preference.',
    },
    {
      component: 'ThemeProvider',
      name: 'legacyStorageKeys',
      type: 'string[]',
      default: '[]',
      description:
        'Keys read when storageKey is empty, so an existing preference survives migration.',
    },
    {
      component: 'ThemeProvider',
      name: 'darkClass',
      type: 'boolean',
      default: 'true',
      description: 'Also toggles a dark class on <html> for Tailwind’s class strategy.',
    },
    {
      component: 'ThemeProvider',
      name: 'respectContrastPreference',
      type: 'boolean',
      default: 'true',
      description: 'System mode resolves to high contrast when prefers-contrast: more.',
    },
    {
      component: 'ThemeProvider',
      name: 'forcedTheme',
      type: "'light' | 'dark' | 'high-contrast'",
      description: 'Locks the page to one theme regardless of preference.',
    },
    {
      component: 'ThemeScript',
      name: '...options',
      type: 'ThemeScriptOptions & { nonce?: string }',
      description:
        'Same options as ThemeProvider. Renders the inline pre-paint script; pass a CSP nonce if needed.',
    },
    {
      component: 'Theme',
      name: 'theme',
      type: "'light' | 'dark' | 'high-contrast'",
      required: true,
      description: 'Theme for the subtree. Portalled overlays opened inside inherit it.',
    },
    {
      component: 'useTheme',
      name: 'returns',
      type: '{ theme, resolvedTheme, setTheme, themes }',
      description:
        'theme is the stored preference (may be system); resolvedTheme is what is applied.',
    },
  ],
  accessibility: [
    'System mode honours prefers-color-scheme and prefers-contrast, so people who need more contrast get the high-contrast theme automatically.',
    'ThemeScript applies the theme before first paint, preventing a flash that can be uncomfortable for light-sensitive users.',
    'Reduced-motion preferences collapse every Stance duration to zero independently of the theme.',
    'Scoped themes keep text and boundaries at the same verified contrast as page-level themes.',
  ],
  guidelines: {
    do: [
      'Render ThemeScript in <head> with the same options as ThemeProvider.',
      'Use legacyStorageKeys or storageKey to keep a preference an app already stored.',
    ],
    dont: [
      'Hard-code dark sections with raw colours; use a scoped Theme.',
      'Mount more than one ThemeProvider in the same document.',
    ],
  },
  related: ['theme-switcher'],
};

export function CurrentTheme() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <p style={{ margin: 0 }}>
        Preference: <strong>{theme}</strong> · Applied: <strong>{resolvedTheme}</strong>
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button size="sm" variant="outline" onClick={() => setTheme('light')}>
          Light
        </Button>
        <Button size="sm" variant="outline" onClick={() => setTheme('dark')}>
          Dark
        </Button>
        <Button size="sm" variant="outline" onClick={() => setTheme('high-contrast')}>
          High contrast
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setTheme('system')}>
          System
        </Button>
      </div>
    </div>
  );
}

export function ScopedThemes() {
  const themes = ['light', 'dark', 'high-contrast'] as const;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
        gap: 12,
        width: '100%',
      }}
    >
      {themes.map((t) => (
        <Theme
          key={t}
          theme={t}
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--st-color-border-default)',
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{t}</p>
          <Button size="sm">Deploy signature</Button>
        </Theme>
      ))}
    </div>
  );
}

export function InvertedSection() {
  return (
    <Theme theme="dark" style={{ width: '100%', padding: 24, borderRadius: 16 }}>
      <h3 style={{ margin: '0 0 6px' }}>Roll out your new signature</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--st-color-fg-muted)' }}>
        Deploy to every mailbox in your organisation in one step.
      </p>
      <Button shape="pill">Start rollout</Button>
    </Theme>
  );
}
