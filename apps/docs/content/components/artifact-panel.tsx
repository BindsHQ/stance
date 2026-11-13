import * as React from 'react';
import { ArtifactPanel, Button, CodeBlock, Icon, IconButton } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'artifact-panel',
  name: 'ArtifactPanel',
  category: 'ai',
  summary:
    'A side panel that holds a generated document, page or app, with versions, preview and code tabs, and actions.',
  description:
    'Use ArtifactPanel when the assistant makes something larger than a message: a document, a page, a small app. It keeps the work beside the conversation, lets people step through versions and look at the source, and gives focus back to where they were when they close it. Place it in the canvas side of CanvasSplitView.',
  imports: ['ArtifactPanel'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Preview, code and versions',
      layout: 'fill',
    },
    {
      name: 'OpenAndClose',
      title: 'Open from a message',
      description: 'Closing the panel returns focus to the button that opened it.',
      layout: 'fill',
    },
    {
      name: 'Generating',
      title: 'While it is generated',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'ArtifactPanel',
      name: 'title',
      type: 'React.ReactNode',
      required: true,
      description: 'The name of the artifact. It names the region.',
    },
    {
      component: 'ArtifactPanel',
      name: 'kind',
      type: 'React.ReactNode',
      description: 'The type of artifact in words, for example Document or Web page.',
    },
    {
      component: 'ArtifactPanel',
      name: 'versions',
      type: '{ id: string; label: string }[]',
      description: 'The saved versions, oldest first. The switcher shows for two or more.',
    },
    {
      component: 'ArtifactPanel',
      name: 'versionId',
      type: 'string',
      description: 'Controlled id of the shown version.',
    },
    {
      component: 'ArtifactPanel',
      name: 'defaultVersionId',
      type: 'string',
      default: 'the last version',
      description: 'Version on first render when uncontrolled.',
    },
    {
      component: 'ArtifactPanel',
      name: 'onVersionChange',
      type: '(id: string) => void',
      description: 'Called when the reader picks another version.',
    },
    {
      component: 'ArtifactPanel',
      name: 'view',
      type: "'preview' | 'code'",
      description: 'Controlled view.',
    },
    {
      component: 'ArtifactPanel',
      name: 'defaultView',
      type: "'preview' | 'code'",
      default: "'preview'",
      description: 'View on first render when uncontrolled.',
    },
    {
      component: 'ArtifactPanel',
      name: 'onViewChange',
      type: "(view: 'preview' | 'code') => void",
      description: 'Called when the reader switches between preview and code.',
    },
    {
      component: 'ArtifactPanel',
      name: 'actions',
      type: 'React.ReactNode',
      description: 'Actions in the header, before close: copy, download, publish.',
    },
    {
      component: 'ArtifactPanel',
      name: 'onClose',
      type: '() => void',
      description: 'Called when the reader closes the panel. Shows the close button.',
    },
    {
      component: 'ArtifactPanel',
      name: 'children',
      type: 'React.ReactNode',
      description: 'The preview.',
    },
    {
      component: 'ArtifactPanel',
      name: 'code',
      type: 'React.ReactNode',
      description: 'The source behind the preview. The tabs show when this is given.',
    },
    {
      component: 'ArtifactPanel',
      name: 'status',
      type: "'idle' | 'submitted' | 'streaming' | 'complete' | 'stopped' | 'error'",
      default: "'complete'",
      description: 'The generation status of the artifact.',
    },
    {
      component: 'ArtifactPanel',
      name: 'returnFocusRef',
      type: 'React.RefObject<HTMLElement | null>',
      description:
        'Where focus goes on close. By default it is the element that had focus when the panel appeared.',
    },
    {
      component: 'ArtifactPanel',
      name: 'headingLevel',
      type: '2 | 3 | 4 | 5 | 6',
      default: '2',
      description: 'Heading level of the title.',
    },
    {
      component: 'ArtifactPanel',
      name: 'labels',
      type: 'Partial<ArtifactPanelLabels>',
      description:
        'Translations: close, version, views, preview, code, generating, stopped and error.',
    },
  ],
  accessibility: [
    'The panel is a complementary region named by its title, which is a real heading.',
    'Preview and code are tabs in a labelled tab list, each with its own tab panel.',
    'The version switcher is a native select with an accessible name.',
    'Closing returns focus to the element that opened the panel, or to returnFocusRef.',
    'Opening the panel never moves focus, so the conversation is not interrupted.',
    'The generation status is a polite status in words. With reduced motion it does not shimmer.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'Moves through the version switcher, tabs, actions and content.',
    },
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description: 'Switches between the preview and code tabs.',
    },
    { keys: ['Enter', 'Space'], description: 'Activates the focused action or close.' },
  ],
  guidelines: {
    do: [
      'Name the artifact after what it is, such as Launch plan.',
      'Keep a version for every change so people can go back.',
    ],
    dont: [
      'Render generated HTML straight into your page. Use a sandboxed frame for previews.',
      'Hide the conversation behind it on wide screens. Use CanvasSplitView.',
    ],
  },
  related: [
    'canvas-split-view',
    'code-suggestion',
    'file-preview-card',
    'markdown-renderer',
    'tabs',
  ],
};

const versions = [
  { id: 'v1', label: 'Version 1' },
  { id: 'v2', label: 'Version 2' },
  { id: 'v3', label: 'Version 3' },
];

const source = `# Launch plan

1. Confirm pricing with finance.
2. Brief the support team.
3. Publish on Tuesday.`;

const preview = (
  <>
    <h3 style={{ marginTop: 0 }}>Launch plan</h3>
    <ol>
      <li>Confirm pricing with finance.</li>
      <li>Brief the support team.</li>
      <li>Publish on Tuesday.</li>
    </ol>
  </>
);

export function Basic() {
  const [version, setVersion] = React.useState('v3');
  return (
    <div style={{ width: '100%', maxWidth: 560, height: 320 }}>
      <ArtifactPanel
        title="Launch plan"
        kind="Document"
        versions={versions}
        versionId={version}
        onVersionChange={setVersion}
        code={<CodeBlock code={source} language="md" />}
        actions={<IconButton size="sm" label="Download" icon={<Icon name="download" />} />}
      >
        {preview}
        <p>Showing {versions.find((item) => item.id === version)?.label}.</p>
      </ArtifactPanel>
    </div>
  );
}

export function OpenAndClose() {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 560 }}>
      <div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={open}>
          Open the launch plan
        </Button>
      </div>
      {open && (
        <div style={{ height: 240 }}>
          <ArtifactPanel title="Launch plan" kind="Document" onClose={() => setOpen(false)}>
            {preview}
          </ArtifactPanel>
        </div>
      )}
    </div>
  );
}

export function Generating() {
  return (
    <div style={{ width: '100%', maxWidth: 560, height: 220 }}>
      <ArtifactPanel title="Pricing page" kind="Web page" status="streaming">
        <h3 style={{ marginTop: 0 }}>Simple pricing</h3>
        <p>One plan for teams of every size, billed</p>
      </ArtifactPanel>
    </div>
  );
}
