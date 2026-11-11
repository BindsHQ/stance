'use client';
import * as React from 'react';
import { ScrollArea, Theme, type ThemeName } from '@bindshq/stance-react';
import { Code } from './code';

type PreviewTheme = 'auto' | ThemeName;

const themeOptions: { value: PreviewTheme; label: string }[] = [
  { value: 'auto', label: 'Site' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High contrast' },
];

export interface PreviewProps {
  title?: string;
  description?: string;
  code?: string;
  layout?: 'center' | 'start' | 'fill';
  minHeight?: number;
  id?: string;
  children: React.ReactNode;
}

/** A live example canvas with per-example theme override and source view. */
export function Preview({
  title,
  description,
  code,
  layout = 'center',
  minHeight,
  id,
  children,
}: PreviewProps) {
  const [theme, setTheme] = React.useState<PreviewTheme>('auto');
  const [showCode, setShowCode] = React.useState(false);
  const codeId = React.useId();
  const canvas = (
    <div className="preview__canvas" data-layout={layout} style={{ minHeight }}>
      {children}
    </div>
  );
  return (
    <section className="preview" aria-labelledby={title && id ? `${id}-title` : undefined} id={id}>
      {title && (
        <div className="preview__head">
          <h3 id={id ? `${id}-title` : undefined} className="preview__title">
            {id ? <a href={`#${id}`}>{title}</a> : title}
          </h3>
          {description && <p className="preview__description">{description}</p>}
        </div>
      )}
      <div className="preview__frame">
        <div className="preview__toolbar">
          <div className="preview__themes" role="group" aria-label="Preview theme">
            {themeOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={theme === o.value}
                onClick={() => setTheme(o.value)}
                className="preview__theme-btn"
              >
                {o.label}
              </button>
            ))}
          </div>
          {code && (
            <button
              type="button"
              className="preview__code-btn"
              aria-expanded={showCode}
              aria-controls={codeId}
              onClick={() => setShowCode((v) => !v)}
            >
              {showCode ? 'Hide code' : 'Show code'}
            </button>
          )}
        </div>
        {theme === 'auto' ? (
          canvas
        ) : (
          <Theme theme={theme} className="preview__theme-scope">
            {canvas}
          </Theme>
        )}
        {code && (
          <div id={codeId} hidden={!showCode} className="preview__code">
            <Code code={code} />
          </div>
        )}
      </div>
    </section>
  );
}

/** The same example rendered in all three themes side by side. */
export function ThemeTriptych({
  children,
  minHeight,
}: {
  children: React.ReactNode;
  minHeight?: number;
}) {
  const panes: { theme: ThemeName; label: string }[] = [
    { theme: 'light', label: 'Light' },
    { theme: 'dark', label: 'Dark' },
    { theme: 'high-contrast', label: 'High contrast' },
  ];
  return (
    <div className="triptych" role="group" aria-label="Appearance modes">
      {panes.map((p) => (
        <figure key={p.theme} className="triptych__pane">
          <Theme theme={p.theme} className="triptych__canvas" style={{ minHeight }}>
            <ScrollArea
              orientation="horizontal"
              label={`${p.label} preview`}
              className="triptych__scroll"
            >
              <div className="triptych__inner">{children}</div>
            </ScrollArea>
          </Theme>
          <figcaption>{p.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
