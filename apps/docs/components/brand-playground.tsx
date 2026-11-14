'use client';
import * as React from 'react';
import { createBrandTheme, formatBrandReport, type Brand } from '@bindshq/stance-tokens';
import { Badge, Button, Checkbox, Link, Switch, Theme } from '@bindshq/stance-react';
import { Code } from './code';

const SCOPE = "[data-brand-preview='playground']";
const START = { light: '#F7F5F0', dark: '#101B2D', accent: '#0A7C66' };
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const full = (hex: string) => {
  const h = hex.replace('#', '');
  return `#${(h.length === 3 ? [...h].map((c) => c + c).join('') : h).toUpperCase()}`;
};

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  const id = React.useId();
  const [text, setText] = React.useState(value);
  React.useEffect(() => setText(value), [value]);
  const invalid = !HEX.test(text);
  return (
    <div className="brand-playground__field">
      <label htmlFor={id}>{label}</label>
      <div className="brand-playground__inputs">
        <input
          type="color"
          aria-label={`${label}, colour picker`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(full(e.target.value))}
        />
        <input
          id={id}
          type="text"
          inputMode="text"
          spellCheck={false}
          autoComplete="off"
          value={text}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(e) => {
            setText(e.target.value);
            if (HEX.test(e.target.value)) onChange(full(e.target.value));
          }}
        />
      </div>
      {invalid && (
        <p id={`${id}-error`} className="brand-playground__error">
          Use a hex colour such as #1D2A3A.
        </p>
      )}
    </div>
  );
}

function Preview() {
  return (
    <>
      <p className="brand-playground__title">Weekly report</p>
      <p className="brand-playground__muted">
        Ready to share. <Link href="#your-brand">View details</Link>
      </p>
      <div className="brand-playground__row">
        <Button size="sm">Publish</Button>
        <Button size="sm" variant="secondary">
          Save draft
        </Button>
      </div>
      <div className="brand-playground__row">
        <Badge>Draft</Badge>
        <Badge tone="success">Synced</Badge>
      </div>
      <Switch size="sm" label="Notify the team" defaultChecked />
      <Checkbox label="Include charts" defaultChecked />
    </>
  );
}

/** Live brand playground for the theming docs: pick colours, see real components, copy the CSS. */
export function BrandPlayground() {
  const [light, setLight] = React.useState(START.light);
  const [dark, setDark] = React.useState(START.dark);
  const [useAccent, setUseAccent] = React.useState(false);
  const [accent, setAccent] = React.useState(START.accent);
  const [copied, setCopied] = React.useState(false);

  const brand: Brand = { name: 'Your brand', light, dark, ...(useAccent ? { accent } : {}) };
  const scoped = createBrandTheme(brand, { scope: SCOPE });
  const { css, report } = createBrandTheme(brand);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };
  const reset = () => {
    setLight(START.light);
    setDark(START.dark);
    setAccent(START.accent);
    setUseAccent(false);
  };

  return (
    <div className="brand-playground">
      <style dangerouslySetInnerHTML={{ __html: scoped.css }} />
      <form
        className="brand-playground__controls"
        aria-label="Brand colours"
        onSubmit={(e) => e.preventDefault()}
      >
        <ColorField label="Light colour" value={light} onChange={setLight} />
        <ColorField label="Dark colour" value={dark} onChange={setDark} />
        <Checkbox
          label="Use an accent"
          checked={useAccent}
          onCheckedChange={(v) => setUseAccent(v === true)}
        />
        <ColorField
          label="Accent colour"
          value={accent}
          onChange={setAccent}
          disabled={!useAccent}
        />
        <button type="button" className="playground__reset" onClick={reset}>
          Reset
        </button>
      </form>

      <div className="brand-playground__preview" data-brand-preview="playground">
        {(
          [
            ['light', 'Light'],
            ['dark', 'Dark'],
            ['high-contrast', 'High contrast'],
          ] as const
        ).map(([theme, label]) => (
          <Theme
            key={theme}
            theme={theme}
            role="group"
            aria-label={`${label} preview`}
            className="brand-playground__pane"
          >
            <span className="brand-playground__label">{label}</span>
            <Preview />
          </Theme>
        ))}
      </div>

      <div className="brand-playground__report">
        <h3 id="brand-contrast">Contrast</h3>
        <p aria-live="polite">
          {report.length === 0
            ? 'Every contrast check passes in all three themes.'
            : `${report.length} ${report.length === 1 ? 'pair is' : 'pairs are'} below the minimum.`}
        </p>
        {report.length > 0 && (
          <ul className="brand-playground__failures">
            {formatBrandReport(report).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="brand-playground__css">
        <div className="brand-playground__css-bar">
          <h3 id="brand-css">Your CSS</h3>
          <button type="button" className="site-code__copy" onClick={copy}>
            {copied ? 'Copied' : 'Copy CSS'}
          </button>
          <span className="st-sr-only" aria-live="polite">
            {copied ? 'CSS copied to clipboard' : ''}
          </span>
        </div>
        <details>
          <summary>Show the stylesheet</summary>
          <Code code={css} language="css" title="brand.css" />
        </details>
      </div>
    </div>
  );
}
