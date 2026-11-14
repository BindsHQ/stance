import { BrandPlayground } from '../../../components/brand-playground';
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
      <h2 id="your-brand">Your brand</h2>
      <p>
        Make Stance yours: generate a full palette from your own brand colours. This is optional;
        the default palette works as it is.
      </p>
      <p>
        Give Stance your lightest and your darkest colour, and an accent if you have one. Stance
        builds the neutral scale and every role in all three themes from them, the same way on the
        web, iOS and Android.
      </p>
      <h3 id="brand-css-file">A stylesheet at build time</h3>
      <Code
        language="bash"
        code={`npx stance-brand --light '#F7F5F0' --dark '#101B2D' --name Acme > app/brand.css`}
      />
      <p>
        Load it after the token stylesheet. Add <code>--accent</code> for a separate action colour,{' '}
        <code>--out</code> to write a file, and <code>--check</code> to fail CI when a contrast
        check fails. The same output is available in code:
      </p>
      <Code
        code={`import '@bindshq/stance-tokens/css';
import './brand.css';
import '@bindshq/stance-react/styles.css';

// Or generate it in your own build script:
import { createBrandTheme } from '@bindshq/stance-tokens';

const { css, report } = createBrandTheme({ name: 'Acme', light: '#F7F5F0', dark: '#101B2D' });`}
      />
      <h3 id="brand-runtime">A brand at runtime</h3>
      <p>
        Products that switch brands while running, such as one app serving many customers, pass the
        brand to <code>ThemeProvider</code>. It applies to everything inside the provider, in every
        theme.
      </p>
      <Code
        code={`import { ThemeProvider, type Brand } from '@bindshq/stance-react';

const acme: Brand = { name: 'Acme', light: '#F7F5F0', dark: '#101B2D', accent: '#0A7C66' };

<ThemeProvider brand={acme}>{children}</ThemeProvider>`}
      />
      <h3 id="brand-playground">Try your colours</h3>
      <p>
        An accent keeps its hue. Where it would be hard to read, Stance adjusts its lightness for
        that theme, so links, buttons and focus rings pass every contrast check.
      </p>
      <BrandPlayground />
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
            <tr>
              <th scope="row">
                <code>brand</code>
              </th>
              <td>None</td>
              <td>
                Your brand colours for the subtree. See <a href="#your-brand">Your brand</a>.
              </td>
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
