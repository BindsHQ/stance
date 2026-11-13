import * as React from 'react';
import { Button, FilePreviewCard } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'file-preview-card',
  name: 'FilePreviewCard',
  category: 'ai',
  summary:
    'A compact card for a file in a conversation: its name, type, size and preview, with open and download.',
  description:
    'Use FilePreviewCard when the assistant creates a file or works from one. It names the file, says what it is and how large, and offers the two things people want next: open it or keep it. While the file is being made it shows progress in place.',
  imports: ['FilePreviewCard'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A finished file',
      layout: 'fill',
    },
    {
      name: 'Generating',
      title: 'While the file is made',
      description: 'Progress shows in the card. Open and download wait until the file is ready.',
      layout: 'fill',
    },
    {
      name: 'Tiles',
      title: 'Tiles with a preview',
      layout: 'fill',
    },
    {
      name: 'Failed',
      title: 'When it fails',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'FilePreviewCard',
      name: 'name',
      type: 'string',
      required: true,
      description: 'The file name, with its extension. It names the card.',
    },
    {
      component: 'FilePreviewCard',
      name: 'kind',
      type: "'document' | 'image' | 'code' | 'data' | 'pdf' | 'archive' | 'folder' | 'other'",
      default: "'document'",
      description: 'The broad type of the file. It picks the icon and the default words.',
    },
    {
      component: 'FilePreviewCard',
      name: 'kindLabel',
      type: 'string',
      description: 'Overrides the words for the kind, for example Spreadsheet.',
    },
    {
      component: 'FilePreviewCard',
      name: 'size',
      type: 'number | string',
      description: 'The size: a number of bytes, or text that is already formatted.',
    },
    {
      component: 'FilePreviewCard',
      name: 'meta',
      type: 'React.ReactNode',
      description: 'Extra detail after the kind and size, such as a page count.',
    },
    {
      component: 'FilePreviewCard',
      name: 'thumbnail',
      type: 'string | React.ReactNode',
      description: 'A preview: an image URL or any node. Without it the card shows the kind icon.',
    },
    {
      component: 'FilePreviewCard',
      name: 'status',
      type: "'generating' | 'ready' | 'error'",
      default: "'ready'",
      description: 'Where the file is in its life.',
    },
    {
      component: 'FilePreviewCard',
      name: 'progress',
      type: 'number',
      description: 'Progress from 0 to 100 while generating. Omit for an indeterminate bar.',
    },
    {
      component: 'FilePreviewCard',
      name: 'onOpen',
      type: '() => void',
      description: 'Called when the reader opens the file. Shows the open action.',
    },
    {
      component: 'FilePreviewCard',
      name: 'onDownload',
      type: '() => void',
      description: 'Called when the reader downloads the file. Shows the download action.',
    },
    {
      component: 'FilePreviewCard',
      name: 'actions',
      type: 'React.ReactNode',
      description: 'Extra actions after open and download.',
    },
    {
      component: 'FilePreviewCard',
      name: 'layout',
      type: "'row' | 'tile'",
      default: "'row'",
      description: 'A compact row, or a tile with a larger preview on top.',
    },
    {
      component: 'FilePreviewCard',
      name: 'labels',
      type: 'Partial<FilePreviewCardLabels>',
      description:
        'Translations: open(name), download(name), generating, error, progress(value) and kind.',
    },
  ],
  accessibility: [
    'The card is a group named by the file name.',
    'Open and download name their file, for example Download report.pdf.',
    'While generating, the card is busy and holds a progress bar with a text value.',
    'A failure is announced as an alert, in words.',
    'The thumbnail is decorative. The name and type carry the meaning.',
    'With reduced motion the indeterminate bar stays still.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through open, download and any extra actions.' },
    { keys: ['Enter', 'Space'], description: 'Activates the focused action.' },
  ],
  guidelines: {
    do: [
      'Show the real file name so people can find it later.',
      'Pass the size in bytes and let the card format it.',
    ],
    dont: [
      'Offer open or download before the file exists.',
      'Use it for a draft message attachment. Use AttachmentTray there.',
    ],
  },
  related: ['attachment-tray', 'artifact-panel', 'generated-image', 'code-suggestion'],
};

export function Basic() {
  return (
    <div style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 384 }}>
      <FilePreviewCard
        name="renewal-summary.pdf"
        kind="pdf"
        size={2400000}
        meta="12 pages"
        onOpen={() => {}}
        onDownload={() => {}}
      />
      <FilePreviewCard
        name="clauses.csv"
        kind="data"
        kindLabel="Spreadsheet"
        size={18300}
        onDownload={() => {}}
      />
    </div>
  );
}

export function Generating() {
  const [progress, setProgress] = React.useState(35);
  const done = progress >= 100;
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 384 }}>
      <FilePreviewCard
        name="board-update.pptx"
        kindLabel="Presentation"
        size={5200000}
        status={done ? 'ready' : 'generating'}
        progress={progress}
        onOpen={() => {}}
        onDownload={() => {}}
      />
      <div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setProgress((value) => (value >= 100 ? 35 : value + 25))}
        >
          {done ? 'Start again' : 'Advance'}
        </Button>
      </div>
    </div>
  );
}

const swatch = (
  <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="none">
    <rect width="160" height="100" fill="var(--st-color-bg-muted)" />
    <path
      d="M0 78 L40 52 L78 66 L118 30 L160 44 L160 100 L0 100 Z"
      fill="var(--st-color-bg-emphasis)"
    />
  </svg>
);

export function Tiles() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: '100%' }}>
      <FilePreviewCard
        layout="tile"
        name="revenue-chart.png"
        kind="image"
        size={184000}
        thumbnail={swatch}
        onOpen={() => {}}
      />
      <FilePreviewCard layout="tile" name="pricing.ts" kind="code" size={2100} onOpen={() => {}} />
    </div>
  );
}

export function Failed() {
  return (
    <div style={{ width: '100%', maxWidth: 384 }}>
      <FilePreviewCard
        name="export.zip"
        kind="archive"
        status="error"
        onDownload={() => {}}
        labels={{ error: 'The export failed. Try again.' }}
      />
    </div>
  );
}
