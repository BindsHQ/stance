import { Code } from '../../../components/code';

export default function Theming() {
  return (
    <>
      <p>
        Stance has three appearance modes. Each is a complete mapping of semantic roles, not just an
        inverted palette.
      </p>
      <ul>
        <li>
          <strong>Light</strong>: ivory canvas, indigo text, warm derived neutrals.
        </li>
        <li>
          <strong>Dark</strong>: indigo canvas, ivory text, surfaces that lighten with elevation.
        </li>
        <li>
          <strong>High contrast</strong>: every boundary at full indigo strength, body and secondary
          text at 12:1 or more, 3px focus rings and 2px control borders. Chosen automatically when
          the OS requests more contrast.
        </li>
      </ul>
      <h2 id="how-it-works">How it works</h2>
      <p>
        The theme is a <code>data-theme</code> attribute. On <code>&lt;html&gt;</code> it sets the
        page theme; on any element it scopes a theme to a subtree.
      </p>
      <Code
        language="html"
        code={`<html data-theme="dark">…</html>\n<section data-theme="high-contrast">…</section>`}
      />
      <h2 id="provider">ThemeProvider options</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="ThemeProvider options"
        tabIndex={0}
      >
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">Default</th>
              <th scope="col">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <code>defaultTheme</code>
              </th>
              <td>
                <code>'system'</code>
              </td>
              <td>Used when no preference is stored.</td>
            </tr>
            <tr>
              <th scope="row">
                <code>storageKey</code>
              </th>
              <td>
                <code>'stance-theme'</code>
              </td>
              <td>localStorage key for the preference.</td>
            </tr>
            <tr>
              <th scope="row">
                <code>legacyStorageKeys</code>
              </th>
              <td>
                <code>[]</code>
              </td>
              <td>Keys read when the main key is empty, to migrate an existing preference.</td>
            </tr>
            <tr>
              <th scope="row">
                <code>darkClass</code>
              </th>
              <td>
                <code>true</code>
              </td>
              <td>
                Also toggles a <code>dark</code> class for Tailwind’s class strategy.
              </td>
            </tr>
            <tr>
              <th scope="row">
                <code>respectContrastPreference</code>
              </th>
              <td>
                <code>true</code>
              </td>
              <td>
                System mode resolves to high contrast when <code>prefers-contrast: more</code>.
              </td>
            </tr>
            <tr>
              <th scope="row">
                <code>forcedTheme</code>
              </th>
              <td>None</td>
              <td>Locks a page to one theme.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Pass the same options to <code>ThemeScript</code> so the pre-paint script and the provider
        agree.
      </p>
      <h2 id="migrating">Keeping an existing preference</h2>
      <p>
        An app that already stored <code>'light'</code> or <code>'dark'</code> under{' '}
        <code>localStorage.theme</code> keeps working:
      </p>
      <Code
        code={`<ThemeScript storageKey="theme" defaultTheme="light" />
<ThemeProvider storageKey="theme" defaultTheme="light">{children}</ThemeProvider>`}
      />
      <h2 id="scoped">Scoped themes</h2>
      <Code
        code={`import { Theme } from '@bindshq/stance-react';\n\n<Theme theme="dark">\n  <CallToAction />\n</Theme>`}
      />
      <p>
        Popovers, menus and tooltips opened inside a scoped theme inherit it, even though they
        render in a portal.
      </p>
      <h2 id="no-js">Without JavaScript</h2>
      <p>
        When no <code>data-theme</code> is set, the token stylesheet follows{' '}
        <code>prefers-color-scheme</code> and <code>prefers-contrast</code> directly. Reduced-motion
        preferences shorten every Stance duration to zero.
      </p>
    </>
  );
}
