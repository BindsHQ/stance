export default function DataTablesPattern() {
  return (
    <>
      <p>
        Tables let people scan, compare and act on many records. Choose the lightest option that
        does the job.
      </p>
      <h2 id="choosing">Choosing a component</h2>
      <ul>
        <li>
          <strong>Table</strong> — static, read-only rows.
        </li>
        <li>
          <strong>DataTable</strong> — sorting, selection and pagination over records you already
          have.
        </li>
        <li>
          <strong>DataGrid</strong> — spreadsheet-like work: cell navigation, inline editing,
          resizable columns and very long lists.
        </li>
      </ul>
      <h2 id="design">Design</h2>
      <ul>
        <li>Left-align text, right-align numbers, and use tabular figures so digits line up.</li>
        <li>The first column identifies the row and is a row header for screen readers.</li>
        <li>
          Give every table a caption or label. Wide tables scroll inside their own labelled region,
          never the page.
        </li>
        <li>Bulk actions appear when rows are selected and say how many are selected.</li>
        <li>
          Row actions go in a menu at the end of the row; the most common one can also be a link on
          the row title.
        </li>
      </ul>
      <h2 id="small-screens">Small screens</h2>
      <p>
        A table with more than three columns rarely works on a phone. Show each record as a list
        item with the two most important fields, and open the full record on tap. On iOS and Android
        this is the default pattern.
      </p>
      <h2 id="components">Components</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="Table components by platform"
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
              <th scope="row">Records</th>
              <td>Table, DataTable, DataGrid</td>
              <td>List with StanceList rows; Table on iPad</td>
              <td>StanceListItem; StanceDataTable on large screens</td>
            </tr>
            <tr>
              <th scope="row">Filtering</th>
              <td>FilterBar, SearchInput</td>
              <td>StanceFilterBar, searchable</td>
              <td>StanceFilterBar, StanceSearchBar</td>
            </tr>
            <tr>
              <th scope="row">Paging</th>
              <td>Pagination</td>
              <td>Infinite scrolling</td>
              <td>Infinite scrolling</td>
            </tr>
            <tr>
              <th scope="row">Row actions</th>
              <td>ActionMenu</td>
              <td>Swipe actions, context menu</td>
              <td>Swipe actions, dropdown menu</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
