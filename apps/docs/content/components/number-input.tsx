import { FormField, NumberInput } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'number-input',
  name: 'NumberInput',
  category: 'forms',
  summary: 'Numeric entry with stepper buttons and full spinbutton keyboard support.',
  description:
    'Use NumberInput for quantities with a meaningful range and step: licence seats, reminder intervals, prices. Values are clamped to min and max and rounded to the step precision when the field loses focus. For values picked from a visual range, consider Slider.',
  imports: ['NumberInput', 'FormField'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'Decimal', title: 'Decimal steps and formatting', layout: 'start' },
    { name: 'WithAffixes', title: 'With affixes', layout: 'start' },
    { name: 'NoStepper', title: 'Without stepper', layout: 'start' },
  ],
  props: [
    {
      component: 'NumberInput',
      name: 'value',
      type: 'number | null',
      description: 'Controlled value; null when empty.',
    },
    {
      component: 'NumberInput',
      name: 'defaultValue',
      type: 'number | null',
      default: 'null',
      description: 'Initial value.',
    },
    {
      component: 'NumberInput',
      name: 'onValueChange',
      type: '(value: number | null) => void',
      description: 'Called with the committed number.',
    },
    { component: 'NumberInput', name: 'min', type: 'number', description: 'Minimum value.' },
    { component: 'NumberInput', name: 'max', type: 'number', description: 'Maximum value.' },
    {
      component: 'NumberInput',
      name: 'step',
      type: 'number',
      default: '1',
      description: 'Increment for arrows and steppers.',
    },
    {
      component: 'NumberInput',
      name: 'largeStep',
      type: 'number',
      default: '10',
      description: 'Multiplier for PageUp/PageDown.',
    },
    {
      component: 'NumberInput',
      name: 'precision',
      type: 'number',
      description: 'Decimal places; inferred from step.',
    },
    {
      component: 'NumberInput',
      name: 'format',
      type: '(value: number) => string',
      description: 'Display formatter; also used for aria-valuetext.',
    },
    {
      component: 'NumberInput',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Control height.',
    },
    {
      component: 'NumberInput',
      name: 'hideStepper',
      type: 'boolean',
      default: 'false',
      description: 'Hide the increment/decrement buttons.',
    },
    {
      component: 'NumberInput',
      name: 'prefix / suffix',
      type: 'ReactNode',
      description: 'Content inside the field box.',
    },
    {
      component: 'NumberInput',
      name: 'incrementLabel / decrementLabel',
      type: 'string',
      default: "'Increase' / 'Decrease'",
      description: 'Stepper button labels (localise these).',
    },
  ],
  accessibility: [
    'Implements the WAI-ARIA spinbutton pattern: role="spinbutton" with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext when formatted.',
    'Uses a text input with inputMode so mobile shows a numeric keypad without the native number input’s scroll-wheel and locale problems.',
    'Stepper buttons are mouse and touch affordances and are removed from the tab order; the keyboard uses arrow keys instead.',
  ],
  keyboard: [
    { keys: ['ArrowUp', 'ArrowDown'], description: 'Increase or decrease by one step.' },
    { keys: ['PageUp', 'PageDown'], description: 'Increase or decrease by a large step.' },
    { keys: ['Home', 'End'], description: 'Jump to the minimum or maximum (when set).' },
    { keys: ['Enter'], description: 'Commit the typed value.' },
  ],
  related: ['input', 'slider'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 240 }}>
      <FormField label="Licence seats" description="Between 1 and 500.">
        <NumberInput defaultValue={25} min={1} max={500} />
      </FormField>
    </div>
  );
}

export function Decimal() {
  const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
  return (
    <div style={{ width: '100%', maxWidth: 240 }}>
      <FormField label="Price per seat">
        <NumberInput defaultValue={4.5} min={0} step={0.5} format={(v) => gbp.format(v)} />
      </FormField>
    </div>
  );
}

export function WithAffixes() {
  return (
    <div style={{ width: '100%', maxWidth: 240 }}>
      <FormField label="Send reminders every">
        <NumberInput defaultValue={3} min={1} max={30} suffix="days" />
      </FormField>
    </div>
  );
}

export function NoStepper() {
  return (
    <div style={{ width: '100%', maxWidth: 240 }}>
      <FormField label="Contract value">
        <NumberInput hideStepper prefix="£" defaultValue={12000} step={100} />
      </FormField>
    </div>
  );
}
