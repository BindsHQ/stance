import { breakpoint, size } from '@bindshq/stance-tokens';
import { Code } from '../../../components/code';

export default function Layout() {
  return (
    <>
      <p>
        Stance provides layout <em>primitives</em> (Box, Stack, Inline, Grid, Container) and leaves
        page composition to each product. Binds and eSignify keep their own shells.
      </p>
      <h2 id="breakpoints">Breakpoints</h2>
      <div className="docs-table-wrap" role="region" aria-label="Breakpoints" tabIndex={0}>
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Min width</th>
              <th scope="col">Typical use</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(breakpoint).map(([k, v]) => (
              <tr key={k}>
                <th scope="row">
                  <code>{k}</code>
                </th>
                <td>{v}</td>
                <td>
                  {
                    (
                      {
                        sm: 'Large phones',
                        md: 'Tablets, collapsed sidebars',
                        lg: 'Laptops, persistent sidebars',
                        xl: 'Desktops',
                        '2xl': 'Wide desktops',
                      } as Record<string, string>
                    )[k]
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>CSS custom properties can’t be used inside media queries, so use the values directly:</p>
      <Code language="css" code={`@media (min-width: 1024px) { /* lg */ }`} />
      <h2 id="containers">Containers</h2>
      <ul>
        {Object.entries(size)
          .filter(([k]) => k.startsWith('container'))
          .map(([k, v]) => (
            <li key={k}>
              <code>--st-size-{k}</code> — {v} ({parseFloat(v) * 16}px)
            </li>
          ))}
      </ul>
      <p>
        Container gutters scale with the viewport: 16px on phones, 24px on tablets, 40px on
        desktops.
      </p>
      <h2 id="principles">Layout principles</h2>
      <ul>
        <li>
          Design for a 320px viewport first; nothing may scroll horizontally except data tables,
          which scroll inside a labelled region.
        </li>
        <li>
          Prefer intrinsic layouts (<code>auto-fit</code> grids, wrapping inline groups) over
          breakpoint-specific rules.
        </li>
        <li>
          Overlays adapt: dialogs become bottom sheets under 640px, and drawers never exceed the
          viewport width.
        </li>
      </ul>
    </>
  );
}
