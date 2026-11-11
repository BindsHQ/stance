import { Code } from '../../../components/code';

export default function Installation() {
  return (
    <>
      <h2 id="install">Install the packages</h2>
      <Code language="bash" code={`npm install @bindshq/stance-tokens @bindshq/stance-react`} />
      <p>
        <code>react</code> and <code>react-dom</code> (18.2 or later) are peer dependencies. Stance
        has no other runtime dependencies.
      </p>
      <h2 id="styles">Import the styles once</h2>
      <p>Import the token variables, then the component styles, at the root of your application.</p>
      <Code
        title="app/layout.tsx"
        code={`import '@bindshq/stance-tokens/css';
import '@bindshq/stance-react/styles.css';
// Optional: base body styles for apps adopting Stance fully
import '@bindshq/stance-react/global.css';`}
      />
      <p>
        <code>styles.css</code> only targets <code>.st-*</code> classes, so it never restyles your
        existing markup. <code>global.css</code> is opt-in and sets the page background, text
        colour, font and focus ring.
      </p>
      <h2 id="font">Load DM Sans</h2>
      <p>
        Stance’s typeface is DM Sans. The token <code>--st-font-sans</code> picks up the{' '}
        <code>--font-dm-sans</code> variable created by <code>next/font</code>:
      </p>
      <Code
        code={`import { DM_Sans } from 'next/font/google';
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

export default function RootLayout({ children }) {
  return <html lang="en" className={dmSans.variable}>…</html>;
}`}
      />
      <h2 id="tailwind">Using Tailwind</h2>
      <p>
        Stance does not require Tailwind, but ships presets so utility classes use real Stance
        tokens.
      </p>
      <Code
        title="tailwind.config.ts (v3)"
        code={`import stance from '@bindshq/stance-tokens/tailwind';

export default {
  presets: [stance],
  content: ['./src/**/*.{ts,tsx}'],
};
// <div className="bg-stance-bg-surface text-stance-fg-muted rounded-stance-lg" />`}
      />
      <Code
        title="globals.css (v4)"
        language="css"
        code={`@import 'tailwindcss';\n@import '@bindshq/stance-tokens/tailwind-v4.css';`}
      />
      <h2 id="requirements">Requirements</h2>
      <ul>
        <li>React 18.2+ or 19, any bundler with ESM support (Next.js 14+, Vite, Remix).</li>
        <li>
          Modern evergreen browsers. CSS uses custom properties, <code>color-mix()</code> in
          presets, and <code>:focus-visible</code>.
        </li>
        <li>
          Components marked <code>'use client'</code> work in Next.js server component trees without
          wrappers.
        </li>
      </ul>
    </>
  );
}
