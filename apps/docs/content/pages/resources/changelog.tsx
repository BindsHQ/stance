import { site } from '../../../lib/site';

export default function Changelog() {
  return (
    <>
      <h2 id="v0-1-1">0.1.1</h2>
      <p>Initial release.</p>
      <ul>
        <li>
          Design tokens derived from the official Binds colours, with light, dark and high-contrast
          themes.
        </li>
        <li>Accessible React components with zero runtime dependencies.</li>
        <li>
          ThemeProvider with system detection, persistence, cross-tab sync and legacy preference
          migration.
        </li>
        <li>Tailwind v3 preset and Tailwind v4 theme.</li>
        <li>Documentation site with live previews in all three themes.</li>
      </ul>
      <p>
        The full changelog lives in{' '}
        <a href={`${site.github}/blob/main/CHANGELOG.md`}>CHANGELOG.md</a>.
      </p>
    </>
  );
}
