import { CopyableCode, Stack } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'copyable-code',
  name: 'CopyableCode',
  category: 'media',
  summary: 'One line of code with a copy button, for commands, keys and IDs.',
  description:
    'CopyableCode suits installation commands, API endpoints and identifiers. An optional prompt such as `$` is shown but not copied. Long values scroll horizontally instead of wrapping.',
  imports: ['CopyableCode'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Install command', layout: 'fill' },
    { name: 'Identifiers', title: 'Identifiers', layout: 'fill' },
  ],
  props: [
    {
      component: 'CopyableCode',
      name: 'value',
      type: 'string',
      required: true,
      description: 'Code to show and copy.',
    },
    {
      component: 'CopyableCode',
      name: 'prompt',
      type: 'string',
      description: 'Prefix shown but not copied.',
    },
    {
      component: 'CopyableCode',
      name: 'copyLabel',
      type: 'string',
      default: "'Copy to clipboard'",
      description: 'Accessible label of the copy button.',
    },
    {
      component: 'CopyableCode',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Text and button size.',
    },
  ],
  accessibility: [
    'The prompt is aria-hidden.',
    'Copy confirmation is announced via the CopyButton live region.',
  ],
  guidelines: {
    do: ['Give each copy button a specific label when several appear together.'],
    dont: ['Use for multi-line code; use CodeBlock.'],
  },
  related: ['copy-button', 'code-block'],
};

export function Basic() {
  return (
    <Stack gap={2} style={{ width: '100%', maxWidth: 520 }}>
      <CopyableCode
        prompt="$"
        value="npm install @bindshq/stance-tokens"
        copyLabel="Copy tokens install command"
      />
      <CopyableCode
        prompt="$"
        value="npm install @bindshq/stance-react"
        copyLabel="Copy React install command"
      />
    </Stack>
  );
}

export function Identifiers() {
  return (
    <Stack gap={2} style={{ width: '100%', maxWidth: 420 }}>
      <CopyableCode
        size="sm"
        value="https://api.binds.si/v1/signatures"
        copyLabel="Copy API endpoint"
      />
      <CopyableCode size="sm" value="org_8f2c91ae47" copyLabel="Copy organisation ID" />
    </Stack>
  );
}
