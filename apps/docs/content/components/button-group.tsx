import { Button, ButtonGroup, Icon, IconButton } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'button-group',
  name: 'ButtonGroup',
  category: 'actions',
  summary: 'Groups related buttons, either joined into a segmented bar or evenly spaced.',
  description:
    'Use ButtonGroup to show that several actions belong together, such as export formats or pagination steps. Attached groups read as one control; spaced groups simply align actions like dialog footers. For buttons that hold an on/off state, use ToggleButtonGroup instead.',
  imports: ['ButtonGroup'],
  status: 'stable',
  examples: [
    { name: 'Attached', title: 'Attached' },
    { name: 'Spaced', title: 'Spaced' },
    { name: 'Vertical', title: 'Vertical' },
    { name: 'WithIconButtons', title: 'With icon buttons' },
  ],
  props: [
    {
      component: 'ButtonGroup',
      name: 'variant',
      type: "'attached' | 'spaced'",
      default: "'attached'",
      description: 'Join buttons or keep a gap between them.',
    },
    {
      component: 'ButtonGroup',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Layout direction.',
    },
    {
      component: 'ButtonGroup',
      name: 'label',
      type: 'string',
      description: 'Accessible name for the group.',
    },
    {
      component: 'ButtonGroup',
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      description: 'Buttons share the full container width.',
    },
  ],
  accessibility: [
    'Renders role="group"; provide label so screen readers announce what the buttons relate to.',
    'Each button remains its own tab stop. For a single tab stop with arrow keys, use Toolbar or ToggleButtonGroup.',
  ],
  keyboard: [{ keys: ['Tab'], description: 'Moves between the buttons in the group.' }],
  guidelines: {
    do: ['Keep attached groups to between two and five actions of equal importance.'],
    dont: ['Mix primary and outline buttons in one attached group.'],
  },
  related: ['button', 'toggle-button', 'split-button', 'toolbar'],
};

export function Attached() {
  return (
    <ButtonGroup label="Export as">
      <Button variant="outline">PDF</Button>
      <Button variant="outline">HTML</Button>
      <Button variant="outline">Plain text</Button>
    </ButtonGroup>
  );
}

export function Spaced() {
  return (
    <ButtonGroup variant="spaced" label="Template actions">
      <Button variant="ghost">Cancel</Button>
      <Button variant="outline">Save draft</Button>
      <Button>Publish</Button>
    </ButtonGroup>
  );
}

export function Vertical() {
  return (
    <ButtonGroup orientation="vertical" label="Deploy to">
      <Button variant="outline">Microsoft 365</Button>
      <Button variant="outline">Google Workspace</Button>
      <Button variant="outline">Exchange relay</Button>
    </ButtonGroup>
  );
}

export function WithIconButtons() {
  return (
    <ButtonGroup label="Zoom">
      <IconButton variant="outline" label="Zoom out" icon={<Icon name="minus" />} />
      <Button variant="outline">100%</Button>
      <IconButton variant="outline" label="Zoom in" icon={<Icon name="plus" />} />
    </ButtonGroup>
  );
}
