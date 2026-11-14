const assets: { group: string; items: { file: string; label: string; size?: string }[] }[] = [
  {
    group: 'Logo (SVG, recommended)',
    items: [
      { file: 'stance-logo-indigo.svg', label: 'Full logo, indigo, for light backgrounds' },
      { file: 'stance-logo-ivory.svg', label: 'Full logo, ivory, for dark backgrounds' },
      { file: 'stance-logo.svg', label: 'Full logo, currentColor' },
    ],
  },
  {
    group: 'Mark (SVG, recommended)',
    items: [
      { file: 'stance-mark-indigo.svg', label: 'Mark, indigo' },
      { file: 'stance-mark-ivory.svg', label: 'Mark, ivory' },
      { file: 'stance-mark.svg', label: 'Mark, currentColor' },
      { file: 'stance-app-icon.svg', label: 'App icon, ivory mark on indigo' },
    ],
  },
  {
    group: 'PNG',
    items: [
      { file: 'stance-logo-indigo.png', label: 'Full logo, indigo', size: '1682×376' },
      { file: 'stance-logo-indigo@2x.png', label: 'Full logo, indigo', size: '3364×752' },
      { file: 'stance-logo-ivory.png', label: 'Full logo, ivory', size: '1682×376' },
      { file: 'stance-logo-ivory@2x.png', label: 'Full logo, ivory', size: '3364×752' },
      { file: 'stance-mark-indigo.png', label: 'Mark, indigo', size: '382×376' },
      { file: 'stance-mark-indigo@2x.png', label: 'Mark, indigo', size: '764×752' },
      { file: 'stance-mark-ivory.png', label: 'Mark, ivory', size: '382×376' },
      { file: 'stance-mark-ivory@2x.png', label: 'Mark, ivory', size: '764×752' },
    ],
  },
];

export default function Brand() {
  return (
    <>
      <p>
        The Stance logo combines a four-part mark, four quarters held in balance around a shared
        centre, with the lowercase wordmark. It uses only the two Binds colours.
      </p>
      <div className="brand-showcase">
        <figure className="brand-showcase__tile" data-tone="light">
          <img
            src="/brand/stance-logo-indigo.svg"
            alt="Stance logo in indigo on ivory"
            width={336}
            height={75}
          />
          <figcaption>Indigo on ivory</figcaption>
        </figure>
        <figure className="brand-showcase__tile" data-tone="dark">
          <img
            src="/brand/stance-logo-ivory.svg"
            alt="Stance logo in ivory on indigo"
            width={336}
            height={75}
          />
          <figcaption>Ivory on indigo</figcaption>
        </figure>
        <figure className="brand-showcase__tile" data-tone="light">
          <img
            src="/brand/stance-mark-indigo.svg"
            alt="Stance mark in indigo"
            width={96}
            height={94}
          />
          <figcaption>Mark</figcaption>
        </figure>
        <figure className="brand-showcase__tile" data-tone="light">
          <img
            src="/brand/stance-app-icon.svg"
            alt="Stance app icon: ivory mark on an indigo tile"
            width={96}
            height={96}
          />
          <figcaption>App icon and favicon</figcaption>
        </figure>
      </div>

      <h2 id="usage">Usage</h2>
      <ul>
        <li>
          <strong>Colours:</strong> indigo <code>#140C2E</code> on light backgrounds, ivory{' '}
          <code>#FCF6EB</code> on dark ones. No other colours, outlines, shadows or effects.
        </li>
        <li>
          <strong>Clear space:</strong> keep at least half the mark’s height free around the logo.
        </li>
        <li>
          <strong>Minimum size:</strong> full logo 80px wide; mark 16px (favicon artwork is tuned
          for 16 to 48px).
        </li>
        <li>
          <strong>On the web:</strong> use the <code>currentColor</code> SVGs inline so the logo
          follows light, dark and high-contrast themes.
        </li>
        <li>
          <strong>Don’t</strong> stretch, rotate, rearrange the mark and wordmark, or set “stance”
          in another typeface.
        </li>
      </ul>

      <h2 id="downloads">Downloads</h2>
      {assets.map((g) => (
        <section key={g.group} aria-labelledby={`dl-${g.group}`}>
          <h3 id={`dl-${g.group}`}>{g.group}</h3>
          <ul className="brand-downloads">
            {g.items.map((a) => (
              <li key={a.file}>
                <a href={`/brand/${a.file}`} download>
                  {a.label}
                  <span className="docs-muted">
                    {' '}
                    · {a.file}
                    {a.size ? ` · ${a.size}` : ''}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="docs-muted">
        SVGs are traced from the original artwork and verified against it (99.8% overlap). PNGs are
        optimised losslessly. The Binds and Stance names and logos are trademarks of Binds and are
        not covered by the Apache License. See the trademark policy.
      </p>
    </>
  );
}
