import * as React from 'react';
import {
  ArtifactPanel,
  Button,
  CanvasSplitView,
  Message,
  PromptComposer,
  useCanvasSplitView,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'canvas-split-view',
  name: 'CanvasSplitView',
  category: 'ai',
  summary:
    'A two pane layout with the conversation beside the working document: resizable when wide, tabbed when narrow.',
  description:
    'Use CanvasSplitView when people talk to the assistant about something they can see: a document, a page, a piece of code. On a wide view both sides show with a divider to resize them. On a narrow view a tab switch shows one side at a time, and both stay mounted so a draft is never lost.',
  imports: ['CanvasSplitView', 'useCanvasSplitView'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Conversation and canvas',
      description: 'Drag the divider, or focus it and use the arrow keys.',
      layout: 'fill',
    },
    {
      name: 'OpenCanvas',
      title: 'Open and close the canvas',
      description:
        'The canvas closes from inside through useCanvasSplitView. The draft in the composer stays.',
      layout: 'fill',
    },
    {
      name: 'Narrow',
      title: 'Narrow view',
      description: 'Below the breakpoint a tab switch replaces the divider.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'CanvasSplitView',
      name: 'conversation',
      type: 'React.ReactNode',
      required: true,
      description: 'The conversation side: usually a Thread with a PromptComposer.',
    },
    {
      component: 'CanvasSplitView',
      name: 'canvas',
      type: 'React.ReactNode',
      description: 'The working document side: usually an ArtifactPanel.',
    },
    {
      component: 'CanvasSplitView',
      name: 'canvasOpen',
      type: 'boolean',
      description: 'Controlled open state of the canvas.',
    },
    {
      component: 'CanvasSplitView',
      name: 'defaultCanvasOpen',
      type: 'boolean',
      default: 'true',
      description: 'Whether the canvas is open on first render when uncontrolled.',
    },
    {
      component: 'CanvasSplitView',
      name: 'onCanvasOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the canvas opens or closes through useCanvasSplitView.',
    },
    {
      component: 'CanvasSplitView',
      name: 'defaultRatio',
      type: 'number',
      default: '0.4',
      description: 'The share of the width the conversation takes at first, from 0 to 1.',
    },
    {
      component: 'CanvasSplitView',
      name: 'minConversation',
      type: 'number',
      default: '25',
      description: 'Smallest conversation width, in percent of the view.',
    },
    {
      component: 'CanvasSplitView',
      name: 'minCanvas',
      type: 'number',
      default: '30',
      description: 'Smallest canvas width, in percent of the view.',
    },
    {
      component: 'CanvasSplitView',
      name: 'narrowView',
      type: "'conversation' | 'canvas'",
      description: 'Controlled side shown on a narrow view.',
    },
    {
      component: 'CanvasSplitView',
      name: 'defaultNarrowView',
      type: "'conversation' | 'canvas'",
      default: "'conversation'",
      description: 'Side shown first on a narrow view when uncontrolled.',
    },
    {
      component: 'CanvasSplitView',
      name: 'onNarrowViewChange',
      type: "(view: 'conversation' | 'canvas') => void",
      description: 'Called when the reader switches side on a narrow view.',
    },
    {
      component: 'CanvasSplitView',
      name: 'breakpoint',
      type: 'number',
      default: '640',
      description: 'Width of the view, in px, below which the tab switch replaces the divider.',
    },
    {
      component: 'CanvasSplitView',
      name: 'narrow',
      type: 'boolean',
      description: 'Forces the narrow or the wide layout instead of measuring the view.',
    },
    {
      component: 'CanvasSplitView',
      name: 'labels',
      type: 'Partial<CanvasSplitViewLabels>',
      description: 'Translations: conversation, canvas, resize and views.',
    },
    {
      component: 'useCanvasSplitView',
      name: 'returns',
      type: '{ canvasOpen, setCanvasOpen, narrow, narrowView, setNarrowView }',
      description:
        'Reads the nearest CanvasSplitView from inside either side, for example to close the canvas.',
    },
  ],
  accessibility: [
    'On a wide view the two sides are regions named Conversation and Canvas.',
    'The divider is a separator with a name, a value and arrow key resizing.',
    'On a narrow view a labelled tab list replaces the divider, and each side is a tab panel.',
    'The layout follows the width of the view itself, so it also adapts inside a narrow container.',
    'Opening or closing the canvas keeps the conversation mounted, so focus and drafts stay.',
    'In right to left the sides and the arrow keys are mirrored.',
  ],
  keyboard: [
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description: 'On the divider, resizes the two sides. On the tab switch, changes side.',
    },
    { keys: ['Shift', 'Arrow'], description: 'On the divider, resizes in larger steps.' },
    {
      keys: ['Home', 'End'],
      description: 'On the divider, jumps to the smallest or largest size.',
    },
    { keys: ['Tab'], description: 'Moves between the conversation, the divider and the canvas.' },
  ],
  guidelines: {
    do: [
      'Open the canvas when the assistant makes something worth keeping in view.',
      'Give the view a fixed height, such as the height of the window below your header.',
    ],
    dont: [
      'Open the canvas for short answers that fit in a message.',
      'Move focus into the canvas when it opens. Let people finish reading.',
    ],
  },
  related: ['artifact-panel', 'thread', 'prompt-composer', 'copilot-panel', 'split-panel'],
};

const conversation = (
  <div style={{ display: 'grid', gap: 12, padding: 12, alignContent: 'start' }}>
    <Message role="user">Draft a launch plan for the new pricing.</Message>
    <Message role="assistant" author="Assistant">
      Here is a first draft. It is open beside this conversation.
    </Message>
    <PromptComposer placeholder="Ask for a change" />
  </div>
);

const plan = (
  <ol style={{ margin: 0 }}>
    <li>Confirm pricing with finance.</li>
    <li>Brief the support team.</li>
    <li>Publish on Tuesday.</li>
  </ol>
);

export function Basic() {
  return (
    <div style={{ width: '100%', height: 360 }}>
      <CanvasSplitView
        conversation={conversation}
        canvas={
          <ArtifactPanel title="Launch plan" kind="Document">
            {plan}
          </ArtifactPanel>
        }
      />
    </div>
  );
}

function PlanCanvas() {
  const { setCanvasOpen } = useCanvasSplitView();
  return (
    <ArtifactPanel title="Launch plan" kind="Document" onClose={() => setCanvasOpen(false)}>
      {plan}
    </ArtifactPanel>
  );
}

export function OpenCanvas() {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%' }}>
      <div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={open}>
          Open the launch plan
        </Button>
      </div>
      <div style={{ height: 320 }}>
        <CanvasSplitView
          conversation={conversation}
          canvas={<PlanCanvas />}
          canvasOpen={open}
          onCanvasOpenChange={setOpen}
        />
      </div>
    </div>
  );
}

export function Narrow() {
  return (
    <div style={{ width: '100%', maxWidth: 360, height: 400 }}>
      <CanvasSplitView
        narrow
        conversation={conversation}
        canvas={
          <ArtifactPanel title="Launch plan" kind="Document">
            {plan}
          </ArtifactPanel>
        }
      />
    </div>
  );
}
