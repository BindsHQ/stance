import * as React from 'react';
import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableRowLink,
  type SortDirection,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'table',
  name: 'Table',
  category: 'data-display',
  summary:
    'Semantic table primitives with density, striping, sticky headers, sorting and accessible row links.',
  description:
    'Use Table to present structured data people compare across rows and columns. It renders native table markup, so screen readers announce headers with every cell. For built-in sorting, selection and pagination from a data array, use DataTable; for spreadsheet-style editing use DataGrid.',
  imports: [
    'Table',
    'TableCaption',
    'TableHeader',
    'TableBody',
    'TableFooter',
    'TableRow',
    'TableHead',
    'TableCell',
    'TableRowLink',
  ],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    {
      name: 'Sortable',
      title: 'Sortable columns',
      description: 'TableHead renders a sort button and sets aria-sort; you own the sorting logic.',
      layout: 'fill',
    },
    {
      name: 'InteractiveRows',
      title: 'Clickable rows',
      description:
        'Put a TableRowLink in the row. Its hit area covers the row, while keyboard and screen-reader users reach a real link.',
      layout: 'fill',
    },
    { name: 'Density', title: 'Density and striping', layout: 'fill' },
    {
      name: 'StickyHeader',
      title: 'Sticky header',
      description: 'Set maxHeight to scroll the body while keeping column headers visible.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'Table',
      name: 'density',
      type: "'compact' | 'default' | 'comfortable'",
      default: "'default'",
      description: 'Cell padding and row height.',
    },
    {
      component: 'Table',
      name: 'striped',
      type: 'boolean',
      default: 'false',
      description: 'Zebra-stripe body rows.',
    },
    {
      component: 'Table',
      name: 'stickyHeader',
      type: 'boolean',
      default: 'false',
      description: 'Keep headers visible while scrolling vertically.',
    },
    {
      component: 'Table',
      name: 'bordered',
      type: 'boolean',
      default: 'false',
      description: 'Vertical lines between columns.',
    },
    {
      component: 'Table',
      name: 'maxHeight',
      type: 'number | string',
      description: 'Max height of the scroll container.',
    },
    {
      component: 'Table',
      name: 'scrollLabel',
      type: 'string',
      description:
        'Accessible name of the focusable scroll region. Falls back to aria-label, then "Table".',
    },
    {
      component: 'Table',
      name: 'wrapperClassName',
      type: 'string',
      description: 'Class for the scroll wrapper.',
    },
    {
      component: 'TableCaption',
      name: 'visuallyHidden',
      type: 'boolean',
      default: 'false',
      description: 'Keep the caption for screen readers only.',
    },
    {
      component: 'TableRow',
      name: 'selected',
      type: 'boolean',
      default: 'false',
      description: 'Highlight a selected row.',
    },
    {
      component: 'TableRow',
      name: 'interactive',
      type: 'boolean',
      default: 'false',
      description: 'Stretch the row’s TableRowLink over the whole row.',
    },
    {
      component: 'TableHead',
      name: 'sortDirection',
      type: "'ascending' | 'descending' | 'none'",
      description: 'Current sort; renders a sort button and aria-sort.',
    },
    {
      component: 'TableHead',
      name: 'onSort',
      type: '() => void',
      description: 'Called when the sort button is activated.',
    },
    {
      component: 'TableHead',
      name: 'align',
      type: "'start' | 'center' | 'end'",
      default: "'start'",
      description: 'Text alignment; use end for numbers.',
    },
    {
      component: 'TableCell',
      name: 'align',
      type: "'start' | 'center' | 'end'",
      description: 'Text alignment.',
    },
    {
      component: 'TableCell',
      name: 'numeric',
      type: 'boolean',
      default: 'false',
      description: 'Right-align with tabular numerals.',
    },
    {
      component: 'TableRowLink',
      name: '...props',
      type: 'AnchorHTMLAttributes',
      description: 'A real link whose hit area covers an interactive row.',
    },
  ],
  accessibility: [
    'Uses native table, thead, tbody, th and td elements, so headers are announced with each cell.',
    'TableHead sets scope="col" by default. Use scope="row" on row headers.',
    'The table sits in a focusable region (tabindex 0, role="region") so keyboard users can scroll wide tables. Give it a name with scrollLabel or aria-label.',
    'Sortable headers render a real button and set aria-sort to ascending, descending or none.',
    'Clickable rows use a real link (TableRowLink) instead of onClick on <tr>, which keyboards and screen readers cannot reach.',
    'Other controls inside an interactive row stay above the stretched link and remain independently clickable.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'Moves to the scroll region, sort buttons and links inside the table.',
    },
    { keys: ['Arrow keys'], description: 'Scroll the focused region horizontally and vertically.' },
    { keys: ['Enter', 'Space'], description: 'Activates a sort button.' },
  ],
  guidelines: {
    do: [
      'Right-align numeric columns and use numeric cells.',
      'Add a caption, visible or visually hidden.',
    ],
    dont: ['Use tables for page layout.', 'Put onClick on rows without a real link or button.'],
  },
  playground: {
    render: (p) => (
      <Table
        density={p.density as 'default'}
        striped={p.striped as boolean}
        bordered={p.bordered as boolean}
        aria-label="Users"
      >
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead align="end">Signatures</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.slice(0, 4).map((u) => (
            <TableRow key={u.email}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.department}</TableCell>
              <TableCell numeric>{u.signatures}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
    controls: {
      density: {
        type: 'select',
        options: ['compact', 'default', 'comfortable'],
        default: 'default',
      },
      striped: { type: 'boolean', default: false },
      bordered: { type: 'boolean', default: false },
    },
  },
  related: ['data-table', 'data-grid', 'pagination', 'description-list'],
};

const users = [
  {
    name: 'Amara Okafor',
    email: 'amara@binds.si',
    department: 'Sales',
    status: 'Deployed',
    signatures: 3,
  },
  {
    name: 'Lukas Novak',
    email: 'lukas@binds.si',
    department: 'Engineering',
    status: 'Pending',
    signatures: 1,
  },
  {
    name: 'Priya Raman',
    email: 'priya@binds.si',
    department: 'Legal',
    status: 'Deployed',
    signatures: 2,
  },
  {
    name: 'Tomás Ferreira',
    email: 'tomas@binds.si',
    department: 'Support',
    status: 'Failed',
    signatures: 0,
  },
  {
    name: 'Hana Sato',
    email: 'hana@binds.si',
    department: 'Marketing',
    status: 'Deployed',
    signatures: 4,
  },
  {
    name: 'Oliver Grant',
    email: 'oliver@binds.si',
    department: 'Finance',
    status: 'Pending',
    signatures: 1,
  },
];

const tone = { Deployed: 'success', Pending: 'warning', Failed: 'danger' } as const;

export function Basic() {
  return (
    <Table>
      <TableCaption>Organisation users</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead align="end">Signatures</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.slice(0, 4).map((u) => (
          <TableRow key={u.email}>
            <TableCell>{u.name}</TableCell>
            <TableCell>{u.email}</TableCell>
            <TableCell>
              <Badge tone={tone[u.status as keyof typeof tone]} dot>
                {u.status}
              </Badge>
            </TableCell>
            <TableCell numeric>{u.signatures}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell numeric>6</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export function Sortable() {
  const [sort, setSort] = React.useState<{ key: 'name' | 'signatures'; dir: SortDirection }>({
    key: 'name',
    dir: 'ascending',
  });
  const rows = [...users].sort((a, b) => {
    const r = sort.key === 'name' ? a.name.localeCompare(b.name) : a.signatures - b.signatures;
    return sort.dir === 'descending' ? -r : r;
  });
  const toggle = (key: 'name' | 'signatures') =>
    setSort((s) => ({
      key,
      dir: s.key === key && s.dir === 'ascending' ? 'descending' : 'ascending',
    }));
  return (
    <Table aria-label="Users sorted">
      <TableHeader>
        <TableRow>
          <TableHead
            sortDirection={sort.key === 'name' ? sort.dir : 'none'}
            onSort={() => toggle('name')}
          >
            Name
          </TableHead>
          <TableHead>Department</TableHead>
          <TableHead
            align="end"
            sortDirection={sort.key === 'signatures' ? sort.dir : 'none'}
            onSort={() => toggle('signatures')}
          >
            Signatures
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((u) => (
          <TableRow key={u.email}>
            <TableCell>{u.name}</TableCell>
            <TableCell>{u.department}</TableCell>
            <TableCell numeric>{u.signatures}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function InteractiveRows() {
  return (
    <Table aria-label="Signature templates">
      <TableHeader>
        <TableRow>
          <TableHead>Template</TableHead>
          <TableHead>Assigned</TableHead>
          <TableHead align="end">Last edited</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          ['Sales 2026', '48 people', '2 days ago'],
          ['Executive', '6 people', 'Last week'],
          ['Support', '22 people', '3 weeks ago'],
        ].map(([name, assigned, edited]) => (
          <TableRow key={name} interactive>
            <TableCell>
              <TableRowLink href={`#template-${name}`}>{name}</TableRowLink>
            </TableCell>
            <TableCell>{assigned}</TableCell>
            <TableCell align="end">{edited}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function Density() {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {(['compact', 'comfortable'] as const).map((d) => (
        <Table key={d} density={d} striped aria-label={`${d} table`}>
          <TableHeader>
            <TableRow>
              <TableHead>Contract</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead align="end">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>MSA-2026-014</TableCell>
              <TableCell>Northwind Ltd</TableCell>
              <TableCell numeric>£48,000</TableCell>
            </TableRow>
            <TableRow selected>
              <TableCell>NDA-2026-102</TableCell>
              <TableCell>Contoso GmbH</TableCell>
              <TableCell numeric>—</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>SOW-2026-031</TableCell>
              <TableCell>Fabrikam Inc</TableCell>
              <TableCell numeric>£12,500</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ))}
    </div>
  );
}

export function StickyHeader() {
  const many = Array.from({ length: 4 }, () => users).flat();
  return (
    <Table stickyHeader maxHeight={260} density="compact" scrollLabel="All users">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {many.map((u, i) => (
          <TableRow key={i}>
            <TableCell>{u.name}</TableCell>
            <TableCell>{u.department}</TableCell>
            <TableCell>{u.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
