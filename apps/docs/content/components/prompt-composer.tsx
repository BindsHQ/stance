import * as React from 'react';
import {
  AttachmentTray,
  Icon,
  IconButton,
  ModelPicker,
  PromptComposer,
  TokenBudgetMeter,
  VoiceInputButton,
} from '@bindshq/stance-react';
import type { AttachmentItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'prompt-composer',
  name: 'PromptComposer',
  category: 'ai',
  summary:
    'The message input for a conversation: a text area that grows as people type, with slots for attachments and tools, and a send button that becomes stop.',
  description:
    'PromptComposer is where people write to an assistant. It holds the draft, sends it with Enter or the send button, and shows a stop button while a response is in progress. It does no networking: pass the status in and handle onSubmit and onStop. Use the slots for attachments, a model picker, voice input and a short note under the box.',
  imports: ['PromptComposer'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Send and stop',
      description:
        'Send a message to see the button turn into Stop while the reply is in progress.',
      layout: 'fill',
    },
    {
      name: 'WithSlots',
      title: 'Attachments, tools and a meter',
      description: 'header holds attachments, leading and trailing hold tools, footer holds hints.',
      layout: 'fill',
    },
    {
      name: 'ModifierToSend',
      title: 'Enter adds a line',
      description:
        'With submitOnEnter off, Enter adds a line and Ctrl or Cmd with Enter sends. This suits long, careful prompts.',
      layout: 'fill',
    },
    {
      name: 'Disabled',
      title: 'Disabled',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'PromptComposer',
      name: 'value',
      type: 'string',
      description: 'The draft, when controlled.',
    },
    {
      component: 'PromptComposer',
      name: 'defaultValue',
      type: 'string',
      default: "''",
      description: 'The initial draft when uncontrolled.',
    },
    {
      component: 'PromptComposer',
      name: 'onValueChange',
      type: '(value: string) => void',
      description: 'Called on every change to the draft, and with an empty string after a submit.',
    },
    {
      component: 'PromptComposer',
      name: 'onSubmit',
      type: '(value: string) => void',
      description:
        'Called with the draft when it is sent. Never called while the draft is empty or a response is in progress.',
    },
    {
      component: 'PromptComposer',
      name: 'onStop',
      type: '() => void',
      description: 'Called when Stop is pressed while a response is in progress.',
    },
    {
      component: 'PromptComposer',
      name: 'status',
      type: "'idle' | 'submitted' | 'streaming' | 'complete' | 'stopped' | 'error'",
      default: "'idle'",
      description: 'Generation status. submitted and streaming turn Send into Stop.',
    },
    {
      component: 'PromptComposer',
      name: 'placeholder',
      type: 'string',
      description: 'Hint shown while the draft is empty.',
    },
    {
      component: 'PromptComposer',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Turns off typing and sending.',
    },
    {
      component: 'PromptComposer',
      name: 'maxRows',
      type: 'number',
      default: '8',
      description: 'The text area grows up to this many lines, then scrolls.',
    },
    {
      component: 'PromptComposer',
      name: 'submitOnEnter',
      type: 'boolean',
      default: 'true',
      description:
        'Enter sends and Shift with Enter adds a line. When false, Ctrl or Cmd with Enter sends.',
    },
    {
      component: 'PromptComposer',
      name: 'header',
      type: 'ReactNode',
      description: 'Slot above the text area, for attachments and context.',
    },
    {
      component: 'PromptComposer',
      name: 'leading',
      type: 'ReactNode',
      description: 'Slot at the start of the toolbar, for attach, mention or model controls.',
    },
    {
      component: 'PromptComposer',
      name: 'trailing',
      type: 'ReactNode',
      description: 'Slot at the end of the toolbar, before the send button.',
    },
    {
      component: 'PromptComposer',
      name: 'footer',
      type: 'ReactNode',
      description: 'Slot under the box, for hints and meters.',
    },
    {
      component: 'PromptComposer',
      name: 'labels',
      type: 'Partial<PromptComposerLabels>',
      description: 'Translations: form, input, send and stop.',
    },
    {
      component: 'PromptComposer',
      name: 'textareaRef',
      type: 'Ref<HTMLTextAreaElement>',
      description:
        'Ref to the text area, for focus and as the anchor of MentionPicker or SlashCommandMenu.',
    },
    {
      component: 'PromptComposer',
      name: 'textareaProps',
      type: 'TextareaHTMLAttributes',
      description:
        'Extra props for the text area, such as aria-controls, aria-activedescendant or name.',
    },
  ],
  accessibility: [
    'A form with an accessible name, containing a labelled text area. Both names come from labels, so they can be translated.',
    'Send is disabled while the draft is empty. While a response is in progress the same button is named Stop, and keyboard focus stays on it through the change.',
    'Enter is ignored while an input method is composing, so people writing Japanese, Chinese or Korean do not send by accident.',
    'The text area grows without moving focus and scrolls inside itself after maxRows, so the page does not jump.',
    'Clicking the empty part of the box places the caret in the text area. Slots keep their own focus order: header, text area, leading, trailing, send.',
    'In forced colours the box and its focus state use system colours.',
  ],
  keyboard: [
    {
      keys: ['Enter'],
      description: 'Sends the draft. With submitOnEnter off it adds a line.',
    },
    {
      keys: ['Shift', 'Enter'],
      description: 'Adds a line.',
    },
    {
      keys: ['Ctrl/⌘', 'Enter'],
      description: 'Sends the draft when submitOnEnter is off.',
    },
    {
      keys: ['Tab'],
      description: 'Moves through the tools to the send or stop button.',
    },
  ],
  guidelines: {
    do: [
      'Keep the draft editable while a response streams, so people can write their next message.',
      'Use the footer for one short, quiet note, such as a reminder to check important facts.',
      'Say what the assistant can help with in the placeholder.',
    ],
    dont: [
      'Disable the whole composer during a response; show Stop instead.',
      'Fill the toolbar with more than a few tools; move the rest into a menu.',
    ],
  },
  related: [
    'stop-button',
    'attachment-tray',
    'mention-picker',
    'slash-command-menu',
    'model-picker',
    'voice-input-button',
    'token-budget-meter',
    'textarea',
  ],
};

const models = [
  { id: 'swift', name: 'Swift', description: 'Quick answers for everyday work', badges: ['Fast'] },
  { id: 'depth', name: 'Depth', description: 'Careful reasoning for long documents' },
];

const draftAttachments: AttachmentItem[] = [
  { id: 'msa', name: 'master-services-agreement.pdf', kind: 'file', size: 482000 },
  { id: 'notes', name: 'call-notes.txt', kind: 'file', size: 2100 },
];

export function Basic() {
  const [status, setStatus] = React.useState<'idle' | 'streaming' | 'complete' | 'stopped'>('idle');
  const [sent, setSent] = React.useState('');
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 560 }}>
      <p style={{ margin: 0, minHeight: 24 }}>
        {status === 'streaming'
          ? `Answering “${sent}”`
          : sent
            ? `Sent “${sent}”`
            : 'No message yet.'}
      </p>
      <PromptComposer
        placeholder="Ask about this contract"
        status={status}
        onSubmit={(value) => {
          setSent(value);
          setStatus('streaming');
          timer.current = window.setTimeout(() => setStatus('complete'), 4000);
        }}
        onStop={() => {
          window.clearTimeout(timer.current);
          setStatus('stopped');
        }}
      />
    </div>
  );
}

export function WithSlots() {
  const [value, setValue] = React.useState('Summarise the termination terms.');
  const [files, setFiles] = React.useState(draftAttachments);
  const [model, setModel] = React.useState('swift');
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <PromptComposer
        value={value}
        onValueChange={setValue}
        placeholder="Ask about these files"
        header={
          <AttachmentTray
            items={files}
            onRemove={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
          />
        }
        leading={
          <>
            <IconButton label="Attach a file" icon={<Icon name="paperclip" />} size="sm" />
            <ModelPicker models={models} value={model} onValueChange={setModel} />
          </>
        }
        trailing={<VoiceInputButton />}
        footer={
          <>
            <span>Check important facts before you rely on them.</span>
            <TokenBudgetMeter used={2400 + value.length * 4} limit={8000} showValue />
          </>
        }
      />
    </div>
  );
}

export function ModifierToSend() {
  const [sent, setSent] = React.useState(0);
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <PromptComposer
        submitOnEnter={false}
        maxRows={12}
        placeholder="Describe the document you need"
        onSubmit={() => setSent((count) => count + 1)}
        footer={<span>{sent === 0 ? 'Ctrl or ⌘ with Enter sends.' : `Sent ${sent} times.`}</span>}
      />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <PromptComposer
        disabled
        placeholder="This conversation is read only"
        footer={<span>Start a new conversation to keep going.</span>}
      />
    </div>
  );
}
