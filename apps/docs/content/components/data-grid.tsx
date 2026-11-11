import * as React from 'react';
import { DataGrid, type DataGridColumn } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'data-grid',
  name: 'DataGrid',
  category: 'advanced',
  summary:
    'A spreadsheet-style grid with cell navigation, in-place editing, resizable columns and virtualised rows.',
  description:
    'Use DataGrid when people work inside the data: bulk-editing signature fields for hundreds of mailboxes, or reviewing large imports. It implements the WAI-ARIA grid pattern with a single tab stop and arrow-key navigation, and only renders visible rows. For read-mostly collections with sorting and selection, use DataTable.',
  imports: ['DataGrid'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Editable grid', layout: 'fill' },
    {
      name: 'LargeDataset',
      title: '10,000 rows',
      description: 'Rows are virtualised. Only the visible window plus an overscan is mounted.',
      layout: 'fill',
    },
    {
      name: 'PinnedColumn',
      title: 'Pinned first column',
      description: 'The first column stays visible while scrolling horizontally.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'DataGrid',
      name: 'columns',
      type: 'DataGridColumn<T>[]',
      required: true,
      description: 'id, header, accessor or cell, width, minWidth, maxWidth, editable, align.',
    },
    {
      component: 'DataGrid',
      name: 'data',
      type: 'readonly T[]',
      required: true,
      description: 'Rows. Update them in onCellEdit to reflect edits.',
    },
    {
      component: 'DataGrid',
      name: 'aria-label',
      type: 'string',
      required: true,
      description: 'Accessible name of the grid.',
    },
    {
      component: 'DataGrid',
      name: 'getRowId',
      type: '(row: T, index: number) => string',
      default: 'index',
      description: 'Stable row id passed to onCellEdit.',
    },
    {
      component: 'DataGrid',
      name: 'onCellEdit',
      type: '({ rowId, columnId, value, row }) => void',
      description: 'Called when an edit is committed with a changed value.',
    },
    {
      component: 'DataGrid',
      name: 'height',
      type: 'number',
      default: '400',
      description: 'Viewport height in px.',
    },
    {
      component: 'DataGrid',
      name: 'rowHeight',
      type: 'number',
      default: '40',
      description: 'Row height in px.',
    },
    {
      component: 'DataGrid',
      name: 'overscan',
      type: 'number',
      default: '6',
      description: 'Rows rendered beyond the viewport.',
    },
    {
      component: 'DataGrid',
      name: 'pinFirstColumn',
      type: 'boolean',
      default: 'false',
      description: 'Keep the first column visible on horizontal scroll.',
    },
    {
      component: 'DataGrid',
      name: 'resizableColumns',
      type: 'boolean',
      default: 'true',
      description: 'Show resize handles in headers.',
    },
    {
      component: 'DataGrid',
      name: 'columnWidths',
      type: 'Record<string, number>',
      description: 'Controlled column widths in px.',
    },
    {
      component: 'DataGrid',
      name: 'defaultColumnWidths',
      type: 'Record<string, number>',
      description: 'Initial widths when uncontrolled.',
    },
    {
      component: 'DataGrid',
      name: 'onColumnWidthsChange',
      type: '(widths: Record<string, number>) => void',
      description: 'Called when a column is resized.',
    },
  ],
  accessibility: [
    'Implements the WAI-ARIA grid pattern: role="grid" with rows, column headers and grid cells, plus aria-rowcount and aria-rowindex so virtualised rows report their true position.',
    'The grid is a single tab stop; arrow keys move between cells (roving tabindex).',
    'Read-only cells in an editable grid are marked aria-readonly.',
    'Column resize handles are focusable separators with aria-valuenow, reachable with Enter from the header cell.',
    'Committed and cancelled edits are announced in a polite live region.',
  ],
  keyboard: [
    { keys: ['←', '→', '↑', '↓'], description: 'Move to the adjacent cell.' },
    { keys: ['Home', 'End'], description: 'First or last cell in the row.' },
    { keys: ['Ctrl', 'Home'], description: 'First cell of the grid (header row).' },
    { keys: ['Ctrl', 'End'], description: 'Last cell of the grid.' },
    { keys: ['Page Down', 'Page Up'], description: 'Move one visible page of rows.' },
    {
      keys: ['Enter', 'F2'],
      description: 'Edit the cell. On a header cell, focus its resize handle.',
    },
    {
      keys: ['Any character'],
      description: 'Start editing an editable cell, replacing its value.',
    },
    { keys: ['Enter'], description: 'While editing: commit.' },
    {
      keys: ['Escape'],
      description: 'While editing: cancel. On a resize handle: return to the header.',
    },
    { keys: ['←', '→'], description: 'On a resize handle: resize by 10px (Shift: 50px).' },
  ],
  guidelines: {
    do: [
      'Mark only the columns people should change as editable.',
      'Persist edits optimistically and surface failures inline.',
    ],
    dont: [
      'Use DataGrid for simple lists; a DataTable is easier to read and navigate.',
      'Put complex widgets in cells; link out to a detail view instead.',
    ],
  },
  related: ['data-table', 'virtualized-list', 'table'],
};

interface Field {
  id: string;
  name: string;
  title: string;
  phone: string;
  office: string;
}

const offices = ['Ljubljana', 'London', 'Berlin', 'Lisbon'];
const titles = ['Account Executive', 'Legal Counsel', 'Finance Lead', 'Customer Success'];
const first = ['Priya', 'Amara', 'Lukas', 'Hana', 'Tomás', 'Owen', 'Zainab', 'Mateja'];
const last = ['Nair', 'Okafor', 'Brenner', 'Sato', 'Ruiz', 'Price', 'Haddad', 'Kovač'];

function makeFields(count: number): Field[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `m${i}`,
    name: `${first[i % 8]} ${last[(i * 3) % 8]}`,
    title: titles[i % 4]!,
    phone: `+386 1 ${String(4000 + i).padStart(4, '0')} ${String(10 + (i % 90))}`,
    office: offices[i % 4]!,
  }));
}

const columns: DataGridColumn<Field>[] = [
  { id: 'name', header: 'Name', accessor: 'name', width: 180 },
  { id: 'title', header: 'Job title', accessor: 'title', editable: true, width: 200 },
  { id: 'phone', header: 'Phone', accessor: 'phone', editable: true, width: 170 },
  { id: 'office', header: 'Office', accessor: 'office', editable: true, width: 140 },
];

export function Basic() {
  const [data, setData] = React.useState(() => makeFields(40));
  return (
    <DataGrid
      aria-label="Signature fields"
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      height={320}
      onCellEdit={({ rowId, columnId, value }) =>
        setData((rows) => rows.map((r) => (r.id === rowId ? { ...r, [columnId]: value } : r)))
      }
    />
  );
}

export function LargeDataset() {
  const data = React.useMemo(() => makeFields(10000), []);
  return (
    <DataGrid
      aria-label="All mailboxes"
      columns={columns.map((c) => ({ ...c, editable: false }))}
      data={data}
      getRowId={(r) => r.id}
      height={360}
    />
  );
}

export function PinnedColumn() {
  const wide: DataGridColumn<Field>[] = [
    ...columns,
    {
      id: 'email',
      header: 'Email',
      accessor: (r) => `${r.name.toLowerCase().replace(/\s+/g, '.')}@binds.si`,
      width: 260,
    },
    { id: 'template', header: 'Template', accessor: () => 'Standard signature', width: 200 },
  ];
  return (
    <div style={{ maxWidth: 560 }}>
      <DataGrid
        aria-label="Mailboxes"
        columns={wide}
        data={makeFields(30)}
        getRowId={(r) => r.id}
        height={280}
        pinFirstColumn
      />
    </div>
  );
}
