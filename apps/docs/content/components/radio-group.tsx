import { Radio, RadioGroup } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'radio-group',
  name: 'RadioGroup',
  category: 'forms',
  summary: 'A labelled set of mutually exclusive options, with list and card layouts.',
  description:
    'Use RadioGroup when exactly one option must be chosen from a small, visible set, especially when options need explanation. The card variant suits plan or workflow choices with descriptions. For long lists, use Select or NativeSelect; for two-state settings that apply immediately, use Switch.',
  imports: ['RadioGroup', 'Radio'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'Cards', title: 'Card variant', layout: 'fill' },
    { name: 'Horizontal', title: 'Horizontal', layout: 'start' },
    { name: 'Validation', title: 'Validation and disabled options', layout: 'start' },
  ],
  props: [
    {
      component: 'RadioGroup',
      name: 'label',
      type: 'ReactNode',
      required: true,
      description: 'Group label, rendered as the legend.',
    },
    {
      component: 'RadioGroup',
      name: 'value',
      type: 'string | null',
      description: 'Controlled value.',
    },
    {
      component: 'RadioGroup',
      name: 'defaultValue',
      type: 'string | null',
      default: 'null',
      description: 'Initial value.',
    },
    {
      component: 'RadioGroup',
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Called when the selection changes.',
    },
    {
      component: 'RadioGroup',
      name: 'name',
      type: 'string',
      description: 'Form field name; generated if omitted.',
    },
    {
      component: 'RadioGroup',
      name: 'variant',
      type: "'default' | 'card'",
      default: "'default'",
      description: 'List of radios or selectable cards.',
    },
    {
      component: 'RadioGroup',
      name: 'orientation',
      type: "'vertical' | 'horizontal'",
      default: "'vertical'",
      description: 'Layout of the options.',
    },
    {
      component: 'RadioGroup',
      name: 'description / error',
      type: 'ReactNode',
      description: 'Help text and error message.',
    },
    {
      component: 'RadioGroup',
      name: 'required / disabled',
      type: 'boolean',
      default: 'false',
      description: 'Required indicator and native required; disable all options.',
    },
    {
      component: 'Radio',
      name: 'value',
      type: 'string',
      required: true,
      description: 'The option value.',
    },
    { component: 'Radio', name: 'label', type: 'ReactNode', description: 'Option label.' },
    {
      component: 'Radio',
      name: 'description',
      type: 'ReactNode',
      description: 'Supporting text, linked via aria-describedby.',
    },
    { component: 'Radio', name: 'disabled', type: 'boolean', description: 'Disables this option.' },
  ],
  accessibility: [
    'Built from native radio inputs sharing one name, so arrow keys move selection and Tab enters on the checked option, exactly as browsers implement it.',
    'The fieldset carries role="radiogroup" with the legend as its name; error and required state are exposed on the group.',
    'Card options show focus on the whole card and selection with both border weight and the radio dot, not colour alone.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves into the group (to the checked option) and out of it.' },
    { keys: ['ArrowDown', 'ArrowRight'], description: 'Selects the next option.' },
    { keys: ['ArrowUp', 'ArrowLeft'], description: 'Selects the previous option.' },
    { keys: ['Space'], description: 'Selects the focused option if none is selected.' },
  ],
  guidelines: {
    do: [
      'Pre-select the safest or most common option when there is one.',
      'Keep options to about seven or fewer.',
    ],
    dont: ['Use radios for a single on/off choice; use Checkbox or Switch.'],
  },
  related: ['checkbox-group', 'select', 'switch'],
};

export function Basic() {
  return (
    <RadioGroup label="Signing order" defaultValue="parallel">
      <Radio
        value="parallel"
        label="Any order"
        description="Everyone receives the request at once."
      />
      <Radio
        value="sequential"
        label="One after another"
        description="Each signer is notified when the previous one finishes."
      />
    </RadioGroup>
  );
}

export function Cards() {
  return (
    <RadioGroup
      label="Deployment method"
      variant="card"
      defaultValue="relay"
      orientation="horizontal"
    >
      <Radio
        value="relay"
        label="Exchange relay"
        description="Signatures are applied server-side to every outgoing email."
      />
      <Radio
        value="addin"
        label="Outlook add-in"
        description="Users pick their signature while composing."
      />
      <Radio
        value="manual"
        label="Manual install"
        description="Users copy the HTML into their mail client."
      />
    </RadioGroup>
  );
}

export function Horizontal() {
  return (
    <RadioGroup label="Logo size" orientation="horizontal" defaultValue="md" size="sm">
      <Radio value="sm" label="Small" />
      <Radio value="md" label="Medium" />
      <Radio value="lg" label="Large" />
    </RadioGroup>
  );
}

export function Validation() {
  return (
    <RadioGroup label="Plan" required error="Choose a plan to continue">
      <Radio value="starter" label="Starter" />
      <Radio value="team" label="Team" />
      <Radio value="enterprise" label="Enterprise" description="Contact sales" disabled />
    </RadioGroup>
  );
}
