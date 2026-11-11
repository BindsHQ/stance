import { ActionMenu, Button, Icon, type ActionMenuItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'action-menu',
  name: 'ActionMenu',
  category: 'actions',
  summary: 'A compact “more actions” menu built from an array — ideal for table rows and cards.',
  description:
    'ActionMenu is a convenience over DropdownMenu for the common overflow pattern: an icon button that reveals row-level or card-level actions. Describe the actions as data (labels, icons, shortcuts, separators, groups and submenus) and it renders an accessible menu. Use DropdownMenu directly when you need checkable items or custom content.',
  imports: ['ActionMenu', 'type ActionMenuItem'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', minHeight: 280 },
    { name: 'GroupsAndSubmenus', title: 'Groups and submenus', minHeight: 340 },
    {
      name: 'InARow',
      title: 'In a table row',
      description:
        'Give each trigger a unique label so screen-reader users know which row it acts on.',
      minHeight: 300,
      layout: 'fill',
    },
    { name: 'CustomTrigger', title: 'Custom trigger', minHeight: 260 },
  ],
  props: [
    {
      component: 'ActionMenu',
      name: 'items',
      type: 'ActionMenuItem[]',
      required: true,
      description:
        'Actions: `{ label, onSelect, icon, shortcut, destructive, disabled, items }`, `{ type: "separator" }` or `{ type: "group", label, items }`.',
    },
    {
      component: 'ActionMenu',
      name: 'label',
      type: 'string',
      default: "'More actions'",
      description: 'Accessible label of the default trigger. Make it specific in lists.',
    },
    {
      component: 'ActionMenu',
      name: 'trigger',
      type: 'ReactElement',
      description: 'Replace the default icon button (rendered with asChild).',
    },
    {
      component: 'ActionMenu',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Horizontal or vertical ellipsis icon.',
    },
    {
      component: 'ActionMenu',
      name: 'size',
      type: "'xs' | 'sm' | 'md'",
      default: "'sm'",
      description: 'Size of the default trigger.',
    },
    {
      component: 'ActionMenu',
      name: 'side / align',
      type: 'Side / Align',
      default: "'bottom' / 'end'",
      description: 'Menu placement.',
    },
    {
      component: 'ActionMenu',
      name: 'open / defaultOpen / onOpenChange',
      type: 'boolean / function',
      description: 'Open state.',
    },
    {
      component: 'ActionMenu',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disable the trigger.',
    },
  ],
  accessibility: [
    'The default trigger is an IconButton with an accessible name; pass a row-specific label such as “Actions for Ben Hughes”.',
    'Inherits the complete DropdownMenu keyboard model: arrows, Home/End, typeahead, submenus and Escape.',
    'Focus returns to the trigger after an action is chosen.',
  ],
  keyboard: [
    { keys: ['Enter', 'Space', 'ArrowDown'], description: 'Open and focus the first action.' },
    { keys: ['ArrowDown', 'ArrowUp'], description: 'Move between actions.' },
    { keys: ['Enter'], description: 'Run the focused action.' },
    { keys: ['Escape'], description: 'Close without acting.' },
  ],
  guidelines: {
    do: [
      'Show the primary row action inline and put the rest in the ActionMenu.',
      'Put destructive actions last, after a separator.',
    ],
    dont: ['Hide the only way to perform an important action inside an overflow menu.'],
  },
  related: ['dropdown-menu', 'icon-button', 'data-table'],
};

const signatureActions: ActionMenuItem[] = [
  { label: 'Edit signature', icon: <Icon name="pencil" />, shortcut: '⌘E' },
  { label: 'Duplicate', icon: <Icon name="copy" /> },
  { label: 'Preview in Outlook', icon: <Icon name="eye" /> },
  { type: 'separator' },
  { label: 'Delete', icon: <Icon name="trash" />, destructive: true },
];

export function Basic() {
  return <ActionMenu items={signatureActions} />;
}

export function GroupsAndSubmenus() {
  return (
    <ActionMenu
      label="Template options"
      orientation="vertical"
      items={[
        {
          type: 'group',
          label: 'Template',
          items: [
            { label: 'Customise', icon: <Icon name="sliders" /> },
            { label: 'Rename', icon: <Icon name="pencil" /> },
          ],
        },
        {
          label: 'Export',
          icon: <Icon name="download" />,
          items: [{ label: 'HTML file' }, { label: 'PNG image' }, { label: 'Copy to clipboard' }],
        },
        { label: 'Assign to department', icon: <Icon name="users" />, disabled: true },
        { type: 'separator' },
        { label: 'Archive template', icon: <Icon name="inbox" />, destructive: true },
      ]}
    />
  );
}

export function InARow() {
  const people = ['Amara Okafor', 'Ben Hughes', 'Chen Wei'];
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      {people.map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 4px',
            borderBottom: '1px solid var(--st-color-separator)',
            fontSize: 'var(--st-font-size-sm)',
          }}
        >
          <span>{name}</span>
          <ActionMenu
            label={`Actions for ${name}`}
            items={[
              { label: 'Edit signature', icon: <Icon name="pencil" /> },
              { label: 'Resend invite', icon: <Icon name="send" /> },
              { type: 'separator' },
              { label: 'Remove from organisation', icon: <Icon name="trash" />, destructive: true },
            ]}
          />
        </div>
      ))}
    </div>
  );
}

export function CustomTrigger() {
  return (
    <ActionMenu
      trigger={
        <Button variant="outline" size="sm" trailingIcon={<Icon name="chevron-down" />}>
          Manage
        </Button>
      }
      items={signatureActions}
    />
  );
}
