import { BarChart, ChartContainer, Sparkline } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'chart-container',
  name: 'ChartContainer',
  category: 'advanced',
  summary:
    'An accessible chart frame with title, legend, responsive sizing and a data-table alternative.',
  description:
    'ChartContainer is not a charting engine. It gives any chart a consistent frame: a title and description, a legend using the theme-aware chart colours, the measured width for responsive drawing, and a “View as table” toggle so the data is never locked inside graphics. Stance includes two small SVG charts built on it: BarChart and Sparkline.',
  imports: ['ChartContainer', 'BarChart', 'Sparkline'],
  status: 'beta',
  examples: [
    { name: 'Bars', title: 'BarChart', layout: 'fill' },
    {
      name: 'Custom',
      title: 'Custom chart',
      description:
        'Use the render function to draw your own SVG with the measured size and series colours.',
      layout: 'fill',
    },
    {
      name: 'Sparklines',
      title: 'Sparkline',
      description: 'Word-sized trends for stat cards and tables, with a generated text summary.',
      layout: 'start',
    },
  ],
  props: [
    {
      component: 'ChartContainer',
      name: 'title',
      type: 'ReactNode',
      required: true,
      description: 'Visible title; names the figure.',
    },
    {
      component: 'ChartContainer',
      name: 'description',
      type: 'ReactNode',
      description: 'What the chart shows; linked with aria-describedby.',
    },
    {
      component: 'ChartContainer',
      name: 'series',
      type: 'ChartSeries[]',
      description: '{ key, label, color? } per series. Colours default to --st-color-chart-1…5.',
    },
    {
      component: 'ChartContainer',
      name: 'data',
      type: 'ChartDatum[]',
      description: 'Rows for the data table alternative.',
    },
    {
      component: 'ChartContainer',
      name: 'categoryKey',
      type: 'string',
      description: 'Key of the category column in data.',
    },
    {
      component: 'ChartContainer',
      name: 'categoryLabel',
      type: 'string',
      default: "'Category'",
      description: 'Header of the category column.',
    },
    {
      component: 'ChartContainer',
      name: 'height',
      type: 'number',
      default: '240',
      description: 'Chart area height in px.',
    },
    {
      component: 'ChartContainer',
      name: 'children',
      type: 'ReactNode | ({ width, height, colors }) => ReactNode',
      required: true,
      description: 'The chart, or a render function receiving the measured size.',
    },
    {
      component: 'ChartContainer',
      name: 'formatValue',
      type: '(value: number, series) => string',
      description: 'Formats values in the table.',
    },
    {
      component: 'ChartContainer',
      name: 'showLegend',
      type: 'boolean',
      description: 'Defaults to true when there are series.',
    },
    {
      component: 'ChartContainer',
      name: 'defaultView',
      type: "'chart' | 'table'",
      default: "'chart'",
      description: 'Initial view.',
    },
    {
      component: 'ChartContainer',
      name: 'view',
      type: "'chart' | 'table'",
      description: 'Controlled view.',
    },
    {
      component: 'ChartContainer',
      name: 'onViewChange',
      type: "(view: 'chart' | 'table') => void",
      description: 'Called when the reader switches between the chart and the table.',
    },
    {
      component: 'ChartContainer',
      name: 'footer',
      type: 'ReactNode',
      description: 'Content under the chart or table, such as a source note.',
    },
    {
      component: 'ChartContainer',
      name: 'labels',
      type: 'Partial<ChartContainerLabels>',
      description: 'Translations: viewAsTable, viewAsChart, legend and noValue.',
    },
    {
      component: 'ChartContainer',
      name: 'actions',
      type: 'ReactNode',
      description: 'Extra header controls, such as a period selector.',
    },
    {
      component: 'ChartContainer',
      name: 'headingLevel',
      type: '2 | 3 | 4 | 5 | 6',
      default: '3',
      description: 'Title heading level.',
    },
    {
      component: 'BarChart',
      name: 'data / categoryKey / series',
      type: 'ChartDatum[] / string / ChartSeries[]',
      required: true,
      description: 'Grouped vertical bars per category.',
    },
    {
      component: 'BarChart',
      name: 'maxValue',
      type: 'number',
      description: 'Fixed axis maximum; defaults to a rounded data maximum.',
    },
    {
      component: 'BarChart',
      name: 'summary',
      type: 'string',
      description: 'Overrides the generated accessible summary.',
    },
    {
      component: 'Sparkline',
      name: 'data',
      type: 'number[]',
      required: true,
      description: 'Values, oldest first.',
    },
    {
      component: 'Sparkline',
      name: 'width / height',
      type: 'number',
      default: '120 / 32',
      description: 'Size in px.',
    },
    {
      component: 'Sparkline',
      name: 'area',
      type: 'boolean',
      default: 'false',
      description: 'Fill under the line.',
    },
    {
      component: 'Sparkline',
      name: 'color',
      type: 'string',
      default: "'var(--st-color-chart-1)'",
      description: 'Line colour.',
    },
    {
      component: 'Sparkline',
      name: 'label',
      type: 'string | null',
      description:
        'Overrides the generated summary; null hides it when adjacent text describes the trend.',
    },
  ],
  accessibility: [
    'The container is a <figure> named by its title and described by its description.',
    'BarChart and Sparkline render role="img" with a generated summary, such as “Highest: Deployed in Sep, 260”.',
    '“View as table” replaces the chart with a real data table, the most reliable way for screen reader users to explore values.',
    'Chart colours come from the ink ramp and adapt to each theme. Pair colour with labels; never rely on colour alone.',
  ],
  keyboard: [{ keys: ['Enter', 'Space'], description: 'Toggles between chart and table views.' }],
  guidelines: {
    do: [
      'Write a title that states the insight, not just the metric.',
      'Always provide data for the table alternative.',
    ],
    dont: [
      'Use more than five series in one chart.',
      'Use charts where a single number in a StatCard would do.',
    ],
  },
  related: ['stat-card', 'table'],
};

const deployments = [
  { month: 'Jun', deployed: 120, failed: 9 },
  { month: 'Jul', deployed: 164, failed: 7 },
  { month: 'Aug', deployed: 151, failed: 12 },
  { month: 'Sep', deployed: 238, failed: 5 },
  { month: 'Oct', deployed: 260, failed: 4 },
  { month: 'Nov', deployed: 302, failed: 3 },
];

export function Bars() {
  return (
    <BarChart
      title="Signature deployments are accelerating"
      description="Mailboxes updated each month through the Exchange relay."
      data={deployments}
      categoryKey="month"
      categoryLabel="Month"
      series={[
        { key: 'deployed', label: 'Deployed' },
        { key: 'failed', label: 'Failed' },
      ]}
    />
  );
}

export function Custom() {
  const values = deployments.map((d) => d.deployed);
  const max = Math.max(...values);
  return (
    <ChartContainer
      title="Deployed mailboxes"
      series={[{ key: 'deployed', label: 'Deployed' }]}
      data={deployments}
      categoryKey="month"
      height={180}
    >
      {({ width, height, colors }) => {
        const step = width / (values.length - 1);
        const points = values
          .map((v, i) => `${i * step},${height - 8 - (v / max) * (height - 16)}`)
          .join(' ');
        return (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label="Line chart: deployed mailboxes rose from 120 in June to 302 in November."
          >
            <polyline
              points={points}
              fill="none"
              stroke={colors[0]}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </svg>
        );
      }}
    </ChartContainer>
  );
}

export function Sparklines() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 160 }}>Active signatures</span>
        <Sparkline data={[42, 48, 51, 49, 60, 72, 81]} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 160 }}>Failed deliveries</span>
        <Sparkline data={[12, 9, 11, 7, 5, 4, 3]} area color="var(--st-color-chart-3)" />
      </div>
    </div>
  );
}
