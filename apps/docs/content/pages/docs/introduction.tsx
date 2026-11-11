import Link from 'next/link';

export default function Introduction() {
  return (
    <>
      <p>
        Stance is the official design system of Binds. It is the single source of truth for the
        visual language, design tokens, components, accessibility standards and interaction patterns
        shared across Binds products, including binds.si and eSignify.
      </p>
      <h2 id="what-is-in-the-box">What is in the box</h2>
      <ul>
        <li>
          <strong>
            <code>@bindshq/stance-tokens</code>
          </strong>
          : colour, typography, spacing, radius, elevation, motion, z-index and breakpoint tokens,
          delivered as CSS custom properties, typed JavaScript, JSON, a Tailwind v3 preset and a
          Tailwind v4 theme.
        </li>
        <li>
          <strong>
            <code>@bindshq/stance-react</code>
          </strong>
          : accessible React components with zero runtime dependencies, plain CSS styling and
          support for React 18 and 19.
        </li>
        <li>
          <strong>Three appearance modes</strong>: light, dark and high contrast, all built from the
          two official Binds colours, with system preference detection and no flash on load.
        </li>
      </ul>
      <h2 id="one-system">One system, distinct products</h2>
      <p>
        Stance standardises the <em>foundations</em> (tokens, primitives and interaction behaviour)
        without imposing a layout. Binds and eSignify keep their own navigation, information
        architecture and page compositions while sharing the same underlying design language. Stance
        ships no universal dashboard template on purpose.
      </p>
      <h2 id="principles">Principles in brief</h2>
      <ol>
        <li>
          <strong>Brand-true.</strong> Ivory <code>#FCF6EB</code> and indigo <code>#140C2E</code>{' '}
          are the only brand colours. Every neutral is derived from them.
        </li>
        <li>
          <strong>Accessible by default.</strong> WCAG 2.2 AA is the floor, verified by automated
          contrast and axe tests.
        </li>
        <li>
          <strong>Own the stack.</strong> No runtime dependencies: focus management, positioning,
          date maths and virtualisation are implemented in Stance.
        </li>
        <li>
          <strong>Compose, don’t configure.</strong> Small parts that combine, instead of components
          with hundreds of props.
        </li>
      </ol>
      <p>
        Continue with <Link href="/docs/installation">Installation</Link>, or browse the{' '}
        <Link href="/components">component library</Link>.
      </p>
    </>
  );
}
