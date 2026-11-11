import { fontSize, fontWeight, letterSpacing, lineHeight } from '@bindshq/stance-tokens';

export default function Typography() {
  return (
    <>
      <p>
        Stance sets type in <strong>DM Sans</strong>, the typeface Binds and eSignify already use,
        on a minor-third scale (×1.2) anchored at 16px. The hierarchy comes from size and weight;
        colour stays restrained.
      </p>
      <h2 id="scale">Type scale</h2>
      <div className="type-scale">
        {Object.entries(fontSize)
          .reverse()
          .map(([k, v]) => (
            <div key={k} className="type-scale__row">
              <code className="type-scale__token">--st-font-size-{k}</code>
              <span className="type-scale__meta">
                {v} · {parseFloat(v) * 16}px
              </span>
              <span
                className="type-scale__sample"
                style={{
                  fontSize: v,
                  lineHeight: parseFloat(v) >= 1.75 ? 1.1 : 1.4,
                  letterSpacing: parseFloat(v) >= 1.75 ? '-0.025em' : undefined,
                }}
              >
                Contracts, signed in minutes
              </span>
            </div>
          ))}
      </div>
      <h2 id="weights">Weights</h2>
      <div className="weights">
        {Object.entries(fontWeight).map(([k, v]) => (
          <div key={k} className="weights__item">
            <span style={{ fontWeight: Number(v), fontSize: '1.75rem' }}>Aa</span>
            <code>--st-font-weight-{k}</code>
            <span className="docs-muted">{v}</span>
          </div>
        ))}
      </div>
      <h2 id="line-height">Line height and tracking</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="Line heights and letter spacing"
        tabIndex={0}
      >
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Value</th>
              <th scope="col">Use</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(lineHeight).map(([k, v]) => (
              <tr key={k}>
                <th scope="row">
                  <code>--st-line-height-{k}</code>
                </th>
                <td>{v}</td>
                <td>
                  {
                    (
                      {
                        tight: 'Display headings',
                        snug: 'Headings, labels',
                        normal: 'UI text',
                        relaxed: 'Long-form reading',
                      } as Record<string, string>
                    )[k]
                  }
                </td>
              </tr>
            ))}
            {Object.entries(letterSpacing).map(([k, v]) => (
              <tr key={k}>
                <th scope="row">
                  <code>--st-letter-spacing-{k}</code>
                </th>
                <td>{v}</td>
                <td>
                  {
                    (
                      {
                        tighter: 'Display sizes (36px+)',
                        tight: 'Headings and buttons',
                        normal: 'Body',
                        wide: 'Small labels',
                        caps: 'Uppercase eyebrows',
                      } as Record<string, string>
                    )[k]
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 id="guidance">Guidance</h2>
      <ul>
        <li>
          Body text is 16px (<code>md</code>) on reading surfaces and 14px (<code>sm</code>) in
          dense application UI.
        </li>
        <li>
          Never set text below 12px (<code>xs</code>). <code>2xs</code> is reserved for badges and
          counters.
        </li>
        <li>Use semibold (600) for headings and emphasis. Bold (700) is for display sizes only.</li>
        <li>Keep measure between 60 and 80 characters for long-form text.</li>
      </ul>
    </>
  );
}
