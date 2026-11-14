'use client';
import { Badge, Button, Theme } from '@bindshq/stance-react';

const themes = [
  { theme: 'light', title: 'Light', when: 'The default.' },
  { theme: 'dark', title: 'Dark', when: 'When the system or the person chooses it.' },
  {
    theme: 'high-contrast',
    title: 'High contrast',
    when: 'With Increase Contrast. Stronger text and edges.',
  },
] as const;

/**
 * The same small interface in all three themes, drawn with real components and semantic roles,
 * so the page shows what a theme does rather than describing it.
 */
export function ThemeTiles({ compact = false }: { compact?: boolean }) {
  return (
    <ul className="theme-tiles not-prose" data-compact={compact ? '' : undefined}>
      {themes.map((t) => (
        <li key={t.theme}>
          <Theme theme={t.theme} className="theme-tile">
            <div className="theme-tile__card" aria-hidden="true" inert>
              <div className="theme-tile__row">
                <span className="theme-tile__title">
                  {compact ? 'Template' : 'Sales signature'}
                </span>
                <Badge tone="success">Live</Badge>
              </div>
              <span className="theme-tile__muted">Deployed to 48 people</span>
              <div className="theme-tile__row">
                <Button size="sm">Deploy</Button>
                <Button size="sm" variant="outline">
                  Preview
                </Button>
              </div>
            </div>
          </Theme>
          <p className="theme-tile__caption">
            <strong>{t.title}</strong>
            {!compact && <span>{t.when}</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}
