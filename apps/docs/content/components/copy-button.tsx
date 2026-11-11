import { CopyButton, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'copy-button',
  name: 'CopyButton',
  category: 'actions',
  summary: 'Copies text to the clipboard and confirms it visually and to screen readers.',
  description:
    'CopyButton copies a value and shows confirmation for two seconds. It uses the asynchronous Clipboard API and falls back to the legacy command. The result is announced through a polite live region. By default it is icon-only, with its label as the accessible name.',
  imports: ['CopyButton'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Icon only' },
    { name: 'WithLabel', title: 'With label' },
    { name: 'InContext', title: 'In context', layout: 'start' },
  ],
  props: [
    {
      component: 'CopyButton',
      name: 'value',
      type: 'string | (() => string)',
      required: true,
      description: 'Text to copy, or a function evaluated on click.',
    },
    {
      component: 'CopyButton',
      name: 'label',
      type: 'string',
      default: "'Copy'",
      description: 'Visible or accessible label.',
    },
    {
      component: 'CopyButton',
      name: 'copiedLabel',
      type: 'string',
      default: "'Copied'",
      description: 'Label after copying.',
    },
    {
      component: 'CopyButton',
      name: 'showLabel',
      type: 'boolean',
      default: 'false',
      description: 'Show text beside the icon.',
    },
    {
      component: 'CopyButton',
      name: 'onCopy',
      type: '(success: boolean) => void',
      description: 'Called after each attempt.',
    },
    {
      component: 'CopyButton',
      name: 'timeout',
      type: 'number',
      default: '2000',
      description: 'Duration of the copied state in ms.',
    },
    {
      component: 'CopyButton',
      name: 'variant | size',
      type: 'ButtonProps',
      default: "'ghost' | 'sm'",
      description: 'Button appearance.',
    },
  ],
  accessibility: [
    'Icon-only buttons use the label as aria-label, which updates to “Copied”.',
    'Success or failure is announced in a polite live region.',
  ],
  keyboard: [{ keys: ['Enter', 'Space'], description: 'Copies the value.' }],
  guidelines: {
    do: ['Place next to the value it copies.'],
    dont: ['Copy secrets without the user asking.'],
  },
  related: ['copyable-code', 'button'],
};

export function Basic() {
  return <CopyButton value="org_8f2c91" label="Copy organisation ID" />;
}

export function WithLabel() {
  return (
    <CopyButton value="https://binds.si/s/acme" label="Copy link" showLabel variant="outline" />
  );
}

export function InContext() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Text size="sm" as="span">
        Template ID: <code>tpl_42ab7</code>
      </Text>
      <CopyButton value="tpl_42ab7" label="Copy template ID" size="xs" />
    </div>
  );
}
