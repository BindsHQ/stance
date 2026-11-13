'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import {
  ChartContainer,
  type ChartContainerLabels,
  type ChartDatum,
  type ChartRenderProps,
} from '../chart-container/ChartContainer.js';

export type GeneratedChartKind = 'line' | 'bar' | 'area';
export type GeneratedChartView = 'chart' | 'table';

export interface GeneratedChartSeries {
  id: string;
  /** The series name, for the legend and the table. */
  label: string;
  /** One value per category, in order. Use null for a gap. */
  values: (number | null)[];
  /** Colour override. Defaults to the chart colour tokens in order. */
  color?: string;
}

export interface GeneratedChartLabels extends ChartContainerLabels {
  /** The words before the source note. Default "Source". */
  source: string;
  /** Header of the first table column. Default "Category". */
  category: string;
  /** Text alternative when no takeaway is given. */
  summary: (kind: GeneratedChartKind, categories: number, series: number) => string;
}

export interface GeneratedChartProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'title' | 'children'
> {
  /** The chart title. It also names the figure. */
  title: React.ReactNode;
  /** One plain sentence on what the chart shows. It is the text alternative of the chart. */
  takeaway?: string;
  /** The kind of chart. Default `bar`. */
  kind?: GeneratedChartKind;
  /** The data series. */
  series: GeneratedChartSeries[];
  /** The labels along the category axis, in order. */
  categories: string[];
  /** Where the data came from, shown under the chart. */
  source?: React.ReactNode;
  /** Controlled view: the chart or its data table. */
  view?: GeneratedChartView;
  /** View on first render. Default `chart`. */
  defaultView?: GeneratedChartView;
  /** Called when the reader switches between the chart and the table. */
  onViewChange?: (view: GeneratedChartView) => void;
  /** Chart area height in px. Default 240. */
  height?: number;
  /** Formats values on the axis and in the table. */
  formatValue?: (value: number) => string;
  /** Heading level for the title. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Extra controls in the header. */
  actions?: React.ReactNode;
  /** Translations for the built in strings. */
  labels?: Partial<GeneratedChartLabels>;
}

const CATEGORY_KEY = '__category';
const dashes = ['', '6 4', '2 4', '10 4 2 4', '1 5'];

const niceStep = (n: number) => {
  if (n <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(n));
  return [1, 2, 2.5, 5, 10].find((s) => s * pow >= n)! * pow;
};

const defaultSummary = (kind: GeneratedChartKind, categories: number, series: number) =>
  `${kind === 'bar' ? 'Bar' : kind === 'line' ? 'Line' : 'Area'} chart with ${categories} ${
    categories === 1 ? 'category' : 'categories'
  } and ${series} series.`;

/**
 * A chart the assistant built from data: a title, a plain language takeaway that is also
 * the text alternative, a switch to the data table and a source note.
 */
export const GeneratedChart = React.forwardRef<HTMLElement, GeneratedChartProps>(
  function GeneratedChart(
    {
      title,
      takeaway,
      kind = 'bar',
      series,
      categories,
      source,
      view,
      defaultView = 'chart',
      onViewChange,
      height = 240,
      formatValue = (v) => new Intl.NumberFormat().format(v),
      headingLevel = 3,
      actions,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: GeneratedChartLabels = {
      viewAsTable: 'View as table',
      viewAsChart: 'View as chart',
      legend: 'Legend',
      noValue: 'None',
      source: 'Source',
      category: 'Category',
      summary: defaultSummary,
      ...labelsProp,
    };
    const data = React.useMemo<ChartDatum[]>(
      () =>
        categories.map((category, index) => {
          const row: ChartDatum = { [CATEGORY_KEY]: category };
          for (const s of series) row[s.id] = s.values[index] ?? null;
          return row;
        }),
      [categories, series],
    );
    const chartSeries = series.map((s) => ({
      key: s.id,
      label: s.label,
      ...(s.color ? { color: s.color } : null),
    }));
    const summary = takeaway ?? labels.summary(kind, categories.length, series.length);

    const draw = ({ width, height: h, colors }: ChartRenderProps) => {
      const all = series.flatMap((s) => s.values.filter((v): v is number => typeof v === 'number'));
      const max = niceStep(Math.max(0, ...all));
      const lowest = Math.min(0, ...all);
      const min = lowest < 0 ? -niceStep(-lowest) : 0;
      const span = max - min || 1;
      const pad = { top: 8, right: 12, bottom: 28, left: 48 };
      const innerW = Math.max(1, width - pad.left - pad.right);
      const innerH = Math.max(1, h - pad.top - pad.bottom);
      const count = Math.max(1, categories.length);
      const y = (v: number) => pad.top + innerH - ((v - min) / span) * innerH;
      const band = innerW / count;
      const x = (i: number) =>
        kind === 'bar' || count === 1
          ? pad.left + band * (i + 0.5)
          : pad.left + (innerW / (count - 1)) * i;
      const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + t * span);
      const every = Math.max(1, Math.ceil(count / Math.max(1, Math.floor(innerW / 64))));
      const gap = Math.min(12, band * 0.2);
      const barW = Math.max(2, (band - gap * 2) / Math.max(1, series.length));

      const segments = (values: (number | null)[]) => {
        const runs: { i: number; v: number }[][] = [];
        let run: { i: number; v: number }[] = [];
        for (let i = 0; i < count; i++) {
          const v = values[i];
          if (typeof v === 'number') run.push({ i, v });
          else if (run.length) {
            runs.push(run);
            run = [];
          }
        }
        if (run.length) runs.push(run);
        return runs;
      };

      return (
        <svg
          role="img"
          aria-label={summary}
          width={width}
          height={h}
          viewBox={`0 0 ${width} ${h}`}
          className="st-chart__svg st-generated-chart__svg"
        >
          <g aria-hidden="true">
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y(t)}
                  y2={y(t)}
                  className="st-chart__grid"
                />
                <text
                  x={pad.left - 8}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  className="st-chart__tick"
                >
                  {formatValue(Math.round(t * 100) / 100)}
                </text>
              </g>
            ))}
            {categories.map((category, i) =>
              i % every === 0 ? (
                <text
                  key={i}
                  x={x(i)}
                  y={h - 8}
                  textAnchor={
                    kind === 'bar' || count === 1
                      ? 'middle'
                      : i === 0
                        ? 'start'
                        : i === count - 1
                          ? 'end'
                          : 'middle'
                  }
                  className="st-chart__tick"
                >
                  {category}
                </text>
              ) : null,
            )}
            {kind === 'bar'
              ? series.map((s, j) =>
                  s.values.slice(0, count).map((v, i) => {
                    if (typeof v !== 'number') return null;
                    const top = Math.min(y(v), y(0));
                    return (
                      <rect
                        key={`${s.id}-${i}`}
                        x={pad.left + band * i + gap + j * barW}
                        y={top}
                        width={Math.max(1, barW - 2)}
                        height={Math.abs(y(v) - y(0))}
                        rx={2}
                        fill={colors[j]}
                        className="st-chart__bar"
                      />
                    );
                  }),
                )
              : series.map((s, j) =>
                  segments(s.values).map((run, r) => {
                    const line = run.map((p, k) => `${k ? 'L' : 'M'}${x(p.i)} ${y(p.v)}`).join(' ');
                    const first = run[0]!;
                    const last = run[run.length - 1]!;
                    return (
                      <g key={`${s.id}-${r}`}>
                        {kind === 'area' && run.length > 1 && (
                          <path
                            d={`${line} L${x(last.i)} ${y(0)} L${x(first.i)} ${y(0)} Z`}
                            fill={colors[j]}
                            className="st-generated-chart__area"
                          />
                        )}
                        <path
                          d={line}
                          fill="none"
                          stroke={colors[j]}
                          strokeWidth={2}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          strokeDasharray={dashes[j % dashes.length]}
                          className="st-generated-chart__line"
                        />
                        {(count <= 24 || run.length === 1) &&
                          run.map((p) => (
                            <circle
                              key={p.i}
                              cx={x(p.i)}
                              cy={y(p.v)}
                              r={3}
                              fill={colors[j]}
                              className="st-generated-chart__point"
                            />
                          ))}
                      </g>
                    );
                  }),
                )}
          </g>
        </svg>
      );
    };

    return (
      <ChartContainer
        ref={ref}
        className={cx('st-generated-chart', className)}
        data-kind={kind}
        title={title}
        description={takeaway}
        series={chartSeries}
        data={data}
        categoryKey={CATEGORY_KEY}
        categoryLabel={labels.category}
        height={height}
        formatValue={(v) => formatValue(v)}
        headingLevel={headingLevel}
        actions={actions}
        defaultView={defaultView}
        {...(view !== undefined && { view })}
        {...(onViewChange && { onViewChange })}
        labels={labels}
        footer={
          source != null ? (
            <p className="st-generated-chart__source">
              <span className="st-generated-chart__source-label">{labels.source}</span> {source}
            </p>
          ) : undefined
        }
        {...props}
      >
        {draw}
      </ChartContainer>
    );
  },
);
