import report from '@bindshq/stance-tokens/tokens.json';
import Link from 'next/link';

const themeCount = Object.keys((report as { themes: object }).themes).length;

export default function Accessibility() {
  return (
    <>
      <p>
        Stance targets <strong>WCAG 2.2 level AA</strong>. Accessibility is part of each component’s
        contract and is tested on every change, but automated tests cannot prove full conformance.
        Products must still test complete flows with keyboards and screen readers.
      </p>
      <h2 id="what-is-verified">What is verified automatically</h2>
      <ul>
        <li>
          <strong>Colour contrast</strong> — 36 foreground/background pairs in each of the{' '}
          {themeCount} themes are tested. Body text needs 4.5:1 and UI boundaries 3:1 (1.4.3,
          1.4.11). High contrast must reach 7:1 for text and 4.5:1 for boundaries.
        </li>
        <li>
          <strong>axe-core</strong> — every interactive component is rendered in light, dark and
          high contrast and checked for violations.
        </li>
        <li>
          <strong>Keyboard models</strong> — tests drive components with the keyboard following
          WAI-ARIA Authoring Practices: menus, tabs, listboxes, trees, grids, sliders and dialogs.
        </li>
        <li>
          <strong>Focus management</strong> — overlays are tested for focus trapping, Escape
          dismissal and focus restoration.
        </li>
      </ul>
      <h2 id="built-in">Built in</h2>
      <ul>
        <li>
          Visible focus rings on every interactive element (2px, 3px in high contrast), never
          removed.
        </li>
        <li>Target sizes of at least 24×24px (2.5.8); default controls are 40px tall.</li>
        <li>Forced-colours (Windows High Contrast) support with system colours.</li>
        <li>Reduced-motion support: animations collapse to instant transitions.</li>
        <li>
          Form controls wire labels, descriptions and errors through <code>FormField</code>{' '}
          automatically.
        </li>
        <li>Live regions for toasts, copy confirmations and async results.</li>
      </ul>
      <h2 id="your-part">Your part</h2>
      <ul>
        <li>
          Give icon-only buttons a <code>label</code>. <code>IconButton</code> requires one.
        </li>
        <li>
          Give every dialog a <code>DialogTitle</code>.
        </li>
        <li>Don’t rely on colour alone: pair status colours with text or icons.</li>
        <li>
          Keep heading levels in order. Components that render headings accept a <code>level</code>.
        </li>
      </ul>
      <p>
        See <Link href="/guidelines/accessibility-standards">Accessibility standards</Link> for the
        full checklist.
      </p>
    </>
  );
}
