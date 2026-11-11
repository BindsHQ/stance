import { site } from '../../../lib/site';

export default function Releases() {
  return (
    <>
      <h2 id="current">Current release: v{site.version}</h2>
      <p>The first public release of Stance, and the version Binds and eSignify adopt first.</p>
      <ul>
        <li>
          <a href={`${site.github}/releases`}>GitHub releases</a>
        </li>
        <li>
          <a href={site.npmTokens}>@bindshq/stance-tokens on npm</a>
        </li>
        <li>
          <a href={site.npmReact}>@bindshq/stance-react on npm</a>
        </li>
      </ul>
      <h2 id="versioning">Versioning</h2>
      <p>
        Stance follows semantic versioning. Both packages are released together with the same
        version number. While in 0.x, breaking changes may appear in minor releases. They are always
        called out in the changelog with migration notes and never shipped in a patch.
      </p>
      <h2 id="adoption">Adoption policy</h2>
      <p>
        Products pin an exact Stance version and upgrade deliberately, after testing. They never
        auto-update.
      </p>
    </>
  );
}
