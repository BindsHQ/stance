import * as React from 'react';
import { Button, GeneratedChart } from '@bindshq/stance-react';
import type { GeneratedChartView } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'generated-chart',
  name: 'GeneratedChart',
  category: 'ai',
  summary:
    'Frames a chart the assistant drew from your data with a one sentence takeaway, the numbers behind it and where they came from.',
  description:
    'Use GeneratedChart when an answer is easier to see than to read. The takeaway says in plain words what the chart shows, and doubles as its text alternative. People can switch to the data table at any time, and the source note says where the numbers came from.',
  imports: ['GeneratedChart'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A bar chart',
      description: 'With a takeaway and a source. View as table shows the numbers.',
      layout: 'fill',
    },
    {
      name: 'Line',
      title: 'Line',
      description: 'Each line has its own dash pattern as well as its own colour.',
      layout: 'fill',
    },
    {
      name: 'Area',
      title: 'Area, with a gap',
      description: 'A null value leaves a gap instead of a guess.',
      layout: 'fill',
    },
    {
      name: 'Controlled',
      title: 'Controlled view',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'GeneratedChart',
      name: 'title',
      type: 'React.ReactNode',
      required: true,
      description: 'The chart title. It also names the figure.',
    },
    {
      component: 'GeneratedChart',
      name: 'takeaway',
      type: 'string',
      description:
        'One plain sentence on what the chart shows. It is the text alternative of the chart.',
    },
    {
      component: 'GeneratedChart',
      name: 'kind',
      type: "'line' | 'bar' | 'area'",
      default: "'bar'",
      description: 'The kind of chart.',
    },
    {
      component: 'GeneratedChart',
      name: 'series',
      type: '{ id: string; label: string; values: (number | null)[]; color?: string }[]',
      required: true,
      description: 'The data series. Each has one value per category. Null leaves a gap.',
    },
    {
      component: 'GeneratedChart',
      name: 'categories',
      type: 'string[]',
      required: true,
      description: 'The labels along the category axis, in order.',
    },
    {
      component: 'GeneratedChart',
      name: 'source',
      type: 'React.ReactNode',
      description: 'Where the data came from, shown under the chart.',
    },
    {
      component: 'GeneratedChart',
      name: 'view',
      type: "'chart' | 'table'",
      description: 'Controlled view: the chart or its data table.',
    },
    {
      component: 'GeneratedChart',
      name: 'defaultView',
      type: "'chart' | 'table'",
      default: "'chart'",
      description: 'View on first render.',
    },
    {
      component: 'GeneratedChart',
      name: 'onViewChange',
      type: "(view: 'chart' | 'table') => void",
      description: 'Called when the reader switches between the chart and the table.',
    },
    {
      component: 'GeneratedChart',
      name: 'height',
      type: 'number',
      default: '240',
      description: 'Chart area height in px.',
    },
    {
      component: 'GeneratedChart',
      name: 'formatValue',
      type: '(value: number) => string',
      description: 'Formats values on the axis and in the table.',
    },
    {
      component: 'GeneratedChart',
      name: 'headingLevel',
      type: '2 | 3 | 4 | 5 | 6',
      default: '3',
      description: 'Heading level for the title.',
    },
    {
      component: 'GeneratedChart',
      name: 'actions',
      type: 'React.ReactNode',
      description: 'Extra controls in the header.',
    },
    {
      component: 'GeneratedChart',
      name: 'labels',
      type: 'Partial<GeneratedChartLabels>',
      description:
        'Translations: viewAsTable, viewAsChart, legend, noValue, source, category and summary(kind, categories, series).',
    },
  ],
  accessibility: [
    'The figure is named by its title and described by the takeaway.',
    'The chart is one image whose text alternative is the takeaway.',
    'The data table is always one button away, with real headers.',
    'Lines differ by dash pattern as well as colour.',
    'Missing values read as None in the table and show as gaps in the chart.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves to the view switch and any header actions.' },
    { keys: ['Enter', 'Space'], description: 'Switches between the chart and the table.' },
  ],
  guidelines: {
    do: [
      'Write the takeaway as the one thing a reader should remember.',
      'Name the source and the period the data covers.',
      'Keep to a few series so the chart stays readable.',
    ],
    dont: [
      'Leave out the takeaway. A chart without words is hard to check.',
      'Use a line for categories that have no order. Bars fit those.',
    ],
  },
  related: ['chart-container', 'generated-table', 'insight-callout', 'stat-card'],
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <GeneratedChart
        title="Agreements signed"
        takeaway="Signed agreements grew every month and passed 60 in June."
        series={[{ id: 'signed', label: 'Signed', values: [22, 28, 35, 41, 52, 63] }]}
        categories={months}
        source="Signing log, 1 January to 30 June"
      />
    </div>
  );
}

export function Line() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <GeneratedChart
        kind="line"
        title="Sent and signed"
        takeaway="The gap between sent and signed agreements narrowed from March."
        series={[
          { id: 'sent', label: 'Sent', values: [40, 44, 47, 50, 58, 66] },
          { id: 'signed', label: 'Signed', values: [22, 28, 35, 41, 52, 63] },
        ]}
        categories={months}
      />
    </div>
  );
}

export function Area() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <GeneratedChart
        kind="area"
        title="Median days to sign"
        takeaway="Signing time fell from 9 days to 4. March has no data."
        series={[{ id: 'days', label: 'Days', values: [9, 8, null, 6, 5, 4] }]}
        categories={months}
        formatValue={(value) => `${value} d`}
        source="Signing log"
      />
    </div>
  );
}

export function Controlled() {
  const [view, setView] = React.useState<GeneratedChartView>('table');
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 560 }}>
      <GeneratedChart
        title="Agreements signed"
        series={[{ id: 'signed', label: 'Signed', values: [22, 28, 35, 41, 52, 63] }]}
        categories={months}
        view={view}
        onViewChange={setView}
      />
      <div>
        <Button size="sm" variant="outline" onClick={() => setView('chart')}>
          Back to the chart
        </Button>
      </div>
    </div>
  );
}
