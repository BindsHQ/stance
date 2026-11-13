import * as React from 'react';
import { Button, GeneratedTable } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'generated-table',
  name: 'GeneratedTable',
  category: 'ai',
  summary:
    'Presents rows the assistant produced as a real table that people can sort, copy as CSV, export or open in a larger view.',
  description:
    'Use GeneratedTable when an answer is tabular. It renders a real table with a caption, lets people sort by any column, and copies the data as CSV. While rows are still arriving it fills in quietly and says once when it is complete.',
  imports: ['GeneratedTable'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A generated table',
      description: 'Select a column header to sort. Copy puts CSV on the clipboard.',
      layout: 'fill',
    },
    {
      name: 'Streaming',
      title: 'While rows arrive',
      description: 'Sorting and copy wait until the table is complete.',
      layout: 'fill',
    },
    {
      name: 'Folded',
      title: 'Long tables',
      description: 'maxRows shows the first rows with a control for the rest.',
      layout: 'fill',
    },
    {
      name: 'Actions',
      title: 'Export and expand',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'GeneratedTable',
      name: 'columns',
      type: "{ id: string; header: string; align?: 'start' | 'center' | 'end'; numeric?: boolean }[]",
      required: true,
      description: 'The columns, in order. Numeric columns align to the end and sort by value.',
    },
    {
      component: 'GeneratedTable',
      name: 'rows',
      type: 'Record<string, string | number | boolean | null | undefined>[]',
      required: true,
      description: 'The rows. Each one maps column ids to values.',
    },
    {
      component: 'GeneratedTable',
      name: 'caption',
      type: 'React.ReactNode',
      required: true,
      description: 'What the table shows. Rendered as the table caption.',
    },
    {
      component: 'GeneratedTable',
      name: 'streaming',
      type: 'boolean',
      default: 'false',
      description: 'Rows are still arriving. Sorting waits and new rows are not announced.',
    },
    {
      component: 'GeneratedTable',
      name: 'maxRows',
      type: 'number',
      description: 'Show this many rows, with a control to show the rest.',
    },
    {
      component: 'GeneratedTable',
      name: 'sortable',
      type: 'boolean',
      default: 'true',
      description: 'Let readers sort by a column.',
    },
    {
      component: 'GeneratedTable',
      name: 'sort',
      type: "{ columnId: string; direction: 'ascending' | 'descending' } | null",
      description: 'Controlled sort. Null keeps the order the rows came in.',
    },
    {
      component: 'GeneratedTable',
      name: 'defaultSort',
      type: 'GeneratedTableSort',
      description: 'Sort on first render.',
    },
    {
      component: 'GeneratedTable',
      name: 'onSortChange',
      type: '(sort: GeneratedTableSort) => void',
      description: 'Called when the reader sorts.',
    },
    {
      component: 'GeneratedTable',
      name: 'copyable',
      type: 'boolean',
      default: 'true',
      description: 'Show the copy as CSV action.',
    },
    {
      component: 'GeneratedTable',
      name: 'onCopy',
      type: '(csv: string, success: boolean) => void',
      description: 'Called after the table is copied as CSV.',
    },
    {
      component: 'GeneratedTable',
      name: 'onExport',
      type: '(csv: string) => void',
      description: 'Shows an export action. Receives the CSV text so the app can save a file.',
    },
    {
      component: 'GeneratedTable',
      name: 'onExpand',
      type: '() => void',
      description: 'Shows an expand action, for opening the table in a full view.',
    },
    {
      component: 'GeneratedTable',
      name: 'formatValue',
      type: '(value: GeneratedTableValue, column: GeneratedTableColumn) => React.ReactNode',
      description: 'Formats a value for display. CSV export uses the raw value.',
    },
    {
      component: 'GeneratedTable',
      name: 'labels',
      type: 'Partial<GeneratedTableLabels>',
      description:
        'Translations: copy, copied, export, expand, rows(count), showing(shown, total), showAll(total), showFewer, streaming, complete(count) and empty.',
    },
  ],
  accessibility: [
    'A real table with a caption and column headers.',
    'Sortable headers are buttons and expose aria-sort.',
    'While streaming the table is marked busy and rows are not announced one by one.',
    'When streaming ends, completion and the row count are announced politely, once.',
    'Copy confirms in the button and with a polite announcement.',
    'A wide table scrolls inside a focusable region named by the caption.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through the column headers, then the actions.' },
    {
      keys: ['Enter', 'Space'],
      description: 'On a header: sorts ascending, then descending, then the original order.',
    },
  ],
  guidelines: {
    do: [
      'Write a caption that says what the rows are.',
      'Mark number columns as numeric so they align and sort by value.',
      'Use maxRows in a conversation and offer expand for the full table.',
    ],
    dont: [
      'Put controls or long text in cells. Keep values plain.',
      'Use it for data people edit. DataGrid fits that.',
    ],
  },
  related: ['table', 'data-table', 'generated-chart', 'markdown-renderer'],
};

const columns = [
  { id: 'customer', header: 'Customer' },
  { id: 'plan', header: 'Plan' },
  { id: 'seats', header: 'Seats', numeric: true },
  { id: 'renewal', header: 'Renewal' },
];

const rows = [
  { customer: 'Northwind', plan: 'Business', seats: 120, renewal: '2027-01-15' },
  { customer: 'Fabrikam', plan: 'Team', seats: 24, renewal: '2026-12-01' },
  { customer: 'Contoso', plan: 'Enterprise', seats: 480, renewal: '2027-03-31' },
  { customer: 'Adatum', plan: 'Team', seats: 12, renewal: '2026-11-30' },
  { customer: 'Tailspin', plan: 'Business', seats: 75, renewal: '2027-02-10' },
  { customer: 'Lucerne', plan: 'Team', seats: 8, renewal: '2027-04-22' },
];

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <GeneratedTable columns={columns} rows={rows} caption="Renewals in the next six months" />
    </div>
  );
}

export function Streaming() {
  const [count, setCount] = React.useState(rows.length);
  React.useEffect(() => {
    if (count >= rows.length) return;
    const timer = window.setTimeout(() => setCount((c) => c + 1), 600);
    return () => window.clearTimeout(timer);
  }, [count]);
  const streaming = count < rows.length;
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 560 }}>
      <GeneratedTable
        columns={columns}
        rows={rows.slice(0, count)}
        caption="Renewals in the next six months"
        streaming={streaming}
      />
      <div>
        <Button size="sm" variant="outline" onClick={() => setCount(1)} disabled={streaming}>
          Generate again
        </Button>
      </div>
    </div>
  );
}

export function Folded() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <GeneratedTable columns={columns} rows={rows} caption="Renewals" maxRows={3} />
    </div>
  );
}

export function Actions() {
  const [message, setMessage] = React.useState('Nothing exported yet.');
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 560 }}>
      <GeneratedTable
        columns={columns}
        rows={rows.slice(0, 3)}
        caption="Renewals"
        defaultSort={{ columnId: 'seats', direction: 'descending' }}
        onExport={(csv) => setMessage(`Exported ${csv.split('\n').length - 1} rows.`)}
        onExpand={() => setMessage('Opened the full table.')}
      />
      <p style={{ margin: 0, fontSize: 14 }}>{message}</p>
    </div>
  );
}
