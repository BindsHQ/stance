import { zIndex } from '@bindshq/stance-tokens';

const shadows = ['xs', 'sm', 'md', 'lg', 'xl'];
const usage: Record<string, string> = {
  xs: 'Inputs, subtle lift',
  sm: 'Cards at rest',
  md: 'Hovered cards, sticky headers',
  lg: 'Popovers, menus, toasts',
  xl: 'Dialogs and drawers',
};

export default function Elevation() {
  return (
    <>
      <p>
        Elevation is expressed with soft, indigo-tinted shadows in light mode and deeper shadows
        over lighter surfaces in dark mode. In high contrast, shadows become solid outlines, because
        depth must not depend on subtle shading.
      </p>
      <h2 id="shadows">Shadows</h2>
      <div className="elevation-grid">
        {shadows.map((s) => (
          <figure key={s} className="elevation-grid__item">
            <span
              className="elevation-grid__card"
              style={{ boxShadow: `var(--st-shadow-${s})` }}
              aria-hidden="true"
            />
            <figcaption>
              <code>--st-shadow-{s}</code>
              <span className="docs-muted">{usage[s]}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <h2 id="z-index">Z-index</h2>
      <p>Layers use a fixed scale. Never invent ad-hoc z-index values.</p>
      <div className="docs-table-wrap" role="region" aria-label="Z-index scale" tabIndex={0}>
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(zIndex).map(([k, v]) => (
              <tr key={k}>
                <th scope="row">
                  <code>--st-z-{k}</code>
                </th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
