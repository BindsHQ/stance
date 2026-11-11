import { size, space } from '@bindshq/stance-tokens';

export default function Spacing() {
  return (
    <>
      <p>
        Spacing follows a 4px grid. Use the scale for padding, gaps and margins so layouts align
        across products.
      </p>
      <h2 id="scale">Space scale</h2>
      <div className="space-scale">
        {Object.entries(space)
          .filter(([k]) => k !== '0' && k !== 'px')
          .map(([k, v]) => (
            <div key={k} className="space-scale__row">
              <code>--st-space-{k.replace('.', '-')}</code>
              <span className="docs-muted">
                {v} · {parseFloat(v) * 16}px
              </span>
              <span className="space-scale__bar" style={{ width: v }} aria-hidden="true" />
            </div>
          ))}
      </div>
      <h2 id="controls">Control sizes</h2>
      <p>Buttons, inputs and selects share heights, so mixed controls in a row align.</p>
      <div className="docs-table-wrap" role="region" aria-label="Size tokens" tabIndex={0}>
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(size).map(([k, v]) => (
              <tr key={k}>
                <th scope="row">
                  <code>--st-size-{k}</code>
                </th>
                <td>
                  {v} ({parseFloat(v) * 16}px)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 id="rhythm">Rhythm</h2>
      <ul>
        <li>
          <strong>4–8px</strong> between related elements, such as an icon and its label or a label
          and its input.
        </li>
        <li>
          <strong>12–16px</strong> between fields in a form and items in a list.
        </li>
        <li>
          <strong>24–32px</strong> between groups and card padding on desktop.
        </li>
        <li>
          <strong>48–96px</strong> between page sections.
        </li>
      </ul>
    </>
  );
}
