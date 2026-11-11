import { Checkbox, FormField, Input, NativeSelect, Textarea } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'form-field',
  name: 'FormField',
  category: 'forms',
  summary: 'Wires a label, help text and error message to any Stance form control.',
  description:
    'FormField is the standard wrapper for a single form control. It renders the label, description and error and passes ids and ARIA state to the control through context, so every Stance input, select, checkbox, switch, slider and file upload is labelled and described correctly with no manual id plumbing.',
  imports: ['FormField'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    {
      name: 'Validation',
      title: 'Validation',
      description: 'An error marks the control aria-invalid and is announced via role="alert".',
      layout: 'start',
    },
    {
      name: 'Horizontal',
      title: 'Horizontal layout',
      description: 'Label beside the control on wide screens; stacks on phones.',
      layout: 'fill',
    },
    { name: 'AnyControl', title: 'With other controls', layout: 'start' },
  ],
  props: [
    {
      component: 'FormField',
      name: 'label',
      type: 'ReactNode',
      description: 'Visible label, associated with the control.',
    },
    {
      component: 'FormField',
      name: 'description',
      type: 'ReactNode',
      description: 'Help text, linked via aria-describedby.',
    },
    {
      component: 'FormField',
      name: 'error',
      type: 'ReactNode',
      description: 'Error message. Its presence marks the field invalid.',
    },
    {
      component: 'FormField',
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: 'Adds a required indicator and sets required on the control.',
    },
    {
      component: 'FormField',
      name: 'optionalText',
      type: 'ReactNode',
      description: 'Marker for optional fields, e.g. "Optional".',
    },
    {
      component: 'FormField',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the control.',
    },
    {
      component: 'FormField',
      name: 'readOnly',
      type: 'boolean',
      default: 'false',
      description: 'Makes the control read-only.',
    },
    {
      component: 'FormField',
      name: 'id',
      type: 'string',
      description: 'Explicit id for the control; generated otherwise.',
    },
    {
      component: 'FormField',
      name: 'orientation',
      type: "'vertical' | 'horizontal'",
      default: "'vertical'",
      description: 'Label above or beside the control.',
    },
    {
      component: 'FormField',
      name: 'hideLabel',
      type: 'boolean',
      default: 'false',
      description: 'Visually hides the label but keeps it accessible.',
    },
    {
      component: 'useFormFieldControl',
      name: '(props) => props',
      type: 'hook',
      description: 'Merges field state into your own custom control’s props.',
    },
  ],
  accessibility: [
    'The label is a real <label for>, so clicking it focuses or toggles the control.',
    'Description and error are both referenced by aria-describedby, in that order.',
    'Errors render with role="alert" so they are announced when they appear.',
    'The required indicator is decorative; ", required" is announced through visually hidden text.',
    'Errors carry an icon as well as colour, so they are not communicated by colour alone.',
  ],
  guidelines: {
    do: ['Use one FormField per control.', 'Write errors that say how to fix the problem.'],
    dont: [
      'Nest FormFields.',
      'Use FormField around a CheckboxGroup or RadioGroup — they render their own fieldset and legend.',
    ],
  },
  related: ['input', 'label', 'checkbox-group', 'radio-group'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <FormField label="Full name" description="As it should appear on signed documents." required>
        <Input autoComplete="name" />
      </FormField>
    </div>
  );
}

export function Validation() {
  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <FormField label="Signer email" error="Enter an email address like name@company.com" required>
        <Input type="email" defaultValue="priya@" />
      </FormField>
    </div>
  );
}

export function Horizontal() {
  return (
    <div style={{ display: 'grid', gap: 16, width: '100%', maxWidth: 640 }}>
      <FormField
        label="Display name"
        orientation="horizontal"
        description="Visible to your organisation."
      >
        <Input defaultValue="Acme Legal" />
      </FormField>
      <FormField label="Department" orientation="horizontal" optionalText="Optional">
        <Input />
      </FormField>
    </div>
  );
}

export function AnyControl() {
  return (
    <div style={{ display: 'grid', gap: 16, width: '100%', maxWidth: 380 }}>
      <FormField label="Default template">
        <NativeSelect
          options={[
            { value: 'classic', label: 'Classic' },
            { value: 'minimal', label: 'Minimal' },
          ]}
        />
      </FormField>
      <FormField label="Disclaimer" description="Appended below every signature.">
        <Textarea rows={3} />
      </FormField>
      <FormField label="Accept the data processing terms" error="You must accept to continue">
        <Checkbox />
      </FormField>
    </div>
  );
}
