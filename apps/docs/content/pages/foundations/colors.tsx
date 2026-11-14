import {
  brand,
  contrastRatio,
  dark,
  highContrast,
  ink,
  light,
  type ThemeColors,
} from '@bindshq/stance-tokens';
import { ThemeTiles } from '../../../components/theme-tiles';

const groups: { title: string; id: string; prefix: string[] }[] = [
  { title: 'Backgrounds', id: 'backgrounds', prefix: ['bg-'] },
  { title: 'Text and icons', id: 'text', prefix: ['fg-'] },
  { title: 'Borders and separators', id: 'borders', prefix: ['border-', 'separator'] },
  {
    title: 'Accent and interaction',
    id: 'accent',
    prefix: ['accent-', 'interactive-', 'focus-', 'disabled-'],
  },
  { title: 'Status', id: 'status', prefix: ['danger-', 'success-', 'warning-', 'info-'] },
  { title: 'Data visualisation', id: 'charts', prefix: ['chart-'] },
];

/** The roles people reach for most, with what each one is for. */
const essentials: { role: keyof ThemeColors; use: string }[] = [
  { role: 'bg-canvas', use: 'The page or screen behind everything.' },
  { role: 'bg-surface', use: 'Cards, sheets and panels that sit on the canvas.' },
  { role: 'fg-default', use: 'Body text, headings and icons.' },
  { role: 'fg-muted', use: 'Secondary text, such as descriptions and captions.' },
  { role: 'border-default', use: 'Edges of cards, inputs and tables.' },
  { role: 'accent-bg', use: 'The primary action on a screen.' },
  { role: 'focus-ring', use: 'Keyboard focus. Always visible.' },
  { role: 'danger-fg', use: 'Errors and destructive actions, with text or an icon.' },
];

const themes = [
  { name: 'Light', colors: light.colors },
  { name: 'Dark', colors: dark.colors },
  { name: 'High contrast', colors: highContrast.colors },
];

const roles = Object.keys(light.colors) as (keyof ThemeColors)[];
const camel = (role: string) => role.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function Swatch({ color }: { color: string }) {
  return <span className="swatch" style={{ background: color }} aria-hidden="true" />;
}

export default function Colors() {
  return (
    <>
      <p>
        Choose colour by what it is for, not by its value. Ask for <code>fg-muted</code> or{' '}
        <code>bg-surface</code>, and Stance supplies the right colour for light, dark and high
        contrast, on the web, iOS and Android.
      </p>

      <h2 id="themes">Three themes, one set of roles</h2>
      <p>
        Every component is written once, with roles. The theme decides the values. People get the
        appearance they chose, and nothing in your code changes.
      </p>
      <ThemeTiles />

      <h2 id="roles">The roles you will use most</h2>
      <p>Each swatch shows the role in every theme.</p>
      <p className="role-legend" aria-hidden="true">
        <span>Light</span>
        <span>Dark</span>
        <span>High contrast</span>
      </p>
      <ul className="role-cards not-prose">
        {essentials.map(({ role, use }) => (
          <li key={role}>
            <span className="role-cards__swatch" aria-hidden="true">
              {themes.map((t) => (
                <span key={t.name} style={{ background: t.colors[role] }} />
              ))}
            </span>
            <code className="role-cards__name">{role}</code>
            <span className="role-cards__use">{use}</span>
          </li>
        ))}
      </ul>

      <h2 id="use">Using roles</h2>
      <div className="docs-table-wrap" role="region" aria-label="Using roles" tabIndex={0}>
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Platform</th>
              <th scope="col">How to use a role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Web</th>
              <td>
                <code>color: var(--st-color-fg-muted);</code>
              </td>
            </tr>
            <tr>
              <th scope="row">iOS</th>
              <td>
                <code>theme.colors.fgMuted</code>
              </td>
            </tr>
            <tr>
              <th scope="row">Android</th>
              <td>
                <code>StanceTheme.colors.fgMuted</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul>
        <li>Use roles, never raw hex values, so your screens follow every theme.</li>
        <li>Never use colour alone to carry meaning. Pair status colours with text or an icon.</li>
        <li>Check new screens in all three themes before you ship.</li>
      </ul>

      <h2 id="all-roles">All roles</h2>
      <p>
        On iOS and Android each role is the same name in camel case, for example{' '}
        <code>{camel('bg-surface-raised')}</code>.
      </p>
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`roles-${g.id}`}>
          <h3 className="docs-h3" id={`roles-${g.id}`}>
            {g.title}
          </h3>
          <div className="docs-table-wrap" role="region" aria-label={g.title} tabIndex={0}>
            <table className="docs-table token-table">
              <thead>
                <tr>
                  <th scope="col">Role</th>
                  <th scope="col">Light</th>
                  <th scope="col">Dark</th>
                  <th scope="col">High contrast</th>
                </tr>
              </thead>
              <tbody>
                {roles
                  .filter((r) => g.prefix.some((p) => r.startsWith(p)))
                  .map((r) => (
                    <tr key={r}>
                      <th scope="row">
                        <code>{r}</code>
                      </th>
                      {themes.map((t) => (
                        <td key={t.name}>
                          <Swatch color={t.colors[r]} />
                          <code>{t.colors[r]}</code>
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <h2 id="palette">The palette underneath</h2>
      <p>
        Every role comes from two colours, Ivory and Indigo, and the fifteen step ink scale mixed
        between them. You rarely need these directly; use roles instead.
      </p>
      <div className="brand-swatches">
        <figure className="brand-swatch" style={{ background: brand.ivory, color: brand.indigo }}>
          <figcaption>
            <strong>Ivory</strong>
            <code>{brand.ivory}</code>
          </figcaption>
        </figure>
        <figure className="brand-swatch" style={{ background: brand.indigo, color: brand.ivory }}>
          <figcaption>
            <strong>Indigo</strong>
            <code>{brand.indigo}</code>
          </figcaption>
        </figure>
      </div>
      <div className="docs-table-wrap" role="region" aria-label="Ink scale" tabIndex={0}>
        <table className="docs-table token-table">
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">Value</th>
              <th scope="col">On ivory</th>
              <th scope="col">On indigo</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ink).map(([k, v]) => (
              <tr key={k}>
                <th scope="row">
                  <Swatch color={v} />
                  <code>--st-color-ink-{k}</code>
                </th>
                <td>
                  <code>{v}</code>
                </td>
                <td>{contrastRatio(v, brand.ivory).toFixed(2)}:1</td>
                <td>{contrastRatio(v, brand.indigo).toFixed(2)}:1</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Want your own colours? Generate the full palette, every role and all three themes, from your
        brand: see <a href="/docs/theming#your-brand">Your brand</a>.
      </p>
    </>
  );
}
