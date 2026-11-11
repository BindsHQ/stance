import { FormField, Textarea } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'textarea',
  name: 'Textarea',
  category: 'forms',
  summary: 'Multi-line text entry with optional auto-resize and a character counter.',
  description:
    'Use Textarea for free text that may span several lines: messages to signers, disclaimers, notes. Turn on autoResize so the field grows with its content up to maxRows, and showCount when there is a length limit.',
  imports: ['Textarea', 'FormField'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'start' },
    { name: 'AutoResize', title: 'Auto-resize', layout: 'start' },
    {
      name: 'CharacterCount',
      title: 'Character count',
      description: 'The count is linked by aria-describedby and turns red past the limit.',
      layout: 'start',
    },
    { name: 'Invalid', title: 'Invalid', layout: 'start' },
  ],
  props: [
    {
      component: 'Textarea',
      name: 'autoResize',
      type: 'boolean',
      default: 'false',
      description: 'Grow with content between rows and maxRows.',
    },
    {
      component: 'Textarea',
      name: 'rows',
      type: 'number',
      default: '3',
      description: 'Initial visible rows.',
    },
    {
      component: 'Textarea',
      name: 'maxRows',
      type: 'number',
      default: '12',
      description: 'Maximum rows when auto-resizing; then it scrolls.',
    },
    {
      component: 'Textarea',
      name: 'showCount',
      type: 'boolean',
      default: 'false',
      description: 'Show a counter; uses maxLength as the limit.',
    },
    {
      component: 'Textarea',
      name: 'resize',
      type: "'none' | 'vertical' | 'both'",
      default: "'vertical'",
      description: 'Manual resize handle (ignored with autoResize).',
    },
    {
      component: 'Textarea',
      name: 'invalid',
      type: 'boolean',
      description: 'Marks the field invalid.',
    },
    {
      component: 'Textarea',
      name: 'wrapperClassName',
      type: 'string',
      description: 'Class for the outer field box.',
    },
    {
      component: 'Textarea',
      name: '...props',
      type: 'TextareaHTMLAttributes',
      description: 'Native textarea attributes.',
    },
  ],
  accessibility: [
    'Integrates with FormField for label, description, error and required state.',
    'The character count is included in the accessible description and read on focus, rather than announced on every keystroke.',
    'maxLength stops input at the limit natively; omit it and validate on submit if you prefer to let users paste then trim.',
  ],
  keyboard: [{ keys: ['Enter'], description: 'Inserts a new line (does not submit the form).' }],
  related: ['input', 'form-field', 'rich-text'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <FormField label="Message to signers" description="Included in the signing request email.">
        <Textarea placeholder="Please review and sign the attached agreement by Friday." />
      </FormField>
    </div>
  );
}

export function AutoResize() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <FormField label="Internal notes">
        <Textarea
          autoResize
          rows={2}
          maxRows={6}
          defaultValue={'Renewal terms agreed on the call.\nLegal to confirm the liability cap.'}
        />
      </FormField>
    </div>
  );
}

export function CharacterCount() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <FormField label="Email disclaimer">
        <Textarea
          showCount
          maxLength={280}
          defaultValue="This email and any attachments are confidential and intended solely for the addressee."
        />
      </FormField>
    </div>
  );
}

export function Invalid() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <FormField
        label="Reason for rejection"
        error="Tell the sender why you are rejecting the document"
        required
      >
        <Textarea />
      </FormField>
    </div>
  );
}
