import * as React from 'react';
import { AttachmentTray } from '@bindshq/stance-react';
import type { AttachmentItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'attachment-tray',
  name: 'AttachmentTray',
  category: 'ai',
  summary:
    'The files and images attached to a draft or a sent message, with upload progress, errors and a remove button on each.',
  description:
    'Use AttachmentTray in the header of PromptComposer while people prepare a message, and again inside the sent message in read only form. It only shows state: your app uploads the files and passes progress and errors in.',
  imports: ['AttachmentTray'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Files on a draft',
      layout: 'fill',
    },
    {
      name: 'Uploading',
      title: 'Progress and errors',
      description:
        'progress runs from 0 to 1. An error replaces the progress bar and is announced once.',
      layout: 'fill',
    },
    {
      name: 'ReadOnly',
      title: 'On a sent message',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'AttachmentTray',
      name: 'items',
      type: 'AttachmentItem[]',
      required: true,
      description:
        'The attachments: { id, name, kind, size?, previewUrl?, progress?, error? }. An empty list renders nothing.',
    },
    {
      component: 'AttachmentTray',
      name: 'onRemove',
      type: '(id: string) => void',
      description:
        'Called with the id of the attachment to remove. Without it there are no remove buttons.',
    },
    {
      component: 'AttachmentTray',
      name: 'readOnly',
      type: 'boolean',
      default: 'false',
      description: 'Show the attachments of a sent message, with no remove buttons.',
    },
    {
      component: 'AttachmentTray',
      name: 'formatSize',
      type: '(bytes: number) => string',
      description: 'Formats a size in bytes. The default gives “12 KB” or “1.4 MB”.',
    },
    {
      component: 'AttachmentTray',
      name: 'labels',
      type: 'Partial<AttachmentTrayLabels>',
      description: 'Translations: list, remove(name), uploading(name) and failed(name, error).',
    },
  ],
  accessibility: [
    'A list with an accessible name, so screen readers announce how many attachments there are.',
    'Each remove button is named after its file, for example “Remove contract.pdf”.',
    'Upload progress is a progressbar named for the file, with the percentage as its value text.',
    'A failed upload is shown as text beside an icon, never by colour alone, and is announced politely once when it happens.',
    'After a file is removed, focus moves to the next remove button, so keyboard users keep their place.',
    'Thumbnails are decorative: the file name beside them carries the meaning.',
  ],
  keyboard: [
    {
      keys: ['Tab'],
      description: 'Moves between remove buttons.',
    },
    {
      keys: ['Enter', 'Space'],
      description: 'Removes the focused attachment.',
    },
  ],
  guidelines: {
    do: [
      'Say why an upload failed and what to do about it.',
      'Show the same tray, read only, on the sent message.',
    ],
    dont: [
      'Hide a failed file; keep it with its error until it is removed.',
      'Use it to pick files; pair it with an attach button or FileUpload.',
    ],
  },
  related: ['prompt-composer', 'file-upload', 'context-chips'],
};

const files: AttachmentItem[] = [
  { id: 'msa', name: 'master-services-agreement.pdf', kind: 'file', size: 482000 },
  { id: 'pricing', name: 'pricing-2026.xlsx', kind: 'file', size: 91000 },
  { id: 'notes', name: 'call-notes.txt', kind: 'file', size: 2100 },
];

export function Basic() {
  const [items, setItems] = React.useState(files);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <AttachmentTray
        items={items}
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
      />
      {items.length < files.length && (
        <button type="button" onClick={() => setItems(files)}>
          Restore files
        </button>
      )}
    </div>
  );
}

export function Uploading() {
  const [progress, setProgress] = React.useState(0.2);
  React.useEffect(() => {
    const id = window.setInterval(
      () => setProgress((value) => (value >= 1 ? 0.1 : Math.min(1, value + 0.15))),
      900,
    );
    return () => window.clearInterval(id);
  }, []);
  return (
    <AttachmentTray
      onRemove={() => {}}
      items={[
        { id: 'scan', name: 'signed-scan.pdf', kind: 'file', size: 1800000, progress },
        {
          id: 'video',
          name: 'walkthrough.mov',
          kind: 'file',
          error: 'Larger than 20 MB. Choose a smaller file.',
        },
      ]}
    />
  );
}

export function ReadOnly() {
  return <AttachmentTray readOnly items={files.slice(0, 2)} />;
}
