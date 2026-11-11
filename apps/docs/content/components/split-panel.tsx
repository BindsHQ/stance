import * as React from 'react';
import { ResizablePanel, ResizeHandle, SplitPanel } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'split-panel',
  name: 'SplitPanel',
  category: 'advanced',
  summary: 'A group of resizable panels separated by draggable, keyboard-accessible handles.',
  description:
    'Use SplitPanel for workspaces where people balance two or three views, such as a template list beside a live signature preview. Panels are sized in percent with minimum and maximum limits; sizes can persist between visits. It is a primitive for content areas and does not impose an application layout.',
  imports: ['SplitPanel', 'ResizablePanel', 'ResizeHandle'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Two panels', layout: 'fill', minHeight: 280 },
    { name: 'Vertical', title: 'Vertical', layout: 'fill', minHeight: 320 },
    {
      name: 'ThreePanes',
      title: 'Three panels with collapse and persistence',
      description:
        'Press Enter on a handle to collapse the panel before it. Sizes persist with autoSaveId.',
      layout: 'fill',
      minHeight: 280,
    },
  ],
  props: [
    {
      component: 'SplitPanel',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Horizontal places panels side by side.',
    },
    {
      component: 'SplitPanel',
      name: 'onLayout',
      type: '(sizes: number[]) => void',
      description: 'Called with panel sizes in percent after user resizing.',
    },
    {
      component: 'SplitPanel',
      name: 'autoSaveId',
      type: 'string',
      description: 'Persist sizes in localStorage under this id.',
    },
    {
      component: 'ResizablePanel',
      name: 'defaultSize',
      type: 'number',
      description: 'Initial size in percent. Panels without one share the remainder.',
    },
    {
      component: 'ResizablePanel',
      name: 'minSize',
      type: 'number',
      default: '10',
      description: 'Minimum size in percent.',
    },
    {
      component: 'ResizablePanel',
      name: 'maxSize',
      type: 'number',
      default: '100',
      description: 'Maximum size in percent.',
    },
    {
      component: 'ResizablePanel',
      name: 'collapsible',
      type: 'boolean',
      default: 'false',
      description: 'Allow collapsing with Enter on the following handle.',
    },
    {
      component: 'ResizablePanel',
      name: 'collapsedSize',
      type: 'number',
      default: '0',
      description: 'Size in percent when collapsed.',
    },
    {
      component: 'ResizablePanel',
      name: 'id',
      type: 'string',
      description: 'Id referenced by the handle’s aria-controls.',
    },
    {
      component: 'ResizeHandle',
      name: 'aria-label',
      type: 'string',
      default: "'Resize panels'",
      description: 'Name the handle after the panel it resizes.',
    },
    {
      component: 'ResizeHandle',
      name: 'keyboardStep',
      type: 'number',
      default: '5',
      description: 'Percent per arrow key press (Shift doubles it).',
    },
    {
      component: 'ResizeHandle',
      name: 'withGrip',
      type: 'boolean',
      default: 'true',
      description: 'Show the grip affordance.',
    },
    {
      component: 'ResizeHandle',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Lock the boundary.',
    },
  ],
  accessibility: [
    'Handles are focusable role="separator" elements with aria-valuenow, aria-valuemin and aria-valuemax for the panel before them, and aria-controls pointing to it (window splitter pattern).',
    'Arrow keys resize, Home and End jump to the limits, and Enter collapses and restores collapsible panels.',
    'The pointer hit area is larger than the visible line, meeting the 24px target size.',
    'Dragging always has a keyboard alternative (WCAG 2.5.7).',
  ],
  keyboard: [
    {
      keys: ['←', '→'],
      description: 'Horizontal groups: shrink or grow the panel before the handle.',
    },
    {
      keys: ['↑', '↓'],
      description: 'Vertical groups: shrink or grow the panel above the handle.',
    },
    { keys: ['Shift'], description: 'With an arrow key: move twice as far.' },
    { keys: ['Home', 'End'], description: 'Minimum or maximum size.' },
    { keys: ['Enter'], description: 'Collapse or restore a collapsible panel.' },
  ],
  guidelines: {
    do: [
      'Set sensible minimum sizes so content never becomes unusable.',
      'Label each handle after the panel it controls.',
    ],
    dont: [
      'Use SplitPanel for the overall application shell.',
      'Use it on phones; stack the views instead.',
    ],
  },
  related: ['resizable-panel', 'scroll-area'],
};

const pane: React.CSSProperties = { padding: 16, height: '100%', boxSizing: 'border-box' };

export function Basic() {
  return (
    <div
      style={{
        height: 260,
        border: '1px solid var(--st-color-border-default)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <SplitPanel>
        <ResizablePanel id="sp-templates" defaultSize={35} minSize={20} maxSize={60}>
          <div style={pane}>
            <strong>Templates</strong>
            <p>Standard · Sales team · Legal · Recruiting</p>
          </div>
        </ResizablePanel>
        <ResizeHandle aria-label="Resize templates panel" />
        <ResizablePanel id="sp-preview" minSize={30}>
          <div style={{ ...pane, background: 'var(--st-color-bg-subtle)' }}>
            <strong>Preview</strong>
            <p>Priya Nair · Account Executive · Binds</p>
          </div>
        </ResizablePanel>
      </SplitPanel>
    </div>
  );
}

export function Vertical() {
  return (
    <div
      style={{
        height: 300,
        border: '1px solid var(--st-color-border-default)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <SplitPanel orientation="vertical">
        <ResizablePanel id="sp-html" defaultSize={60} minSize={25}>
          <div style={pane}>
            <strong>Signature HTML</strong>
          </div>
        </ResizablePanel>
        <ResizeHandle aria-label="Resize editor" />
        <ResizablePanel id="sp-console" minSize={15}>
          <div style={{ ...pane, background: 'var(--st-color-bg-subtle)' }}>
            <strong>Validation</strong>
            <p>No issues found.</p>
          </div>
        </ResizablePanel>
      </SplitPanel>
    </div>
  );
}

export function ThreePanes() {
  const [sizes, setSizes] = React.useState<number[]>([]);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div
        style={{
          height: 240,
          border: '1px solid var(--st-color-border-default)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <SplitPanel autoSaveId="docs-split-three" onLayout={setSizes}>
          <ResizablePanel id="sp-nav" defaultSize={22} minSize={15} collapsible collapsedSize={0}>
            <div style={pane}>Folders</div>
          </ResizablePanel>
          <ResizeHandle aria-label="Resize folders" />
          <ResizablePanel id="sp-list" defaultSize={38} minSize={20}>
            <div style={pane}>Templates</div>
          </ResizablePanel>
          <ResizeHandle aria-label="Resize templates" />
          <ResizablePanel id="sp-detail" minSize={25}>
            <div style={{ ...pane, background: 'var(--st-color-bg-subtle)' }}>Details</div>
          </ResizablePanel>
        </SplitPanel>
      </div>
      <p style={{ margin: 0 }}>
        Layout:{' '}
        {sizes.length
          ? sizes.map((s) => `${Math.round(s)}%`).join(' · ')
          : 'drag or focus a handle'}
      </p>
    </div>
  );
}
