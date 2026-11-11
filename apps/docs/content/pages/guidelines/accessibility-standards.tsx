export default function AccessibilityStandards() {
  const checks = [
    [
      'Perceivable',
      [
        'Text contrast ≥ 4.5:1; large text and UI boundaries ≥ 3:1',
        'Information is never conveyed by colour alone',
        'Images have alt text; decorative icons are hidden',
        'Content reflows at 320px and 400% zoom',
      ],
    ],
    [
      'Operable',
      [
        'Everything works with a keyboard, in a logical order',
        'Focus is always visible and never obscured by sticky headers (2.4.11)',
        'Targets are at least 24×24px (2.5.8)',
        'No keyboard traps except intentional modal focus scopes with Escape',
        'Dragging has a single-pointer alternative (2.5.7)',
      ],
    ],
    [
      'Understandable',
      [
        'Every input has a visible label',
        'Errors are identified in text and linked with aria-describedby',
        'Consistent help and navigation across pages (3.2.6)',
        'Authentication does not rely on cognitive tests (3.3.8)',
      ],
    ],
    [
      'Robust',
      [
        'Native elements before ARIA; ARIA follows the APG patterns',
        'Status messages use live regions (4.1.3)',
        'Names, roles and values are exposed for custom widgets',
      ],
    ],
  ] as const;
  return (
    <>
      <p>
        Use this checklist when building product screens with Stance. It summarises WCAG 2.2 AA as
        it applies to Binds products.
      </p>
      {checks.map(([title, items]) => (
        <section key={title} aria-labelledby={`a11y-${title}`}>
          <h2 id={`a11y-${title}`}>{title}</h2>
          <ul>
            {items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      ))}
      <h2 id="testing">Testing a screen</h2>
      <ol>
        <li>Tab through the whole flow without a mouse.</li>
        <li>Run axe DevTools or Lighthouse and fix all violations.</li>
        <li>Check the flow with VoiceOver (macOS/iOS) or NVDA (Windows).</li>
        <li>Switch to high contrast, zoom to 200%, and enable reduced motion.</li>
      </ol>
    </>
  );
}
