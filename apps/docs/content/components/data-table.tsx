import * as React from 'react';
import {
  Badge,
  Button,
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'data-table',
  name: 'DataTable',
  category: 'advanced',
  summary: 'A table for records with sorting, row selection, pagination, loading and empty states.',
  description:
    'Use DataTable to present collections people scan, compare and act on, such as organisation users, signature deployments or contracts. It composes the semantic Table primitives, so it stays a real HTML table for assistive technology. For spreadsheet-style editing and very large datasets, use DataGrid.',
  imports: ['DataTable'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    {
      name: 'Selection',
      title: 'Row selection',
      description:
        'A checkbox column with an indeterminate select-all. Rows can opt out with isRowSelectable.',
      layout: 'fill',
    },
    {
      name: 'Paginated',
      title: 'Pagination',
      description: 'Set pageSize to paginate on the client. Page changes are announced politely.',
      layout: 'fill',
    },
    { name: 'ControlledSort', title: 'Controlled sorting', layout: 'fill' },
    { name: 'States', title: 'Loading and empty states', layout: 'fill' },
  ],
  props: [
    {
      component: 'DataTable',
      name: 'columns',
      type: 'DataTableColumn<T>[]',
      required: true,
      description:
        'Column definitions: id, header, accessor or cell, sortable, sortFn, align, width, rowHeader.',
    },
    {
      component: 'DataTable',
      name: 'data',
      type: 'readonly T[]',
      required: true,
      description: 'The rows to display.',
    },
    {
      component: 'DataTable',
      name: 'caption',
      type: 'ReactNode',
      required: true,
      description: 'Names the table. Use captionHidden to hide it visually.',
    },
    {
      component: 'DataTable',
      name: 'getRowId',
      type: '(row: T, index: number) => string',
      default: 'index',
      description: 'Stable id per row, used for selection and keys.',
    },
    {
      component: 'DataTable',
      name: 'captionHidden',
      type: 'boolean',
      default: 'false',
      description: 'Visually hide the caption while keeping it for screen readers.',
    },
    {
      component: 'DataTable',
      name: 'sort',
      type: 'DataTableSort | null',
      description: 'Controlled sort: { columnId, direction }.',
    },
    {
      component: 'DataTable',
      name: 'defaultSort',
      type: 'DataTableSort | null',
      default: 'null',
      description: 'Initial sort when uncontrolled.',
    },
    {
      component: 'DataTable',
      name: 'onSortChange',
      type: '(sort: DataTableSort | null) => void',
      description: 'Called when a sortable header cycles ascending, descending, none.',
    },
    {
      component: 'DataTable',
      name: 'selectable',
      type: 'boolean',
      default: 'false',
      description: 'Adds a selection checkbox column.',
    },
    {
      component: 'DataTable',
      name: 'selectedRowIds',
      type: 'string[]',
      description: 'Controlled selection.',
    },
    {
      component: 'DataTable',
      name: 'defaultSelectedRowIds',
      type: 'string[]',
      default: '[]',
      description: 'Initial selection when uncontrolled.',
    },
    {
      component: 'DataTable',
      name: 'onSelectionChange',
      type: '(ids: string[]) => void',
      description: 'Called with the selected row ids.',
    },
    {
      component: 'DataTable',
      name: 'isRowSelectable',
      type: '(row: T) => boolean',
      description: 'Disable selection for some rows.',
    },
    {
      component: 'DataTable',
      name: 'getRowLabel',
      type: '(row: T) => string',
      description: 'Names each row in its checkbox label, e.g. “Select Priya Nair”.',
    },
    {
      component: 'DataTable',
      name: 'pageSize',
      type: 'number',
      description: 'Rows per page. Omit to show every row.',
    },
    {
      component: 'DataTable',
      name: 'page',
      type: 'number',
      description: 'Controlled 1-based page.',
    },
    {
      component: 'DataTable',
      name: 'defaultPage',
      type: 'number',
      default: '1',
      description: 'Initial page when uncontrolled.',
    },
    {
      component: 'DataTable',
      name: 'onPageChange',
      type: '(page: number) => void',
      description: 'Called when the page changes.',
    },
    {
      component: 'DataTable',
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Shows skeleton rows and sets aria-busy on the table.',
    },
    {
      component: 'DataTable',
      name: 'loadingRows',
      type: 'number',
      default: '5',
      description: 'Number of skeleton rows.',
    },
    {
      component: 'DataTable',
      name: 'emptyState',
      type: 'ReactNode',
      default: '“No results”',
      description: 'Rendered in a full-width cell when there are no rows.',
    },
    {
      component: 'DataTable',
      name: 'footer',
      type: 'ReactNode',
      description: 'Content beside the range summary, such as bulk actions.',
    },
    {
      component: 'DataTable',
      name: 'density',
      type: "'compact' | 'default' | 'comfortable'",
      default: "'default'",
      description: 'Row height and cell padding.',
    },
    {
      component: 'DataTable',
      name: 'striped / stickyHeader / maxHeight',
      type: 'boolean / boolean / number | string',
      description: 'Passed through to Table.',
    },
    {
      component: 'DataTable',
      name: 'scrollLabel',
      type: 'string',
      description: 'Label for the scroll region. Defaults to the caption when it is a string.',
    },
  ],
  accessibility: [
    'Renders a native <table> with a <caption>, so screen readers announce its name, size and headers.',
    'Sortable headers contain real buttons and expose aria-sort on the column header.',
    'Mark the identifying column with rowHeader so each row is announced by name.',
    'Selection checkboxes are labelled per row (“Select Priya Nair”). The select-all checkbox reports the mixed state.',
    'Sorting, selection and page changes are announced through a polite live region.',
    'While loading, the table sets aria-busy and the skeleton rows are hidden from assistive technology.',
    'The table scrolls inside a focusable, labelled region, so wide tables never break the page.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'Moves between sort buttons, checkboxes, row actions and pagination.',
    },
    {
      keys: ['Enter', 'Space'],
      description: 'Activates a sort button. Cycles ascending, descending, none.',
    },
    { keys: ['Space'], description: 'Toggles a selection checkbox.' },
  ],
  guidelines: {
    do: [
      'Right-align numeric columns and use tabular figures.',
      'Keep bulk actions visible in the footer while rows are selected.',
      'Paginate or filter long collections rather than rendering thousands of rows.',
    ],
    dont: [
      'Put onClick on rows. Make the primary column a link instead.',
      'Use DataTable for in-place editing; use DataGrid.',
    ],
  },
  related: ['table', 'data-grid', 'pagination', 'filter-bar', 'checkbox'],
};

interface OrgUser {
  id: string;
  name: string;
  email: string;
  team: string;
  signature: 'Live' | 'Pending' | 'Failed';
  deployments: number;
}

const users: OrgUser[] = [
  {
    id: 'u1',
    name: 'Priya Nair',
    email: 'priya.nair@binds.si',
    team: 'Sales',
    signature: 'Live',
    deployments: 14,
  },
  {
    id: 'u2',
    name: 'Amara Okafor',
    email: 'amara.okafor@binds.si',
    team: 'Legal',
    signature: 'Live',
    deployments: 6,
  },
  {
    id: 'u3',
    name: 'Lukas Brenner',
    email: 'lukas.brenner@binds.si',
    team: 'Sales',
    signature: 'Pending',
    deployments: 0,
  },
  {
    id: 'u4',
    name: 'Hana Sato',
    email: 'hana.sato@binds.si',
    team: 'Finance',
    signature: 'Live',
    deployments: 9,
  },
  {
    id: 'u5',
    name: 'Tomás Ruiz',
    email: 'tomas.ruiz@binds.si',
    team: 'Operations',
    signature: 'Failed',
    deployments: 2,
  },
  {
    id: 'u6',
    name: 'Owen Price',
    email: 'owen.price@binds.si',
    team: 'Sales',
    signature: 'Live',
    deployments: 11,
  },
  {
    id: 'u7',
    name: 'Zainab Haddad',
    email: 'zainab.haddad@binds.si',
    team: 'Legal',
    signature: 'Pending',
    deployments: 1,
  },
];

const tone = { Live: 'success', Pending: 'warning', Failed: 'danger' } as const;

const columns: DataTableColumn<OrgUser>[] = [
  { id: 'name', header: 'Name', accessor: 'name', sortable: true, rowHeader: true },
  { id: 'email', header: 'Email', accessor: 'email' },
  { id: 'team', header: 'Team', accessor: 'team', sortable: true },
  {
    id: 'signature',
    header: 'Signature',
    accessor: 'signature',
    sortable: true,
    cell: (u) => (
      <Badge tone={tone[u.signature]} variant="soft">
        {u.signature}
      </Badge>
    ),
  },
  {
    id: 'deployments',
    header: 'Deployments',
    accessor: 'deployments',
    sortable: true,
    align: 'end',
  },
];

export function Basic() {
  return (
    <DataTable caption="Organisation users" columns={columns} data={users} getRowId={(u) => u.id} />
  );
}

export function Selection() {
  const [selected, setSelected] = React.useState<string[]>(['u2']);
  return (
    <DataTable
      caption="Organisation users"
      columns={columns}
      data={users}
      getRowId={(u) => u.id}
      selectable
      selectedRowIds={selected}
      onSelectionChange={setSelected}
      getRowLabel={(u) => u.name}
      isRowSelectable={(u) => u.signature !== 'Failed'}
      footer={
        <Button size="sm" variant="outline" disabled={selected.length === 0}>
          Redeploy {selected.length || ''} signature{selected.length === 1 ? '' : 's'}
        </Button>
      }
    />
  );
}

export function Paginated() {
  return (
    <DataTable
      caption="Organisation users"
      columns={columns}
      data={users}
      getRowId={(u) => u.id}
      pageSize={3}
      density="compact"
    />
  );
}

export function ControlledSort() {
  const [sort, setSort] = React.useState<DataTableSort | null>({
    columnId: 'deployments',
    direction: 'descending',
  });
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p style={{ margin: 0 }}>
        Sorted by: {sort ? `${sort.columnId} (${sort.direction})` : 'none'}
      </p>
      <DataTable
        caption="Most active senders"
        columns={columns}
        data={users}
        getRowId={(u) => u.id}
        sort={sort}
        onSortChange={setSort}
      />
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <DataTable caption="Loading users" columns={columns} data={[]} loading loadingRows={3} />
      <DataTable
        caption="Suspended users"
        columns={columns}
        data={[]}
        emptyState="No suspended users in this organisation."
      />
    </div>
  );
}
