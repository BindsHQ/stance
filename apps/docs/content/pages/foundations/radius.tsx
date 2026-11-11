import { radius } from '@bindshq/stance-tokens';

export default function Radius() {
  return (
    <>
      <p>
        Radii are restrained and geometric. Controls use <code>md</code> (8px), surfaces use{' '}
        <code>lg</code>–<code>xl</code>, and pills are reserved for chips, switches and marketing
        calls to action.
      </p>
      <div className="radius-grid">
        {Object.entries(radius).map(([k, v]) => (
          <figure key={k} className="radius-grid__item">
            <span className="radius-grid__box" style={{ borderRadius: v }} aria-hidden="true" />
            <figcaption>
              <code>--st-radius-{k}</code>
              <span className="docs-muted">{v}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <h2 id="nesting">Nesting</h2>
      <p>
        When nesting rounded surfaces, the inner radius is the outer radius minus the padding
        between them, so curves stay concentric.
      </p>
    </>
  );
}
