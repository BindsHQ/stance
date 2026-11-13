import * as React from 'react';
import { Button, PermissionSheet } from '@bindshq/stance-react';
import type { PermissionSheetPermission } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'permission-sheet',
  name: 'PermissionSheet',
  category: 'ai',
  summary:
    'A sheet where people choose what an agent or connector can access, one switch per permission, each with its scope.',
  description:
    'Use PermissionSheet when connecting an agent to data or tools, and later so people can review what they granted. Each permission has a plain title, a scope and a switch. Permissions the agent cannot work without stay on and say why.',
  imports: ['PermissionSheet'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Review permissions',
      description: 'Changes apply when saved.',
      minHeight: 520,
    },
    {
      name: 'Immediate',
      title: 'Switches that apply at once',
      description: 'Without onSave there is no footer and each switch takes effect immediately.',
      minHeight: 520,
    },
    {
      name: 'Risk',
      title: 'Risk labels',
      description: 'Medium and high risk permissions are labelled in words.',
      minHeight: 520,
    },
  ],
  props: [
    {
      component: 'PermissionSheet',
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state.',
    },
    {
      component: 'PermissionSheet',
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Open on first render when uncontrolled.',
    },
    {
      component: 'PermissionSheet',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the sheet opens or closes.',
    },
    {
      component: 'PermissionSheet',
      name: 'title',
      type: 'React.ReactNode',
      required: true,
      description: 'Who is asking, for example Calendar connector permissions.',
    },
    {
      component: 'PermissionSheet',
      name: 'description',
      type: 'React.ReactNode',
      description: 'One or two sentences on what the permissions are for.',
    },
    {
      component: 'PermissionSheet',
      name: 'permissions',
      type: 'PermissionSheetPermission[]',
      required: true,
      description: 'The permissions: id, title, description, granted, required and risk.',
    },
    {
      component: 'PermissionSheet',
      name: 'onPermissionsChange',
      type: '(permissions: PermissionSheetPermission[]) => void',
      description: 'Called with the next permissions when a switch changes.',
    },
    {
      component: 'PermissionSheet',
      name: 'onSave',
      type: '(permissions: PermissionSheetPermission[]) => void',
      description:
        'Called with the permissions when Save is pressed. The sheet then closes. Shows the footer.',
    },
    {
      component: 'PermissionSheet',
      name: 'height',
      type: "'auto' | 'half' | 'full'",
      default: "'auto'",
      description: 'Sheet height.',
    },
    {
      component: 'PermissionSheet',
      name: 'children',
      type: 'React.ReactNode',
      description: 'Extra content under the list, such as a link to a privacy policy.',
    },
    {
      component: 'PermissionSheet',
      name: 'labels',
      type: 'PermissionSheetLabelOverrides',
      description: 'Translations: save, cancel, close, required and the risk words.',
    },
  ],
  accessibility: [
    'A modal dialog named by its title. Focus moves in on open and returns to the opener on close.',
    'The switches sit in a group that shares the title as its name.',
    'Each switch is named by its permission and risk, and described by its scope.',
    'Required permissions are on, disabled and explained in their description.',
    'Risk is written in words, never colour alone.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'Moves through the switches and the buttons. Focus stays inside.',
    },
    { keys: ['Space', 'Enter'], description: 'Turns the focused permission on or off.' },
    { keys: ['Escape'], description: 'Closes the sheet without saving.' },
  ],
  guidelines: {
    do: [
      'Name each permission by what the agent can do, and give the scope underneath.',
      'Ask for the least access that lets the task work.',
      'Let people come back and change their choices at any time.',
    ],
    dont: [
      'Turn optional permissions on by default.',
      'Bundle several kinds of access into one switch.',
    ],
  },
  related: ['approval-prompt', 'sheet', 'switch', 'copilot-panel'],
};

const calendar: PermissionSheetPermission[] = [
  {
    id: 'read',
    title: 'Read your calendar',
    description: 'Events from the last 30 days and the next 90.',
    granted: true,
    required: true,
  },
  {
    id: 'create',
    title: 'Create events',
    description: 'Only in calendars you own.',
    granted: true,
  },
  {
    id: 'contacts',
    title: 'Read your contacts',
    description: 'Names and email addresses, to suggest attendees.',
    granted: false,
  },
];

export function Basic() {
  const [open, setOpen] = React.useState(false);
  const [saved, setSaved] = React.useState(calendar);
  const [draft, setDraft] = React.useState(calendar);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setDraft(saved);
          setOpen(true);
        }}
      >
        Manage permissions
      </Button>
      <PermissionSheet
        open={open}
        onOpenChange={setOpen}
        title="Calendar connector"
        description="Choose what the assistant can do with your calendar."
        permissions={draft}
        onPermissionsChange={setDraft}
        onSave={setSaved}
      />
    </>
  );
}

export function Immediate() {
  const [open, setOpen] = React.useState(false);
  const [permissions, setPermissions] = React.useState(calendar);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {permissions.filter((p) => p.granted).length} of {permissions.length} granted
      </Button>
      <PermissionSheet
        open={open}
        onOpenChange={setOpen}
        title="Calendar connector"
        permissions={permissions}
        onPermissionsChange={setPermissions}
      />
    </>
  );
}

const files: PermissionSheetPermission[] = [
  { id: 'read', title: 'Read files', description: 'In the Contracts folder.', granted: true },
  {
    id: 'edit',
    title: 'Edit files',
    description: 'Changes are saved as new versions.',
    granted: false,
    risk: 'medium',
  },
  {
    id: 'delete',
    title: 'Delete files',
    description: 'Deleted files stay in the bin for 30 days.',
    granted: false,
    risk: 'high',
  },
];

export function Risk() {
  const [open, setOpen] = React.useState(false);
  const [permissions, setPermissions] = React.useState(files);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        File access
      </Button>
      <PermissionSheet
        open={open}
        onOpenChange={setOpen}
        title="File access for the research agent"
        description="The agent asks again before each high risk action."
        permissions={permissions}
        onPermissionsChange={setPermissions}
        onSave={() => {}}
      />
    </>
  );
}
