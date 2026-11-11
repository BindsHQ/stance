import { duration, easing } from '@bindshq/stance-tokens';

export default function Motion() {
  return (
    <>
      <p>
        Motion in Stance is quick and purposeful. It confirms cause and effect and is never
        decorative. Every duration drops to zero when the user prefers reduced motion.
      </p>
      <h2 id="durations">Durations</h2>
      <div className="docs-table-wrap" role="region" aria-label="Durations" tabIndex={0}>
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Value</th>
              <th scope="col">Use</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(duration).map(([k, v]) => (
              <tr key={k}>
                <th scope="row">
                  <code>--st-duration-{k}</code>
                </th>
                <td>{v}</td>
                <td>
                  {
                    (
                      {
                        instant: 'State changes with no transition',
                        fast: 'Hover, press, colour changes',
                        normal: 'Popovers, menus, toasts',
                        slow: 'Dialogs, drawers, sheets',
                      } as Record<string, string>
                    )[k]
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 id="easing">Easing</h2>
      <div className="motion-demo">
        {Object.entries(easing).map(([k, v]) => (
          <div key={k} className="motion-demo__row">
            <code>--st-easing-{k}</code>
            <span className="motion-demo__track" aria-hidden="true">
              <span className="motion-demo__dot" style={{ animationTimingFunction: v }} />
            </span>
          </div>
        ))}
      </div>
      <h2 id="rules">Rules</h2>
      <ul>
        <li>
          Enter with <code>emphasized</code> and exit with <code>exit</code>; exits are faster than
          entrances.
        </li>
        <li>Animate opacity and transform only, never layout properties.</li>
        <li>Nothing loops except progress indicators.</li>
      </ul>
    </>
  );
}
