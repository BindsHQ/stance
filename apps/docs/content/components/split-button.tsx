import { DropdownMenuItem, DropdownMenuSeparator, Icon, SplitButton } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'split-button',
  name: 'SplitButton',
  category: 'actions',
  summary: 'A primary action joined to a menu of closely related alternatives.',
  description:
    'Use SplitButton when one action is the clear default but a few variations are useful, such as “Deploy signatures” with “Schedule deployment”. The left half performs the default; the right half opens a DropdownMenu. If the actions are equally important, use a ButtonGroup or separate buttons instead.',
  imports: ['SplitButton', 'DropdownMenuItem'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 240 },
    { name: 'Variants', title: 'Variants', minHeight: 240 },
    { name: 'Sizes', title: 'Sizes', minHeight: 240 },
    { name: 'States', title: 'Loading and disabled', minHeight: 200 },
  ],
  props: [
    {
      component: 'SplitButton',
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: 'Label of the primary action.',
    },
    {
      component: 'SplitButton',
      name: 'onClick',
      type: 'MouseEventHandler',
      description: 'Runs the primary action.',
    },
    {
      component: 'SplitButton',
      name: 'menu',
      type: 'ReactNode',
      required: true,
      description: 'DropdownMenuItem elements for the alternatives.',
    },
    {
      component: 'SplitButton',
      name: 'variant',
      type: "'primary' | 'secondary' | 'outline'",
      default: "'primary'",
      description: 'Visual emphasis for both halves.',
    },
    {
      component: 'SplitButton',
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Control height.',
    },
    {
      component: 'SplitButton',
      name: 'menuLabel',
      type: 'string',
      default: "'More options'",
      description: 'Accessible label of the menu toggle.',
    },
    {
      component: 'SplitButton',
      name: 'menuAlign',
      type: "'start' | 'center' | 'end'",
      default: "'end'",
      description: 'Menu alignment.',
    },
    {
      component: 'SplitButton',
      name: 'menuDisabled',
      type: 'boolean',
      default: 'false',
      description: 'Disable only the toggle.',
    },
    {
      component: 'SplitButton',
      name: 'disabled / loading / leadingIcon',
      type: 'None',
      description: 'As Button, applied to the primary half (disabled applies to both).',
    },
  ],
  accessibility: [
    'Both halves are native buttons inside a role="group"; the toggle has its own accessible label and aria-haspopup="menu".',
    'Each half is a separate tab stop so keyboard users can reach either directly.',
    'The menu inherits the full DropdownMenu keyboard model.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Move between the action and the menu toggle.' },
    { keys: ['Enter', 'Space'], description: 'Run the action, or open the menu from the toggle.' },
    { keys: ['ArrowDown'], description: 'On the toggle: open the menu.' },
  ],
  guidelines: {
    do: [
      'Keep alternatives closely related to the primary action.',
      'Label the toggle descriptively when there are several split buttons.',
    ],
    dont: ['Put unrelated or destructive actions in the menu.'],
  },
  related: ['button', 'dropdown-menu', 'button-group'],
};

export function Basic() {
  return (
    <SplitButton
      leadingIcon={<Icon name="send" />}
      menuLabel="More deployment options"
      menu={
        <>
          <DropdownMenuItem icon={<Icon name="clock" />}>Schedule deployment</DropdownMenuItem>
          <DropdownMenuItem icon={<Icon name="users" />}>Deploy to selected users</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem icon={<Icon name="eye" />}>Preview changes</DropdownMenuItem>
        </>
      }
    >
      Deploy signatures
    </SplitButton>
  );
}

export function Variants() {
  const menu = (
    <>
      <DropdownMenuItem>Save as draft</DropdownMenuItem>
      <DropdownMenuItem>Save as new template</DropdownMenuItem>
    </>
  );
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <SplitButton menu={menu}>Save</SplitButton>
      <SplitButton variant="secondary" menu={menu}>
        Save
      </SplitButton>
      <SplitButton variant="outline" menu={menu}>
        Save
      </SplitButton>
    </div>
  );
}

export function Sizes() {
  const menu = <DropdownMenuItem>Export as PNG</DropdownMenuItem>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
      <SplitButton size="xs" variant="outline" menu={menu}>
        Export
      </SplitButton>
      <SplitButton size="sm" variant="outline" menu={menu}>
        Export
      </SplitButton>
      <SplitButton size="md" variant="outline" menu={menu}>
        Export
      </SplitButton>
      <SplitButton size="lg" variant="outline" menu={menu}>
        Export
      </SplitButton>
    </div>
  );
}

export function States() {
  const menu = <DropdownMenuItem>Retry failed only</DropdownMenuItem>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <SplitButton loading menu={menu}>
        Syncing users
      </SplitButton>
      <SplitButton disabled menu={menu}>
        Sync users
      </SplitButton>
    </div>
  );
}
