import { Code } from '../../../components/code';

export default function Architecture() {
  return (
    <>
      <h2 id="packages">Packages</h2>
      <div className="docs-table-wrap" role="region" aria-label="Packages" tabIndex={0}>
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Package</th>
              <th scope="col">Contents</th>
              <th scope="col">Runtime dependencies</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <code>@bindshq/stance-tokens</code>
              </th>
              <td>
                Primitives, three themes, CSS variables, JSON, Tailwind presets, contrast utilities,
                the no-flash theme script.
              </td>
              <td>None</td>
            </tr>
            <tr>
              <th scope="row">
                <code>@bindshq/stance-react</code>
              </th>
              <td>Components, icons, accessibility primitives, ThemeProvider.</td>
              <td>None (React is a peer)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 id="tokens">Token layers</h2>
      <ol>
        <li>
          <strong>Brand</strong>: the two official colours, ivory and indigo.
        </li>
        <li>
          <strong>Primitives</strong>: the ink scale (an OKLab interpolation between ivory and
          indigo), functional status colours and the type, space, radius and motion scales.
        </li>
        <li>
          <strong>Semantic roles</strong>: what components consume: <code>bg-canvas</code>,{' '}
          <code>fg-muted</code>, <code>border-control</code>, <code>accent-bg</code>,{' '}
          <code>danger-fg</code>… Each theme maps every role.
        </li>
        <li>
          <strong>Component variables</strong>: private <code>--_*</code> variables inside each
          component, derived from semantic roles.
        </li>
      </ol>
      <h2 id="styling">Styling model</h2>
      <p>
        Components render stable class names (<code>st-button</code>, <code>st-dialog__title</code>)
        and expose variants and state as data attributes (<code>data-variant</code>,{' '}
        <code>data-state</code>). Styles are plain CSS with no build step on the consumer side, and
        selectors are scoped so Stance never restyles host markup.
      </p>
      <h2 id="primitives">Accessibility primitives</h2>
      <p>Stance implements its own interaction layer instead of depending on headless libraries:</p>
      <ul>
        <li>
          <strong>Focus scope</strong>: trap, auto-focus and restore for dialogs and popovers.
        </li>
        <li>
          <strong>Dismissable layer stack</strong>: Escape and outside-click handling that respects
          nested, portalled layers.
        </li>
        <li>
          <strong>Anchored positioning</strong>: collision-aware placement with flip and shift,
          updated on scroll and resize.
        </li>
        <li>
          <strong>Roving focus and typeahead</strong>: the WAI-ARIA patterns for toolbars, tabs,
          menus, listboxes, trees and grids.
        </li>
        <li>
          <strong>Portal</strong>: SSR-safe, and carries scoped themes into portalled content.
        </li>
      </ul>
      <h2 id="source-layout">Source layout</h2>
      <Code
        language="text"
        code={`packages/react/src/
├── components/<name>/
│   ├── <Name>.tsx        component
│   ├── <name>.css        styles (tokens only)
│   ├── <Name>.test.tsx   behaviour, keyboard and axe tests
│   └── index.ts          public exports
├── internal/             focus scope, layers, positioning, roving focus…
├── icons/                the Stance icon set
└── styles/               base keyframes and utilities
apps/docs/content/components/<slug>.tsx   docs + live examples`}
      />
      <h2 id="distribution">Distribution</h2>
      <ul>
        <li>ESM only, one module per source file, so bundlers tree-shake unused components.</li>
        <li>
          <code>'use client'</code> appears only in modules that need it, so server components can
          import from the package root.
        </li>
        <li>
          One <code>styles.css</code>, plus per-component stylesheets at{' '}
          <code>@bindshq/stance-react/components/&lt;name&gt;.css</code>.
        </li>
      </ul>
    </>
  );
}
