import * as React from 'react';
import { Icon, PromptComposer, SlashCommandMenu } from '@bindshq/stance-react';
import type { SlashCommand } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'slash-command-menu',
  name: 'SlashCommandMenu',
  category: 'ai',
  summary:
    'A list of commands that opens when a draft starts with a slash, filtered as people type and chosen without leaving the text area.',
  description:
    'Use SlashCommandMenu to offer actions from the composer: summarise, translate, start again. It opens when the draft starts with a slash and filters by what follows. Your app decides when it opens and what a command does. For referencing files or people, use MentionPicker.',
  imports: ['SlashCommandMenu'],
  status: 'beta',
  examples: [
    {
      name: 'InComposer',
      title: 'Commands from a slash',
      description: 'Type after the slash to filter, then press Enter to run a command.',
      layout: 'fill',
      minHeight: 420,
    },
    {
      name: 'WithShortcuts',
      title: 'Icons and shortcuts',
      layout: 'fill',
      minHeight: 380,
    },
    {
      name: 'NoMatches',
      title: 'No matches',
      layout: 'fill',
      minHeight: 240,
    },
  ],
  props: [
    {
      component: 'SlashCommandMenu',
      name: 'open',
      type: 'boolean',
      required: true,
      description: 'Whether the list is showing.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'commands',
      type: 'SlashCommand[]',
      required: true,
      description: 'The commands: { id, name, description?, icon?, shortcut? }.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'anchor',
      type: 'RefObject<Element | null>',
      required: true,
      description:
        'The focused element the list belongs to, normally the composer text area. The list is placed against it and reads keys from it.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'query',
      type: 'string',
      default: "''",
      description: 'The text typed after the trigger character.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'onSelect',
      type: '(item) => void',
      description: 'Called with the chosen entry. Insert it or run it, then close the list.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called with false on Escape or a press outside.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'emptyLabel',
      type: 'ReactNode',
      default: "'No commands'",
      description: 'Shown when nothing matches.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Shows the loading label instead of the entries.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'loadingLabel',
      type: 'ReactNode',
      default: "'Loading'",
      description: 'Shown while loading.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'label',
      type: 'string',
      default: "'Commands'",
      description: 'Accessible name of the listbox.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'filter',
      type: 'boolean',
      default: 'true',
      description:
        'Filter by query on the name and description. Set false when the server filters.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'id',
      type: 'string',
      description: 'Id of the listbox, for aria-controls on the text area.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'onActiveDescendantChange',
      type: '(id: string | undefined) => void',
      description:
        'Called with the id of the active option, for aria-activedescendant on the text area.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'side / align',
      type: 'Side / Align',
      default: "'top' / 'start'",
      description: 'Placement against the anchor.',
    },
    {
      component: 'SlashCommandMenu',
      name: 'disablePortal',
      type: 'boolean',
      default: 'false',
      description: 'Render in place instead of in a portal.',
    },
  ],
  accessibility: [
    'A listbox with an accessible name, following the same pattern as MentionPicker. Focus stays in the text area.',
    'Point the text area at the menu with aria-controls and aria-activedescendant, using id and onActiveDescendantChange.',
    'Each option reads its name, its description and its shortcut. Shortcut keys have spoken labels, so ⌘ is read as Command.',
    'Escape closes only the menu and keeps the draft.',
    'The active option has a visible highlight, with an added outline in high contrast and forced colours.',
  ],
  keyboard: [
    {
      keys: ['↓', '↑'],
      description: 'Move the active option, wrapping at the ends.',
    },
    {
      keys: ['Home', 'End'],
      description: 'Move to the first or last option.',
    },
    {
      keys: ['Enter', 'Tab'],
      description: 'Choose the active option.',
    },
    {
      keys: ['Esc'],
      description: 'Closes the list and keeps the draft.',
    },
  ],
  guidelines: {
    do: [
      'Name commands with one plain verb and describe the result in a few words.',
      'Keep the list short enough to scan; put the most used commands first.',
    ],
    dont: [
      'Offer a command only here; give important actions a visible control too.',
      'Run a destructive command without asking first.',
    ],
  },
  related: ['prompt-composer', 'mention-picker', 'command-menu', 'command-palette', 'kbd'],
};

const commands: SlashCommand[] = [
  { id: 'summarise', name: 'summarise', description: 'Shorten the attached document' },
  { id: 'translate', name: 'translate', description: 'Translate the last reply' },
  { id: 'rewrite', name: 'rewrite', description: 'Change the tone of a draft' },
  { id: 'clear', name: 'clear', description: 'Start a new conversation' },
];

const commandsWithShortcuts: SlashCommand[] = [
  {
    id: 'summarise',
    name: 'summarise',
    description: 'Shorten the attached document',
    icon: <Icon name="file-text" />,
    shortcut: ['mod', 's'],
  },
  {
    id: 'search',
    name: 'search',
    description: 'Look something up on the web',
    icon: <Icon name="globe" />,
    shortcut: ['mod', 'k'],
  },
  {
    id: 'clear',
    name: 'clear',
    description: 'Start a new conversation',
    icon: <Icon name="refresh" />,
    shortcut: ['mod', 'shift', 'n'],
  },
];

export function InComposer() {
  const anchor = React.useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = React.useState('/');
  const [dismissed, setDismissed] = React.useState(false);
  const [active, setActive] = React.useState<string | undefined>(undefined);
  const [ran, setRan] = React.useState('');
  const open = /^\/\S*$/.test(draft) && !dismissed;
  return (
    <div style={{ width: '100%', maxWidth: 520, alignSelf: 'end' }}>
      <PromptComposer
        value={draft}
        onValueChange={(next) => {
          setDraft(next);
          setDismissed(false);
        }}
        placeholder="Type / for commands"
        textareaRef={anchor}
        textareaProps={{
          'aria-haspopup': 'listbox',
          'aria-controls': open ? 'command-list' : undefined,
          'aria-activedescendant': active,
        }}
        footer={<span>{ran ? `Ran /${ran}.` : 'Start a message with a slash.'}</span>}
      />
      <SlashCommandMenu
        id="command-list"
        open={open}
        query={draft}
        commands={commands}
        anchor={anchor}
        onActiveDescendantChange={setActive}
        onOpenChange={(next) => setDismissed(!next)}
        onSelect={(command) => {
          setRan(command.name);
          setDraft('');
        }}
      />
    </div>
  );
}

export function WithShortcuts() {
  const anchor = React.useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ width: '100%', maxWidth: 520, alignSelf: 'end' }}>
      <textarea
        ref={anchor}
        aria-label="Message"
        aria-haspopup="listbox"
        rows={2}
        defaultValue="/"
        onFocus={() => setOpen(true)}
        style={{ width: '100%', font: 'inherit', padding: 8 }}
      />
      <SlashCommandMenu
        open={open}
        commands={commandsWithShortcuts}
        anchor={anchor}
        onOpenChange={setOpen}
        onSelect={() => setOpen(false)}
      />
    </div>
  );
}

export function NoMatches() {
  const anchor = React.useRef<HTMLTextAreaElement>(null);
  return (
    <div style={{ width: '100%', maxWidth: 520, alignSelf: 'end' }}>
      <textarea
        ref={anchor}
        aria-label="Message"
        rows={2}
        defaultValue="/export"
        style={{ width: '100%', font: 'inherit', padding: 8 }}
      />
      <SlashCommandMenu
        open
        query="/export"
        commands={commands}
        anchor={anchor}
        emptyLabel="No command called export"
      />
    </div>
  );
}
