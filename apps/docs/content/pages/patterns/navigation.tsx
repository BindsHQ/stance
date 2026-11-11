export default function NavigationPattern() {
  return (
    <>
      <p>
        Navigation tells people where they are and where they can go. Stance supplies navigation
        primitives; each product decides its own structure.
      </p>
      <h2 id="levels">Levels</h2>
      <ul>
        <li>
          <strong>Product areas</strong> (three to seven destinations): a sidebar on the web, a tab
          bar on iPhone, a navigation bar on Android phones.
        </li>
        <li>
          <strong>Sections within an area:</strong> tabs.
        </li>
        <li>
          <strong>Depth:</strong> breadcrumbs on the web, the back stack on mobile.
        </li>
        <li>
          <strong>Jumping anywhere:</strong> a command palette on the web, search on mobile.
        </li>
      </ul>
      <h2 id="adaptive">Adapting to screen size</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="Navigation by platform and size"
        tabIndex={0}
      >
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Web</th>
              <th scope="col">iOS and iPadOS</th>
              <th scope="col">Android</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Compact</th>
              <td>TabBar or a drawer</td>
              <td>StanceAdaptiveNavigation (tab bar)</td>
              <td>StanceNavigationBar</td>
            </tr>
            <tr>
              <th scope="row">Medium</th>
              <td>Collapsed sidebar</td>
              <td>Sidebar that can hide</td>
              <td>StanceNavigationRail</td>
            </tr>
            <tr>
              <th scope="row">Expanded</th>
              <td>Sidebar</td>
              <td>StanceAdaptiveNavigation (sidebar)</td>
              <td>StanceNavigationDrawer</td>
            </tr>
            <tr>
              <th scope="row">Automatic switching</th>
              <td>CSS breakpoints</td>
              <td>Size classes</td>
              <td>StanceAdaptiveNavigation</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 id="rules">Rules</h2>
      <ul>
        <li>
          Mark the current destination (<code>aria-current</code> on the web; selected state on
          native).
        </li>
        <li>Keep destinations in the same order on every screen size.</li>
        <li>
          Icons need labels. An icon-only bar is acceptable only when collapsed and with tooltips or
          accessibility labels.
        </li>
        <li>
          On Android, support the system back gesture and predictive back. On iOS, never replace the
          system back button or the edge swipe.
        </li>
      </ul>
    </>
  );
}
