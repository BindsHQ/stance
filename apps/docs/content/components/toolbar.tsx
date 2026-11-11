import * as React from 'react';
import {
  Icon,
  IconButton,
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarSpacer,
  ToggleButton,
  Button,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'toolbar',
  name: 'Toolbar',
  category: 'actions',
  summary: 'Groups related controls into one tab stop with arrow-key navigation.',
  description:
    'Use Toolbar for clusters of frequently used controls that act on the same object, such as text formatting in the signature editor or bulk actions above a table. The whole toolbar is a single tab stop, and the arrow keys move between controls, which keeps keyboard navigation efficient on dense screens.',
  imports: ['Toolbar', 'ToolbarGroup', 'ToolbarSeparator', 'ToolbarSpacer'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Formatting toolbar' },
    {
      name: 'WithInputs',
      title: 'With a field and trailing actions',
      description:
        'Text fields keep Left and Right for the caret; Up and Down never apply in a horizontal toolbar.',
      layout: 'fill',
    },
    { name: 'Vertical', title: 'Vertical' },
  ],
  props: [
    {
      component: 'Toolbar',
      name: 'aria-label',
      type: 'string',
      required: true,
      description: 'Names the toolbar, e.g. “Text formatting”.',
    },
    {
      component: 'Toolbar',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Layout and arrow-key axis.',
    },
    {
      component: 'Toolbar',
      name: 'loop',
      type: 'boolean',
      default: 'true',
      description: 'Wrap focus from last to first.',
    },
    {
      component: 'Toolbar',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Spacing density.',
    },
    {
      component: 'Toolbar',
      name: 'bordered',
      type: 'boolean',
      default: 'true',
      description: 'Draw a surface and border.',
    },
    {
      component: 'ToolbarGroup',
      name: 'aria-label',
      type: 'string',
      description: 'Labels a cluster of related controls.',
    },
    {
      component: 'ToolbarSeparator',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'vertical'",
      description: 'Divider direction.',
    },
    {
      component: 'ToolbarSpacer',
      name: 'None',
      type: 'None',
      description: 'Pushes following controls to the far end.',
    },
  ],
  accessibility: [
    'Implements the WAI-ARIA toolbar pattern: role="toolbar", aria-orientation and a roving tabindex.',
    'Disabled controls are skipped by arrow keys.',
    'Text fields inside the toolbar keep Left, Right, Home and End for editing.',
    'Use ToggleButton for on/off formatting so aria-pressed communicates state.',
    'Icon-only controls need labels; IconButton requires one.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'Moves focus into the toolbar (last focused control), then out of it.',
    },
    { keys: ['←', '→'], description: 'Horizontal: previous or next control (wraps).' },
    { keys: ['↑', '↓'], description: 'Vertical: previous or next control (wraps).' },
    { keys: ['Home', 'End'], description: 'First or last control.' },
  ],
  guidelines: {
    do: [
      'Group related controls and separate groups with ToolbarSeparator.',
      'Keep the most used actions first.',
    ],
    dont: [
      'Put unrelated page navigation in a toolbar.',
      'Overload a toolbar; move rare actions to a menu.',
    ],
  },
  related: ['toggle-button', 'icon-button', 'button-group'],
};

export function Basic() {
  const [bold, setBold] = React.useState(true);
  const [italic, setItalic] = React.useState(false);
  return (
    <Toolbar aria-label="Signature text formatting">
      <ToolbarGroup aria-label="Style">
        <ToggleButton size="sm" pressed={bold} onPressedChange={setBold} aria-label="Bold">
          <strong>B</strong>
        </ToggleButton>
        <ToggleButton size="sm" pressed={italic} onPressedChange={setItalic} aria-label="Italic">
          <em>I</em>
        </ToggleButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup aria-label="Insert">
        <IconButton size="sm" variant="ghost" label="Insert link" icon={<Icon name="link" />} />
        <IconButton size="sm" variant="ghost" label="Insert image" icon={<Icon name="image" />} />
      </ToolbarGroup>
      <ToolbarSeparator />
      <IconButton size="sm" variant="ghost" label="Undo" icon={<Icon name="refresh" />} disabled />
    </Toolbar>
  );
}

export function WithInputs() {
  return (
    <Toolbar aria-label="Template actions">
      <input
        aria-label="Template name"
        defaultValue="Sales team signature"
        style={{
          height: 32,
          padding: '0 8px',
          border: '1px solid var(--st-color-border-control)',
          borderRadius: 6,
          background: 'var(--st-color-bg-surface)',
          color: 'inherit',
        }}
      />
      <ToolbarSeparator />
      <Button size="sm" variant="ghost" leadingIcon={<Icon name="eye" />}>
        Preview
      </Button>
      <ToolbarSpacer />
      <Button size="sm" variant="outline">
        Save draft
      </Button>
      <Button size="sm" leadingIcon={<Icon name="send" />}>
        Deploy
      </Button>
    </Toolbar>
  );
}

export function Vertical() {
  return (
    <Toolbar aria-label="Canvas tools" orientation="vertical">
      <IconButton size="sm" variant="ghost" label="Select" icon={<Icon name="square" />} />
      <IconButton size="sm" variant="ghost" label="Text" icon={<Icon name="type" />} />
      <IconButton size="sm" variant="ghost" label="Image" icon={<Icon name="image" />} />
      <ToolbarSeparator orientation="horizontal" />
      <IconButton size="sm" variant="ghost" label="Delete" icon={<Icon name="trash" />} />
    </Toolbar>
  );
}
