export default function DashboardsPattern() {
  return (
    <>
      <p>
        A dashboard answers “what needs my attention?” in a few seconds. Lead with the numbers and
        lists that drive action, not with decoration.
      </p>
      <h2 id="hierarchy">Hierarchy</h2>
      <ol>
        <li>
          <strong>Page title and primary action.</strong>
        </li>
        <li>
          <strong>Key figures.</strong> Three or four stat cards, each with a label, a value and a
          change described in words.
        </li>
        <li>
          <strong>Work lists.</strong> Recent or pending items in a table or list, with a clear
          route to the full view.
        </li>
        <li>
          <strong>Secondary charts.</strong> Only when a trend changes a decision.
        </li>
      </ol>
      <h2 id="states">States</h2>
      <ul>
        <li>
          <strong>Loading:</strong> skeletons in the shape of the content, never a blank page or a
          full-screen spinner.
        </li>
        <li>
          <strong>Empty:</strong> say what will appear here and offer the action that creates the
          first item.
        </li>
        <li>
          <strong>Error:</strong> explain what failed, keep what did load, and offer retry.
        </li>
      </ul>
      <h2 id="components">Components</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="Dashboard components by platform"
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
              <th scope="row">Figures</th>
              <td>StatCard, Sparkline</td>
              <td>StanceStatCard</td>
              <td>StanceStatCard</td>
            </tr>
            <tr>
              <th scope="row">Lists</th>
              <td>DataTable, List</td>
              <td>StanceList rows</td>
              <td>StanceListItem, StanceDataTable</td>
            </tr>
            <tr>
              <th scope="row">Loading and empty</th>
              <td>Skeleton, EmptyState</td>
              <td>StanceSkeleton, StanceEmptyState</td>
              <td>StanceSkeleton, StanceEmptyState</td>
            </tr>
            <tr>
              <th scope="row">Charts</th>
              <td>ChartContainer, BarChart</td>
              <td>Swift Charts styled with Stance tokens</td>
              <td>A chart library styled with Stance tokens</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 id="adaptive">Adaptive layout</h2>
      <p>
        Use an auto-fitting grid so cards reflow from four columns to one. On phones, stat cards
        stack or scroll horizontally, and tables become lists. Each product keeps its own shell;
        Stance does not ship a dashboard template.
      </p>
    </>
  );
}
