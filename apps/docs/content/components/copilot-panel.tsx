import * as React from 'react';
import {
  Button,
  ContextChips,
  CopilotPanel,
  Icon,
  IconButton,
  Message,
  PromptComposer,
  Thread,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'copilot-panel',
  name: 'CopilotPanel',
  category: 'ai',
  summary:
    'An assistant panel that docks beside the page with a header, context, a thread and a composer, and becomes a sheet on small screens.',
  description:
    'Use CopilotPanel to put an assistant next to the work, not in place of it. It shows what the assistant can see, holds the conversation and keeps the composer at the bottom. On wide screens it sits beside the page so both stay usable. On small screens it opens over the page as a sheet.',
  imports: ['CopilotPanel'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Docked beside a page',
      layout: 'fill',
    },
    {
      name: 'Responsive',
      title: 'Open and close',
      description:
        'Opening moves focus to the composer and closing gives it back. On a small screen the panel opens as a sheet.',
      layout: 'fill',
    },
    {
      name: 'Shortcut',
      title: 'With a shortcut',
      description: 'The shortcut opens the panel from anywhere and closes it from inside.',
      layout: 'fill',
    },
    {
      name: 'StartSide',
      title: 'On the start side',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'CopilotPanel',
      name: 'open',
      type: 'boolean',
      description: 'Controlled open state.',
    },
    {
      component: 'CopilotPanel',
      name: 'defaultOpen',
      type: 'boolean',
      default: 'false',
      description: 'Open on first render when uncontrolled.',
    },
    {
      component: 'CopilotPanel',
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the panel opens or closes.',
    },
    {
      component: 'CopilotPanel',
      name: 'title',
      type: 'React.ReactNode',
      default: "'Assistant'",
      description: 'The title in the header.',
    },
    {
      component: 'CopilotPanel',
      name: 'context',
      type: 'React.ReactNode',
      description:
        'What the assistant is looking at, for example ContextChips for the current page.',
    },
    {
      component: 'CopilotPanel',
      name: 'children',
      type: 'React.ReactNode',
      description: 'The conversation, usually a Thread.',
    },
    {
      component: 'CopilotPanel',
      name: 'composer',
      type: 'React.ReactNode',
      description: 'The input, usually a PromptComposer. It takes focus when the panel opens.',
    },
    {
      component: 'CopilotPanel',
      name: 'side',
      type: "'start' | 'end'",
      default: "'end'",
      description: 'Which edge of the page the panel docks to. It follows the text direction.',
    },
    {
      component: 'CopilotPanel',
      name: 'width',
      type: 'number | string',
      default: '380',
      description: 'Width when docked. A number is pixels.',
    },
    {
      component: 'CopilotPanel',
      name: 'modal',
      type: "'narrow' | 'always' | 'never'",
      default: "'narrow'",
      description: 'When the panel is a dialog over the page. narrow follows the viewport width.',
    },
    {
      component: 'CopilotPanel',
      name: 'narrowBreakpoint',
      type: 'number',
      default: '768',
      description: 'Viewport width in px under which narrow becomes a dialog.',
    },
    {
      component: 'CopilotPanel',
      name: 'headerActions',
      type: 'React.ReactNode',
      description: 'Extra controls in the header, before the close button.',
    },
    {
      component: 'CopilotPanel',
      name: 'shortcut',
      type: 'string',
      description:
        'A hotkey that opens the panel and moves focus to the composer, for example mod+.',
    },
    {
      component: 'CopilotPanel',
      name: 'showClose',
      type: 'boolean',
      default: 'true',
      description: 'Show the close button.',
    },
    {
      component: 'CopilotPanel',
      name: 'headingLevel',
      type: '2 | 3 | 4',
      default: '2',
      description: 'Heading level of the title.',
    },
    {
      component: 'CopilotPanel',
      name: 'labels',
      type: 'Partial<CopilotPanelLabels>',
      description: 'Translations: title, close and context.',
    },
  ],
  accessibility: [
    'On wide screens the panel is a complementary region named by its title, and the page stays usable.',
    'On small screens it is a modal dialog that keeps focus inside and closes with Escape.',
    'Opening moves focus to the composer. Closing returns focus to where it was.',
    'A panel that is open on first render does not take focus.',
    'The context area is a named group, so people know what the assistant can see.',
  ],
  keyboard: [
    {
      keys: ['Shortcut'],
      description: 'Opens the panel and focuses the composer. Pressed inside, it closes the panel.',
    },
    { keys: ['Escape'], description: 'Closes the panel when it is a dialog.' },
    { keys: ['Tab'], description: 'Moves through the header, the thread and the composer.' },
  ],
  guidelines: {
    do: [
      'Place the panel in a row with the page so the page reflows beside it.',
      'Show what the assistant can see in the context slot.',
    ],
    dont: [
      'Cover the work on wide screens; dock the panel instead.',
      'Open the panel on its own without the person asking.',
    ],
  },
  related: ['thread', 'prompt-composer', 'context-chips', 'sheet'],
};

const frame: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  height: 420,
  border: '1px solid var(--st-color-border-default)',
  borderRadius: 12,
  overflow: 'hidden',
};

const page: React.CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  padding: 16,
  display: 'grid',
  gap: 12,
  alignContent: 'start',
};

const conversation = (
  <Thread label="Invoice questions">
    <Message role="user" author="Priya">
      Is this invoice overdue?
    </Message>
    <Message author="Assistant">
      Yes. It was due on 3 March, so it is 12 days late. The amount is 4,200 kronor.
    </Message>
  </Thread>
);

export function Basic() {
  return (
    <div style={frame}>
      <div style={page}>
        <strong>Invoice 204</strong>
        <span>Northwind Trading Ltd</span>
      </div>
      <CopilotPanel
        defaultOpen
        modal="never"
        width={320}
        context={<ContextChips items={[{ id: 'invoice', label: 'Invoice 204' }]} />}
        composer={<PromptComposer placeholder="Ask about this invoice" />}
      >
        {conversation}
      </CopilotPanel>
    </div>
  );
}

export function Responsive() {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={frame}>
      <div style={page}>
        <strong>Invoice 204</strong>
        <div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Ask the assistant
          </Button>
        </div>
      </div>
      <CopilotPanel
        open={open}
        onOpenChange={setOpen}
        width={320}
        composer={<PromptComposer placeholder="Ask about this invoice" />}
      >
        {conversation}
      </CopilotPanel>
    </div>
  );
}

export function Shortcut() {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={frame}>
      <div style={page}>
        <strong>Invoice 204</strong>
        <span>Press Ctrl or Cmd and the full stop key to open the assistant.</span>
      </div>
      <CopilotPanel
        open={open}
        onOpenChange={setOpen}
        shortcut="mod+."
        width={320}
        title="Invoice assistant"
        headerActions={
          <IconButton size="sm" label="New conversation" icon={<Icon name="plus" />} />
        }
        composer={<PromptComposer placeholder="Ask about this invoice" />}
      >
        {conversation}
      </CopilotPanel>
    </div>
  );
}

export function StartSide() {
  return (
    <div style={frame}>
      <div style={page}>
        <strong>Invoice 204</strong>
        <span>The panel sits on the start side and follows the text direction.</span>
      </div>
      <CopilotPanel
        defaultOpen
        modal="never"
        side="start"
        width={300}
        showClose={false}
        composer={<PromptComposer placeholder="Ask about this invoice" />}
      >
        {conversation}
      </CopilotPanel>
    </div>
  );
}
