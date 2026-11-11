import Link from 'next/link';

export default function Platforms() {
  return (
    <>
      <p>
        Stance is one design language with three native implementations: React for the web, SwiftUI
        for iOS and iPadOS, and Jetpack Compose for Android. They share a single token source and
        the same semantic roles, and each one uses its platform’s own controls, navigation and
        accessibility features.
      </p>
      <h2 id="what-is-shared">What is shared</h2>
      <ul>
        <li>
          <strong>Brand.</strong> Ivory <code>#FCF6EB</code> and indigo <code>#140C2E</code>, and
          the ink scale between them.
        </li>
        <li>
          <strong>Tokens.</strong> Colour roles, type scale, spacing, radius, elevation and motion
          come from one source and are generated for CSS, Swift and Kotlin.
        </li>
        <li>
          <strong>Themes.</strong> Light, dark and high contrast exist on every platform and follow
          the system setting by default.
        </li>
        <li>
          <strong>Meaning.</strong> A primary action, a danger tone or an error state means the same
          thing everywhere.
        </li>
        <li>
          <strong>The accessibility bar.</strong> Contrast is verified from the same tokens on every
          platform.
        </li>
      </ul>
      <h2 id="what-adapts">What adapts</h2>
      <div className="docs-table-wrap" role="region" aria-label="Platform adaptation" tabIndex={0}>
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Concern</th>
              <th scope="col">Web</th>
              <th scope="col">iOS and iPadOS</th>
              <th scope="col">Android</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Navigation</th>
              <td>Sidebar, tabs, breadcrumbs</td>
              <td>NavigationStack, TabView, split view on iPad</td>
              <td>Navigation bar, rail or drawer by window size</td>
            </tr>
            <tr>
              <th scope="row">Dialogs</th>
              <td>Dialog, AlertDialog</td>
              <td>System alerts and confirmation dialogs</td>
              <td>Material dialogs</td>
            </tr>
            <tr>
              <th scope="row">Secondary surfaces</th>
              <td>Drawer, Popover</td>
              <td>Sheets with detents</td>
              <td>Modal bottom sheets</td>
            </tr>
            <tr>
              <th scope="row">Transient feedback</th>
              <td>Toast</td>
              <td>Toast overlay, banners</td>
              <td>Snackbar</td>
            </tr>
            <tr>
              <th scope="row">Date and time</th>
              <td>Stance Calendar and pickers</td>
              <td>System DatePicker</td>
              <td>Material pickers</td>
            </tr>
            <tr>
              <th scope="row">Text scaling</th>
              <td>rem units, browser zoom</td>
              <td>Dynamic Type</td>
              <td>sp units, system font scale</td>
            </tr>
            <tr>
              <th scope="row">Minimum target</th>
              <td>24px (40px default controls)</td>
              <td>44pt</td>
              <td>48dp</td>
            </tr>
            <tr>
              <th scope="row">Screen reader</th>
              <td>ARIA, semantic HTML</td>
              <td>VoiceOver</td>
              <td>TalkBack</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Consistency means the same roles, meaning and quality bar. It does not mean identical
        pixels.
      </p>
      <h2 id="upgrades">Designed to upgrade</h2>
      <ul>
        <li>
          A design change is one edit to the token source; CSS, Swift and Kotlin are regenerated
          from it and checked for parity in CI.
        </li>
        <li>
          Components depend on role names, never on values, so values can evolve without code
          changes.
        </li>
        <li>
          When Apple or Google revise their design language, the change is absorbed in a thin theme
          layer, because Stance wraps system controls instead of reimplementing them.
        </li>
        <li>
          Each platform package has its own semantic version; a compatibility table records which
          token version each release was generated from.
        </li>
        <li>
          Removals are deprecated first, with compiler warnings on native platforms, and removed
          only in a later breaking release.
        </li>
      </ul>
      <h2 id="status">Status</h2>
      <p>
        The web packages are at 0.1.1. The iOS and Android libraries are in development at 0.1.0 and
        are not yet published. Binds and eSignify are web products today; there are no native Binds
        apps, so no native product has been migrated. See <Link href="/ios/installation">iOS</Link>{' '}
        and <Link href="/android/installation">Android</Link>.
      </p>
    </>
  );
}
