import { FormField, RangeSlider } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'range-slider',
  name: 'RangeSlider',
  category: 'forms',
  summary: 'Select a minimum and maximum with two thumbs that cannot cross.',
  description:
    'Use RangeSlider to filter by a span of values, such as contract value or document age. Each thumb is its own slider with its own label, so the range is fully keyboard and screen reader accessible.',
  imports: ['RangeSlider'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    {
      name: 'MinimumGap',
      title: 'Minimum gap',
      description: 'minStepsBetween keeps the thumbs apart.',
      layout: 'fill',
    },
    { name: 'Controlled', title: 'Controlled filter', layout: 'fill' },
  ],
  props: [
    {
      component: 'RangeSlider',
      name: 'value',
      type: '[number, number]',
      description: 'Controlled range.',
    },
    {
      component: 'RangeSlider',
      name: 'defaultValue',
      type: '[number, number]',
      default: '[min, max]',
      description: 'Initial range.',
    },
    {
      component: 'RangeSlider',
      name: 'onValueChange',
      type: '(value: [number, number]) => void',
      description: 'Called while dragging.',
    },
    {
      component: 'RangeSlider',
      name: 'onValueCommit',
      type: '(value: [number, number]) => void',
      description: 'Called when a change ends.',
    },
    {
      component: 'RangeSlider',
      name: 'minStepsBetween',
      type: 'number',
      default: '0',
      description: 'Minimum distance between thumbs, in steps.',
    },
    {
      component: 'RangeSlider',
      name: 'thumbLabels',
      type: '[string, string]',
      default: "['Minimum', 'Maximum']",
      description: 'Accessible names for the thumbs.',
    },
    {
      component: 'RangeSlider',
      name: '...props',
      type: 'Slider props',
      description:
        'min, max, step, marks, showValue, formatValue, orientation, size, name, disabled.',
    },
  ],
  accessibility: [
    'Each thumb is a separate role="slider" with its own name from thumbLabels; give descriptive names like "Minimum value".',
    'Thumbs cannot pass each other: each thumb’s range is bounded by the other.',
    'With name set, values submit as name[0] and name[1].',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between the two thumbs.' },
    { keys: ['Arrow keys'], description: 'Move the focused thumb by one step.' },
    { keys: ['PageUp', 'PageDown'], description: 'Move by a large step.' },
    { keys: ['Home', 'End'], description: 'Move as far as the other thumb or the bound allows.' },
  ],
  related: ['slider', 'filter-bar'],
};

export function Basic() {
  const gbp = (v: number) => `£${v}k`;
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <FormField label="Contract value">
        <RangeSlider
          defaultValue={[20, 80]}
          min={0}
          max={100}
          step={5}
          formatValue={gbp}
          showValue
          thumbLabels={['Minimum value', 'Maximum value']}
        />
      </FormField>
    </div>
  );
}

export function MinimumGap() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <RangeSlider
        defaultValue={[9, 17]}
        min={0}
        max={24}
        minStepsBetween={2}
        thumbLabels={['Working hours start', 'Working hours end']}
        formatValue={(v) => `${String(v).padStart(2, '0')}:00`}
        showValue
        marks={[
          { value: 0, label: '00:00' },
          { value: 12, label: '12:00' },
          { value: 24, label: '24:00' },
        ]}
      />
    </div>
  );
}

export function Controlled() {
  const [range, setRange] = React.useState<[number, number]>([0, 30]);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 420 }}>
      <RangeSlider
        value={range}
        onValueChange={setRange}
        min={0}
        max={90}
        thumbLabels={['Newer than (days)', 'Older than (days)']}
      />
      <span style={{ fontSize: 14 }}>
        Showing documents sent {range[0]} to {range[1]} days ago
      </span>
    </div>
  );
}
