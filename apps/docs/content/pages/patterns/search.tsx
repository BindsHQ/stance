export default function SearchPattern() {
  return (
    <>
      <p>Search finds a known item; filters narrow a list. Most list screens need both.</p>
      <h2 id="search">Search</h2>
      <ul>
        <li>
          Put the search field above the list it searches, with a visible label or a clear
          placeholder and an accessible name.
        </li>
        <li>
          Search as the person types for local lists; debounce and show a loading state for remote
          ones.
        </li>
        <li>
          Announce the number of results to screen readers, and keep the query visible with a clear
          button.
        </li>
        <li>For an empty result, say what was searched and suggest how to widen it.</li>
      </ul>
      <h2 id="filters">Filters</h2>
      <ul>
        <li>
          Show active filters as chips that state the field and the value, each removable, with
          “Clear all”.
        </li>
        <li>
          Apply filters immediately on large screens. On phones, collect them in a sheet with an
          Apply action.
        </li>
        <li>Keep filter state in the URL on the web so views can be shared.</li>
      </ul>
      <h2 id="components">Components</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="Search components by platform"
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
              <th scope="row">Search field</th>
              <td>SearchInput</td>
              <td>searchable, StanceSearchField</td>
              <td>StanceSearchBar</td>
            </tr>
            <tr>
              <th scope="row">Filters</th>
              <td>FilterBar, FilterChip</td>
              <td>StanceFilterBar</td>
              <td>StanceFilterBar, StanceFilterChip</td>
            </tr>
            <tr>
              <th scope="row">Results</th>
              <td>SearchableList, Combobox</td>
              <td>StanceSearchableList</td>
              <td>StanceSearchableList</td>
            </tr>
            <tr>
              <th scope="row">Global search</th>
              <td>CommandPalette</td>
              <td>System search</td>
              <td>Search bar in the top app bar</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
