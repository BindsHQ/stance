'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table/Table.js';

export type ChartDatum = Record<string, string | number | null | undefined>;

export interface ChartSeries {
  /** Key of the value in each data row. */
  key: string;
  /** Human-readable series name for the legend and table. */
  label: string;
  /** Colour override. Defaults to `--st-color-chart-1…5` in order. */
  color?: string;
}

export interface ChartRenderProps {
  width: number;
  height: number;
  /** Resolved colour per series, in order. */
  colors: string[];
}

export interface ChartContainerLabels {
  /** The toggle while the chart shows. Default "View as table". */
  viewAsTable: string;
  /** The toggle while the table shows. Default "View as chart". */
  viewAsChart: string;
  /** Accessible name of the legend. Default "Legend". */
  legend: string;
  /** Shown in the table for a missing value. Default "None". */
  noValue: string;
}

export interface ChartContainerProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'title' | 'children'
> {
  /** Visible chart title; also names the figure. */
  title: React.ReactNode;
  /** Supporting text: what the chart shows and why it matters. */
  description?: React.ReactNode;
  /** Series shown in the legend and the data table. */
  series?: ChartSeries[];
  /** Rows for the accessible data table. */
  data?: ChartDatum[];
  /** Key of the category column in `data` (first table column). */
  categoryKey?: string;
  /** Header for the category column. Default "Category". */
  categoryLabel?: string;
  /** Chart area height in px. Default 240. */
  height?: number;
  /** Chart content, or a render function receiving the measured size and series colours. */
  children: React.ReactNode | ((props: ChartRenderProps) => React.ReactNode);
  /** Format values in the data table. */
  formatValue?: (value: number, series: ChartSeries) => string;
  /** Show the legend. Default true when there are series. */
  showLegend?: boolean;
  /** Start in table view. */
  defaultView?: 'chart' | 'table';
  /** Controlled view. */
  view?: 'chart' | 'table';
  /** Called when the reader switches between the chart and the table. */
  onViewChange?: (view: 'chart' | 'table') => void;
  /** Content under the chart or table, such as a source note. */
  footer?: React.ReactNode;
  /** Translations for the built in strings. */
  labels?: Partial<ChartContainerLabels>;
  /** Extra controls in the header (e.g. a period Select). */
  actions?: React.ReactNode;
  /** Heading level for the title. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export const chartColor = (index: number, series?: ChartSeries) =>
  series?.color ?? `var(--st-color-chart-${(index % 5) + 1})`;

/**
 * An accessible frame for charts: title, description, legend, responsive sizing,
 * and a "view as table" alternative so the data is never locked inside graphics.
 */
export const ChartContainer = React.forwardRef<HTMLElement, ChartContainerProps>(
  function ChartContainer(
    {
      title,
      description,
      series = [],
      data,
      categoryKey,
      categoryLabel = 'Category',
      height = 240,
      children,
      formatValue = (v) => new Intl.NumberFormat().format(v),
      showLegend,
      defaultView = 'chart',
      view: viewProp,
      onViewChange,
      footer,
      labels: labelsProp,
      actions,
      headingLevel = 3,
      className,
      ...props
    },
    ref,
  ) {
    const id = React.useId();
    const titleId = `${id}-title`;
    const descId = `${id}-desc`;
    const [view, setView] = useControllableState({
      value: viewProp,
      defaultValue: defaultView,
      onChange: onViewChange,
    });
    const labels: ChartContainerLabels = {
      viewAsTable: 'View as table',
      viewAsChart: 'View as chart',
      legend: 'Legend',
      noValue: 'None',
      ...labelsProp,
    };
    const areaRef = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = React.useState(0);
    const colors = series.map((s, i) => chartColor(i, s));
    const Heading = `h${headingLevel}` as 'h3';

    useIsomorphicLayoutEffect(() => {
      const el = areaRef.current;
      if (!el) return;
      const read = () => setWidth(Math.round(el.clientWidth));
      read();
      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(read);
      ro.observe(el);
      return () => ro.disconnect();
    }, [view]);

    const hasTable = Boolean(data && data.length && series.length);
    const legend = (showLegend ?? series.length > 0) && series.length > 0;
    const measuredWidth = width || 600;

    return (
      <figure
        ref={ref}
        className={cx('st-chart', className)}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        data-view={view}
        {...props}
      >
        <div className="st-chart__header">
          <div className="st-chart__titles">
            <Heading id={titleId} className="st-chart__title">
              {title}
            </Heading>
            {description && (
              <p id={descId} className="st-chart__description">
                {description}
              </p>
            )}
          </div>
          <div className="st-chart__actions">
            {actions}
            {hasTable && (
              <button
                type="button"
                className="st-chart__toggle"
                aria-pressed={view === 'table'}
                onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
              >
                {view === 'table' ? labels.viewAsChart : labels.viewAsTable}
              </button>
            )}
          </div>
        </div>
        {view === 'chart' ? (
          <div ref={areaRef} className="st-chart__area" style={{ height }}>
            {typeof children === 'function'
              ? children({ width: measuredWidth, height, colors })
              : children}
          </div>
        ) : (
          <Table
            density="compact"
            scrollLabel={typeof title === 'string' ? `${title} data` : 'Chart data'}
          >
            <TableCaption visuallyHidden>{title}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{categoryLabel}</TableHead>
                {series.map((s) => (
                  <TableHead key={s.key} align="end">
                    {s.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data!.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{categoryKey ? String(row[categoryKey] ?? '') : i + 1}</TableCell>
                  {series.map((s) => {
                    const v = row[s.key];
                    return (
                      <TableCell key={s.key} numeric>
                        {typeof v === 'number' ? formatValue(v, s) : (v ?? labels.noValue)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {legend && view === 'chart' && (
          <ul className="st-chart__legend" aria-label={labels.legend}>
            {series.map((s, i) => (
              <li key={s.key}>
                <span
                  className="st-chart__swatch"
                  style={{ background: colors[i] }}
                  aria-hidden="true"
                />
                {s.label}
              </li>
            ))}
          </ul>
        )}
        {footer != null && <div className="st-chart__footer">{footer}</div>}
      </figure>
    );
  },
);

/* ------------------------------------------------------------------ */

export interface BarChartProps extends Omit<
  ChartContainerProps,
  'children' | 'data' | 'series' | 'categoryKey'
> {
  data: ChartDatum[];
  /** Key holding each bar group's label. */
  categoryKey: string;
  series: ChartSeries[];
  /** Fixed max of the value axis. Defaults to a rounded data maximum. */
  maxValue?: number;
  /** Override the generated accessible summary. */
  summary?: string;
}

const niceMax = (n: number) => {
  if (n <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= n / 1)!;
  return step * pow;
};

/** Describes a bar chart in words for assistive technology. */
export function summariseBars(
  data: ChartDatum[],
  categoryKey: string,
  series: ChartSeries[],
  format: (n: number) => string,
): string {
  let best: { v: number; s: string; c: string } | null = null;
  for (const row of data) {
    for (const s of series) {
      const v = row[s.key];
      if (typeof v === 'number' && (!best || v > best.v))
        best = { v, s: s.label, c: String(row[categoryKey]) };
    }
  }
  const parts = [
    `Bar chart with ${data.length} ${data.length === 1 ? 'category' : 'categories'} and ${series.length} ${series.length === 1 ? 'series' : 'series'}.`,
  ];
  if (best)
    parts.push(`Highest: ${series.length > 1 ? `${best.s} in ` : ''}${best.c}, ${format(best.v)}.`);
  return parts.join(' ');
}

/** A grouped vertical bar chart drawn with SVG inside a ChartContainer. */
export const BarChart = React.forwardRef<HTMLElement, BarChartProps>(function BarChart(
  {
    data,
    categoryKey,
    series,
    maxValue,
    summary,
    formatValue = (v) => new Intl.NumberFormat().format(v),
    height = 240,
    ...props
  },
  ref,
) {
  const max =
    maxValue ??
    niceMax(Math.max(0, ...data.flatMap((r) => series.map((s) => Number(r[s.key]) || 0))));
  const label =
    summary ?? summariseBars(data, categoryKey, series, (n) => formatValue(n, series[0]!));
  return (
    <ChartContainer
      ref={ref}
      data={data}
      series={series}
      categoryKey={categoryKey}
      height={height}
      formatValue={formatValue}
      {...props}
    >
      {({ width, height: h, colors }) => {
        const pad = { top: 8, right: 8, bottom: 28, left: 44 };
        const innerW = Math.max(1, width - pad.left - pad.right);
        const innerH = Math.max(1, h - pad.top - pad.bottom);
        const groupW = innerW / Math.max(1, data.length);
        const gap = Math.min(12, groupW * 0.2);
        const barW = Math.max(2, (groupW - gap * 2) / Math.max(1, series.length));
        const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
        return (
          <svg
            role="img"
            aria-label={label}
            width={width}
            height={h}
            viewBox={`0 0 ${width} ${h}`}
            className="st-chart__svg"
          >
            <g aria-hidden="true">
              {ticks.map((t) => {
                const y = pad.top + innerH - (t / max) * innerH;
                return (
                  <g key={t}>
                    <line
                      x1={pad.left}
                      x2={width - pad.right}
                      y1={y}
                      y2={y}
                      className="st-chart__grid"
                    />
                    <text
                      x={pad.left - 8}
                      y={y}
                      dy="0.32em"
                      textAnchor="end"
                      className="st-chart__tick"
                    >
                      {formatValue(Math.round(t), series[0]!)}
                    </text>
                  </g>
                );
              })}
              {data.map((row, i) => {
                const x0 = pad.left + i * groupW + gap;
                return (
                  <g key={i}>
                    {series.map((s, j) => {
                      const v = Math.max(0, Number(row[s.key]) || 0);
                      const bh = (v / max) * innerH;
                      return (
                        <rect
                          key={s.key}
                          x={x0 + j * barW}
                          y={pad.top + innerH - bh}
                          width={Math.max(1, barW - 2)}
                          height={bh}
                          rx={2}
                          fill={colors[j]}
                          className="st-chart__bar"
                        />
                      );
                    })}
                    <text
                      x={x0 + (groupW - gap * 2) / 2}
                      y={h - 8}
                      textAnchor="middle"
                      className="st-chart__tick"
                    >
                      {String(row[categoryKey] ?? '')}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        );
      }}
    </ChartContainer>
  );
});

/* ------------------------------------------------------------------ */

export interface SparklineProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref' | 'values'> {
  /** Values in order, oldest first. */
  data: number[];
  /** Default 120. */
  width?: number;
  /** Default 32. */
  height?: number;
  /** Fill the area under the line. */
  area?: boolean;
  /** Line colour. Default `--st-color-chart-1`. */
  color?: string;
  /** Override the generated accessible label. Pass `null` when the trend is described in adjacent text. */
  label?: string | null;
  /** Mark the last point. Default true. */
  showLast?: boolean;
}

/** Describes a sparkline trend in words. */
export function summariseTrend(data: number[]): string {
  if (data.length === 0) return 'No data';
  const first = data[0]!;
  const last = data[data.length - 1]!;
  const fmt = new Intl.NumberFormat();
  if (first === last) return `Trend: flat at ${fmt.format(last)}`;
  const dir = last > first ? 'up' : 'down';
  const pct =
    first !== 0 ? `, ${dir} ${Math.round(Math.abs(((last - first) / first) * 100))}%` : '';
  return `Trend: from ${fmt.format(first)} to ${fmt.format(last)}${pct}`;
}

/** A word-sized line chart for stat cards and tables. */
export const Sparkline = React.forwardRef<SVGSVGElement, SparklineProps>(function Sparkline(
  {
    data,
    width = 120,
    height = 32,
    area = false,
    color = 'var(--st-color-chart-1)',
    label,
    showLast = true,
    className,
    ...props
  },
  ref,
) {
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [
    pad + (data.length > 1 ? (i / (data.length - 1)) * (width - pad * 2) : (width - pad * 2) / 2),
    pad + (1 - (v - min) / span) * (height - pad * 2),
  ]);
  const line = pts
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x!.toFixed(1)} ${y!.toFixed(1)}`)
    .join(' ');
  const last = pts[pts.length - 1];
  const a11y =
    label === null
      ? { 'aria-hidden': true as const }
      : { role: 'img', 'aria-label': label ?? summariseTrend(data) };
  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cx('st-sparkline', className)}
      focusable="false"
      {...a11y}
      {...props}
    >
      {data.length > 1 && area && (
        <path
          d={`${line} L${last![0]} ${height} L${pts[0]![0]} ${height} Z`}
          fill={color}
          className="st-sparkline__area"
        />
      )}
      {data.length > 0 && (
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {showLast && last && <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />}
    </svg>
  );
});
