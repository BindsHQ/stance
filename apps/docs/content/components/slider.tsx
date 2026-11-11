import { FormField, Slider } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'slider',
  name: 'Slider',
  category: 'forms',
  summary: 'Pick a single value from a range by dragging or with the keyboard.',
  description:
    'Use Slider when the exact value matters less than its position in a range, or when users benefit from immediate visual feedback, such as logo size or reminder frequency. When precise entry matters, pair it with a NumberInput or use NumberInput alone.',
  imports: ['Slider'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    { name: 'Marks', title: 'Marks and labels', layout: 'fill' },
    { name: 'Controlled', title: 'Controlled with value display', layout: 'fill' },
    { name: 'Vertical', title: 'Vertical' },
  ],
  props: [
    { component: 'Slider', name: 'value', type: 'number', description: 'Controlled value.' },
    {
      component: 'Slider',
      name: 'defaultValue',
      type: 'number',
      default: 'min',
      description: 'Initial value.',
    },
    {
      component: 'Slider',
      name: 'onValueChange',
      type: '(value: number) => void',
      description: 'Called continuously while dragging.',
    },
    {
      component: 'Slider',
      name: 'onValueCommit',
      type: '(value: number) => void',
      description: 'Called once when a drag ends or a key is pressed.',
    },
    {
      component: 'Slider',
      name: 'min / max',
      type: 'number',
      default: '0 / 100',
      description: 'Range bounds.',
    },
    {
      component: 'Slider',
      name: 'step',
      type: 'number',
      default: '1',
      description: 'Value granularity.',
    },
    {
      component: 'Slider',
      name: 'largeStep',
      type: 'number',
      default: '10% of range',
      description: 'PageUp/PageDown increment.',
    },
    {
      component: 'Slider',
      name: 'marks',
      type: 'SliderMark[] | boolean',
      description: 'Tick marks with optional labels; true marks every step.',
    },
    {
      component: 'Slider',
      name: 'showValue',
      type: "boolean | 'always'",
      default: 'false',
      description: 'Value bubble on hover/drag, or always.',
    },
    {
      component: 'Slider',
      name: 'formatValue',
      type: '(value: number) => string',
      description: 'Formats the bubble and aria-valuetext.',
    },
    {
      component: 'Slider',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Direction.',
    },
    {
      component: 'Slider',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Track and thumb size.',
    },
    {
      component: 'Slider',
      name: 'name',
      type: 'string',
      description: 'Submit with forms via a hidden input.',
    },
    { component: 'Slider', name: 'disabled / invalid', type: 'boolean', description: 'State.' },
  ],
  accessibility: [
    'Implements the WAI-ARIA slider pattern: the thumb has role="slider" with aria-valuenow, min, max, orientation and aria-valuetext.',
    'Label it with FormField, aria-label or aria-labelledby; inside FormField the thumb is labelled and described automatically.',
    'Use formatValue so screen readers hear units ("45%", "3 days"), not bare numbers.',
    'The thumb has an enlarged invisible hit area for touch, and the track responds to taps anywhere.',
  ],
  keyboard: [
    { keys: ['ArrowRight', 'ArrowUp'], description: 'Increase by one step.' },
    { keys: ['ArrowLeft', 'ArrowDown'], description: 'Decrease by one step.' },
    { keys: ['PageUp', 'PageDown'], description: 'Change by a large step.' },
    { keys: ['Home', 'End'], description: 'Jump to the minimum or maximum.' },
  ],
  related: ['range-slider', 'number-input', 'progress'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <FormField label="Logo width" description="Applies to every signature in the template.">
        <Slider
          defaultValue={120}
          min={60}
          max={240}
          step={10}
          formatValue={(v) => `${v}px`}
          showValue
        />
      </FormField>
    </div>
  );
}

export function Marks() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <FormField label="Reminder frequency">
        <Slider
          defaultValue={3}
          min={1}
          max={7}
          marks={[
            { value: 1, label: 'Daily' },
            { value: 3, label: '3 days' },
            { value: 7, label: 'Weekly' },
          ]}
          formatValue={(v) => (v === 1 ? 'every day' : `every ${v} days`)}
        />
      </FormField>
    </div>
  );
}

export function Controlled() {
  const [value, setValue] = React.useState(60);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 420 }}>
      <Slider
        aria-label="Banner opacity"
        value={value}
        onValueChange={setValue}
        formatValue={(v) => `${v}%`}
      />
      <span style={{ fontSize: 14 }}>Banner opacity: {value}%</span>
    </div>
  );
}

export function Vertical() {
  return <Slider aria-label="Volume" orientation="vertical" defaultValue={40} showValue />;
}
