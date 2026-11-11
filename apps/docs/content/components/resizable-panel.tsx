import { ResizablePanel, ResizeHandle, SplitPanel } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'resizable-panel',
  name: 'ResizablePanel',
  category: 'advanced',
  summary: 'One resizable region inside a SplitPanel, with size limits and optional collapse.',
  description:
    'ResizablePanel is the building block of SplitPanel. Each panel declares its default, minimum and maximum size in percent and whether it can collapse. Place panels as direct children of SplitPanel, separated by ResizeHandle.',
  imports: ['ResizablePanel', 'SplitPanel', 'ResizeHandle'],
  status: 'stable',
  examples: [
    {
      name: 'Basic',
      title: 'Limits',
      description: 'The navigation panel is limited to 15 to 40% and can collapse.',
      layout: 'fill',
      minHeight: 240,
    },
    {
      name: 'Collapsed',
      title: 'Collapsed to a rail',
      description: 'A collapsedSize above zero leaves a narrow rail visible.',
      layout: 'fill',
      minHeight: 240,
    },
    {
      name: 'Equal',
      title: 'Shared space',
      description: 'Panels without defaultSize share the remaining space equally.',
      layout: 'fill',
      minHeight: 200,
    },
  ],
  props: [
    {
      component: 'ResizablePanel',
      name: 'defaultSize',
      type: 'number',
      description: 'Initial size in percent.',
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
      description: 'Allow collapsing to collapsedSize.',
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
      description: 'Referenced by the following handle’s aria-controls.',
    },
    {
      component: 'ResizablePanel',
      name: '...props',
      type: 'HTMLAttributes<HTMLDivElement>',
      description: 'Passed to the panel element. data-size and data-collapsed reflect state.',
    },
  ],
  accessibility: [
    'Panels are plain containers; the adjacent ResizeHandle carries the separator semantics and keyboard support.',
    'A panel collapsed to 0% is hidden, so its content leaves the tab order and the accessibility tree.',
    'Panels scroll independently when their content overflows.',
  ],
  keyboard: [
    {
      keys: ['Enter'],
      description: 'On the following handle: collapse or restore a collapsible panel.',
    },
  ],
  guidelines: {
    do: ['Give collapsible panels a visible way back, such as a rail or a toggle button.'],
    dont: ['Allow panels to shrink below a usable width for their content.'],
  },
  related: ['split-panel'],
};

const pane = { padding: 16, height: '100%', boxSizing: 'border-box' as const };

export function Basic() {
  return (
    <div
      style={{
        height: 220,
        border: '1px solid var(--st-color-border-default)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <SplitPanel>
        <ResizablePanel id="rp-nav" defaultSize={25} minSize={15} maxSize={40} collapsible>
          <div style={pane}>Organisation settings</div>
        </ResizablePanel>
        <ResizeHandle aria-label="Resize settings navigation" />
        <ResizablePanel id="rp-main">
          <div style={{ ...pane, background: 'var(--st-color-bg-subtle)' }}>Email integrations</div>
        </ResizablePanel>
      </SplitPanel>
    </div>
  );
}

export function Collapsed() {
  return (
    <div
      style={{
        height: 220,
        border: '1px solid var(--st-color-border-default)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <SplitPanel>
        <ResizablePanel id="rp-rail" defaultSize={6} minSize={20} collapsible collapsedSize={6}>
          <div style={pane}>
            <span aria-hidden="true">☰</span>
            <span className="st-sr-only">Navigation (collapsed)</span>
          </div>
        </ResizablePanel>
        <ResizeHandle aria-label="Resize navigation" />
        <ResizablePanel id="rp-content">
          <div style={pane}>Signature templates</div>
        </ResizablePanel>
      </SplitPanel>
    </div>
  );
}

export function Equal() {
  return (
    <div
      style={{
        height: 180,
        border: '1px solid var(--st-color-border-default)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <SplitPanel>
        <ResizablePanel id="rp-a">
          <div style={pane}>Draft</div>
        </ResizablePanel>
        <ResizeHandle aria-label="Resize draft" />
        <ResizablePanel id="rp-b">
          <div style={pane}>Approved</div>
        </ResizablePanel>
        <ResizeHandle aria-label="Resize approved" />
        <ResizablePanel id="rp-c">
          <div style={pane}>Deployed</div>
        </ResizablePanel>
      </SplitPanel>
    </div>
  );
}
