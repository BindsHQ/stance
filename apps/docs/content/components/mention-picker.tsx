import * as React from 'react';
import { Icon, MentionPicker, PromptComposer } from '@bindshq/stance-react';
import type { MentionItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'mention-picker',
  name: 'MentionPicker',
  category: 'ai',
  summary:
    'A filterable list that opens from a trigger character in the composer, to reference files, people or tools by name.',
  description:
    'Open MentionPicker when someone types a trigger character such as @ in PromptComposer. Focus stays in the text area while arrow keys move through the list. The picker does not parse the draft: your app decides when it opens, passes the query, and inserts the chosen item.',
  imports: ['MentionPicker'],
  status: 'beta',
  examples: [
    {
      name: 'InComposer',
      title: 'Mention with @',
      description: 'Type @ to open the list, keep typing to filter, then press Enter.',
      layout: 'fill',
      minHeight: 420,
    },
    {
      name: 'Grouped',
      title: 'Groups and icons',
      layout: 'fill',
      minHeight: 420,
    },
    {
      name: 'LoadingAndEmpty',
      title: 'Loading and no matches',
      description: 'With filter off the app supplies results, for example from a search request.',
      layout: 'fill',
      minHeight: 260,
    },
  ],
  props: [
    {
      component: 'MentionPicker',
      name: 'open',
      type: 'boolean',
      required: true,
      description: 'Whether the list is showing.',
    },
    {
      component: 'MentionPicker',
      name: 'items',
      type: 'MentionItem[]',
      required: true,
      description: 'What can be referenced: { id, label, description?, icon?, group? }.',
    },
    {
      component: 'MentionPicker',
      name: 'anchor',
      type: 'RefObject<Element | null>',
      required: true,
      description:
        'The focused element the list belongs to, normally the composer text area. The list is placed against it and reads keys from it.',
    },
    {
      component: 'MentionPicker',
      name: 'query',
      type: 'string',
      default: "''",
      description: 'The text typed after the trigger character.',
    },
    {
      component: 'MentionPicker',
      name: 'onSelect',
      type: '(item) => void',
      description: 'Called with the chosen entry. Insert it or run it, then close the list.',
    },
    {
      component: 'MentionPicker',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called with false on Escape or a press outside.',
    },
    {
      component: 'MentionPicker',
      name: 'emptyLabel',
      type: 'ReactNode',
      default: "'No matches'",
      description: 'Shown when nothing matches.',
    },
    {
      component: 'MentionPicker',
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Shows the loading label instead of the entries.',
    },
    {
      component: 'MentionPicker',
      name: 'loadingLabel',
      type: 'ReactNode',
      default: "'Loading'",
      description: 'Shown while loading.',
    },
    {
      component: 'MentionPicker',
      name: 'label',
      type: 'string',
      default: "'Mentions'",
      description: 'Accessible name of the listbox.',
    },
    {
      component: 'MentionPicker',
      name: 'filter',
      type: 'boolean',
      default: 'true',
      description:
        'Filter by query on the name and description. Set false when the server filters.',
    },
    {
      component: 'MentionPicker',
      name: 'id',
      type: 'string',
      description: 'Id of the listbox, for aria-controls on the text area.',
    },
    {
      component: 'MentionPicker',
      name: 'onActiveDescendantChange',
      type: '(id: string | undefined) => void',
      description:
        'Called with the id of the active option, for aria-activedescendant on the text area.',
    },
    {
      component: 'MentionPicker',
      name: 'side / align',
      type: 'Side / Align',
      default: "'top' / 'start'",
      description: 'Placement against the anchor.',
    },
    {
      component: 'MentionPicker',
      name: 'disablePortal',
      type: 'boolean',
      default: 'false',
      description: 'Render in place instead of in a portal.',
    },
  ],
  accessibility: [
    'A listbox with an accessible name. Focus never leaves the text area, so typing continues without interruption.',
    'Point the text area at the list with aria-controls and aria-activedescendant, using id and onActiveDescendantChange. Screen readers then read each option as it becomes active.',
    'The active option is marked with aria-selected and a visible highlight, with an added outline in high contrast and forced colours.',
    'Escape closes only the list. The draft and the caret stay as they were.',
    'Loading and empty states are a polite status, so they are announced without moving focus.',
    'Options are at least 32 pixels tall, and 44 pixels on touch screens.',
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
      'Open it as soon as the trigger character is typed and filter with every keystroke.',
      'Add a description when names alone are ambiguous, such as a file path.',
    ],
    dont: [
      'Move focus into the list; people are in the middle of typing.',
      'Use it for commands; use SlashCommandMenu.',
    ],
  },
  related: ['prompt-composer', 'slash-command-menu', 'context-chips', 'combobox'],
};

const people: MentionItem[] = [
  { id: 'priya', label: 'Priya Nair', description: 'Legal counsel' },
  { id: 'tomas', label: 'Tomas Berg', description: 'Finance lead' },
  { id: 'aiko', label: 'Aiko Tanaka', description: 'Account manager' },
];

const references: MentionItem[] = [
  {
    id: 'msa',
    label: 'Master services agreement',
    description: 'contracts/msa.pdf',
    group: 'Files',
    icon: <Icon name="file-text" />,
  },
  {
    id: 'pricing',
    label: 'Pricing 2026',
    description: 'finance/pricing.xlsx',
    group: 'Files',
    icon: <Icon name="file" />,
  },
  {
    id: 'priya',
    label: 'Priya Nair',
    description: 'Legal counsel',
    group: 'People',
    icon: <Icon name="user" />,
  },
  { id: 'search', label: 'Web search', group: 'Tools', icon: <Icon name="globe" /> },
];

function mentionQuery(draft: string) {
  const match = /(?:^|\s)@([^\s@]*)$/.exec(draft);
  return match ? (match[1] ?? '') : null;
}

export function InComposer() {
  const anchor = React.useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = React.useState('Ask @');
  const [dismissed, setDismissed] = React.useState(false);
  const [active, setActive] = React.useState<string | undefined>(undefined);
  const query = mentionQuery(draft);
  const open = query !== null && !dismissed;
  return (
    <div style={{ width: '100%', maxWidth: 520, alignSelf: 'end' }}>
      <PromptComposer
        value={draft}
        onValueChange={(next) => {
          setDraft(next);
          setDismissed(false);
        }}
        placeholder="Type @ to mention someone"
        textareaRef={anchor}
        textareaProps={{
          'aria-haspopup': 'listbox',
          'aria-controls': open ? 'mention-list' : undefined,
          'aria-activedescendant': active,
        }}
      />
      <MentionPicker
        id="mention-list"
        open={open}
        query={query ?? ''}
        items={people}
        anchor={anchor}
        onActiveDescendantChange={setActive}
        onOpenChange={(next) => setDismissed(!next)}
        onSelect={(item) => setDraft(draft.replace(/@([^\s@]*)$/, `@${item.label} `))}
      />
    </div>
  );
}

export function Grouped() {
  const anchor = React.useRef<HTMLTextAreaElement>(null);
  const [picked, setPicked] = React.useState('Nothing chosen yet.');
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 520, alignSelf: 'end' }}>
      <span>{picked}</span>
      <textarea
        ref={anchor}
        aria-label="Message"
        aria-haspopup="listbox"
        rows={2}
        defaultValue="Compare @"
        onFocus={() => setOpen(true)}
        style={{ width: '100%', font: 'inherit', padding: 8 }}
      />
      <MentionPicker
        open={open}
        items={references}
        anchor={anchor}
        onOpenChange={setOpen}
        onSelect={(item) => {
          setPicked(`Chose ${item.label}.`);
          setOpen(false);
        }}
      />
    </div>
  );
}

export function LoadingAndEmpty() {
  const anchor = React.useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 520, alignSelf: 'end' }}>
      <button
        type="button"
        onClick={() => setLoading((value) => !value)}
        style={{ justifySelf: 'start' }}
      >
        {loading ? 'Show no matches' : 'Show loading'}
      </button>
      <textarea
        ref={anchor}
        aria-label="Message"
        rows={2}
        defaultValue="@quarterly"
        style={{ width: '100%', font: 'inherit', padding: 8 }}
      />
      <MentionPicker
        open
        filter={false}
        items={[]}
        anchor={anchor}
        loading={loading}
        loadingLabel="Searching files"
        emptyLabel="No files match “quarterly”"
      />
    </div>
  );
}
