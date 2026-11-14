import {
  brand,
  contrastRatio,
  dark,
  highContrast,
  ink,
  light,
  type ThemeColors,
} from '@bindshq/stance-tokens';

const groups: { title: string; prefix: string[] }[] = [
  { title: 'Backgrounds', prefix: ['bg-'] },
  { title: 'Foregrounds', prefix: ['fg-'] },
  { title: 'Borders and separators', prefix: ['border-', 'separator'] },
  { title: 'Accent and interaction', prefix: ['accent-', 'interactive-', 'focus-', 'disabled-'] },
  { title: 'Status', prefix: ['danger-', 'success-', 'warning-', 'info-'] },
  { title: 'Data visualisation', prefix: ['chart-'] },
];

const roles = Object.keys(light.colors) as (keyof ThemeColors)[];

function Swatch({ color }: { color: string }) {
  return <span className="swatch" style={{ background: color }} aria-hidden="true" />;
}

export default function Colors() {
  return (
    <>
      <h2 id="brand">Brand colours</h2>
      <p>
        Binds has two official colours. They anchor every surface, and nothing else is a brand
        colour.
      </p>
      <div className="brand-swatches">
        <figure className="brand-swatch" style={{ background: brand.ivory, color: brand.indigo }}>
          <figcaption>
            <strong>Binds Ivory</strong>
            <code>{brand.ivory}</code>
          </figcaption>
        </figure>
        <figure className="brand-swatch" style={{ background: brand.indigo, color: brand.ivory }}>
          <figcaption>
            <strong>Binds Indigo</strong>
            <code>{brand.indigo}</code>
          </figcaption>
        </figure>
      </div>
      <p>
        You can also bring your own colours: see <a href="/docs/theming#your-brand">Your brand</a>.
      </p>
      <p className="docs-muted">
        Ivory on indigo: {contrastRatio(brand.ivory, brand.indigo).toFixed(2)}:1 contrast.
      </p>

      <h2 id="ink">Ink scale</h2>
      <p>
        The neutrals are an OKLab interpolation from ivory (0) to indigo (1000). Every grey in
        Stance is a mix of the two brand colours, never a borrowed palette.
      </p>
      <div className="docs-table-wrap" role="region" aria-label="Ink scale" tabIndex={0}>
        <table className="docs-table token-table">
          <thead>
            <tr>
              <th scope="col">Token</th>
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

      <h2 id="semantic">Semantic roles</h2>
      <p>
        Components only use semantic roles. Each theme assigns every role a value, so a component
        written once is correct in all three modes. Use them in your CSS as{' '}
        <code>var(--st-color-&lt;role&gt;)</code>.
      </p>
      <p>
        Status colours (danger, success, warning) are functional. Use them only to communicate
        state, and always alongside text or an icon.
      </p>
      {groups.map((g) => (
        <section key={g.title} aria-labelledby={`roles-${g.title}`}>
          <h3 className="docs-h3" id={`roles-${g.title}`}>
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
                      {[light, dark, highContrast].map((t) => (
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
    </>
  );
}
