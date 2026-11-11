import { CodeBlock } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const tsx = `import { Button, ThemeProvider } from '@bindshq/stance-react';
import '@bindshq/stance-tokens/css';
import '@bindshq/stance-react/styles.css';

export function App() {
  // One system, two products
  return (
    <ThemeProvider>
      <Button>Save changes</Button>
    </ThemeProvider>
  );
}`;

export const doc: ComponentDoc = {
  slug: 'code-block',
  name: 'CodeBlock',
  category: 'media',
  summary: 'A multi-line code sample with title, line numbers, highlighting and copy.',
  description:
    'CodeBlock shows source code with light, dependency-free highlighting for TypeScript, CSS, shell and JSON. Code is always rendered as text, never as HTML. The scroll region is focusable so keyboard users can scroll long lines.',
  imports: ['CodeBlock'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    { name: 'LineNumbers', title: 'Line numbers and highlights', layout: 'fill' },
    { name: 'Shell', title: 'Shell', layout: 'fill' },
  ],
  props: [
    {
      component: 'CodeBlock',
      name: 'code',
      type: 'string',
      required: true,
      description: 'Source code (rendered as text).',
    },
    {
      component: 'CodeBlock',
      name: 'language',
      type: 'string',
      description: 'ts, tsx, js, jsx, css, bash, json. Others render plain.',
    },
    {
      component: 'CodeBlock',
      name: 'title',
      type: 'ReactNode',
      description: 'Title, e.g. a file name.',
    },
    {
      component: 'CodeBlock',
      name: 'showLineNumbers',
      type: 'boolean',
      default: 'false',
      description: 'Show line numbers.',
    },
    {
      component: 'CodeBlock',
      name: 'highlightLines',
      type: 'number[]',
      description: '1-based lines to emphasise.',
    },
    {
      component: 'CodeBlock',
      name: 'copyable',
      type: 'boolean',
      default: 'true',
      description: 'Show a copy button.',
    },
    {
      component: 'CodeBlock',
      name: 'wrap',
      type: 'boolean',
      default: 'false',
      description: 'Wrap long lines.',
    },
    {
      component: 'CodeBlock',
      name: 'maxHeight',
      type: 'string',
      description: 'Scroll beyond this height.',
    },
    {
      component: 'CodeBlock',
      name: 'label',
      type: 'string',
      description: 'Accessible name of the region.',
    },
  ],
  accessibility: [
    'The code region is focusable (tabindex="0") and labelled, so keyboard users can scroll it.',
    'Line numbers are aria-hidden so they are not read with the code.',
    'Highlighting never carries meaning on its own.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Focuses the copy button, then the scroll region.' },
    { keys: ['←', '→', '↑', '↓'], description: 'Scroll the focused code region.' },
  ],
  guidelines: {
    do: ['Keep samples short and runnable.'],
    dont: ['Render user-supplied HTML as code output.'],
  },
  related: ['copyable-code', 'code'],
};

export function Basic() {
  return <CodeBlock code={tsx} language="tsx" title="app.tsx" />;
}

export function LineNumbers() {
  return (
    <CodeBlock
      code={tsx}
      language="tsx"
      title="app.tsx"
      showLineNumbers
      highlightLines={[8, 9, 10]}
    />
  );
}

export function Shell() {
  return (
    <CodeBlock
      code={'# Install Stance\nnpm install @bindshq/stance-tokens @bindshq/stance-react'}
      language="bash"
    />
  );
}
