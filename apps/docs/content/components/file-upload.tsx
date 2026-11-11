import { FileUpload, FormField } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'file-upload',
  name: 'FileUpload',
  category: 'forms',
  summary: 'Choose files by browsing or drag and drop, with type, size and count validation.',
  description:
    'Use FileUpload to attach documents, logos or spreadsheets. It validates against accept, maxSize and maxFiles before files reach your code, lists accepted files with remove buttons and reports rejected files clearly. Upload progress belongs to your own logic: render it with Progress beside the list, or set hideFileList and render your own.',
  imports: ['FileUpload', 'formatBytes'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Drop zone', layout: 'fill' },
    { name: 'Multiple', title: 'Multiple files with limits', layout: 'fill' },
    { name: 'Compact', title: 'Compact', layout: 'start' },
    { name: 'InForm', title: 'In a form', layout: 'fill' },
  ],
  props: [
    {
      component: 'FileUpload',
      name: 'accept',
      type: 'string',
      description: 'Accepted types, e.g. ".pdf,image/*".',
    },
    {
      component: 'FileUpload',
      name: 'maxSize',
      type: 'number',
      description: 'Maximum size per file in bytes.',
    },
    {
      component: 'FileUpload',
      name: 'maxFiles',
      type: 'number',
      description: 'Maximum number of files when multiple.',
    },
    {
      component: 'FileUpload',
      name: 'multiple',
      type: 'boolean',
      default: 'false',
      description: 'Allow several files; single mode replaces the file.',
    },
    {
      component: 'FileUpload',
      name: 'value / defaultValue',
      type: 'File[]',
      description: 'Controlled or initial accepted files.',
    },
    {
      component: 'FileUpload',
      name: 'onFilesChange',
      type: '(files: File[]) => void',
      description: 'Called with the accepted file list.',
    },
    {
      component: 'FileUpload',
      name: 'onReject',
      type: '(rejections: FileRejection[]) => void',
      description: 'Called with files that failed validation.',
    },
    {
      component: 'FileUpload',
      name: 'title',
      type: 'ReactNode',
      default: "'Drag files here'",
      description: 'Drop zone heading.',
    },
    {
      component: 'FileUpload',
      name: 'hint',
      type: 'ReactNode',
      description: 'Constraints text; linked to the browse button.',
    },
    {
      component: 'FileUpload',
      name: 'buttonLabel',
      type: 'string',
      default: "'Browse files'",
      description: 'Browse button text.',
    },
    {
      component: 'FileUpload',
      name: 'variant',
      type: "'dropzone' | 'compact'",
      default: "'dropzone'",
      description: 'Drop area or button only.',
    },
    {
      component: 'FileUpload',
      name: 'hideFileList',
      type: 'boolean',
      default: 'false',
      description: 'Hide the built-in list.',
    },
    {
      component: 'FileUpload',
      name: 'disabled / required / invalid',
      type: 'boolean',
      description: 'State; integrates with FormField.',
    },
    {
      component: 'FileUpload',
      name: 'name',
      type: 'string',
      description: 'Name for native form submission of browsed files.',
    },
  ],
  accessibility: [
    'Drag and drop is an enhancement: the Browse button is the keyboard and screen reader path and receives the FormField label, description and required state.',
    'The hidden native file input is removed from the tab order so there is only one focus stop.',
    'Rejected files are listed in a role="alert" region with specific reasons; additions and removals are announced in a polite live region.',
    'Each remove button is labelled with the file name ("Remove contract.pdf").',
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], description: 'On Browse: opens the system file picker.' },
    { keys: ['Tab'], description: 'Moves through the browse button and remove buttons.' },
  ],
  guidelines: {
    do: [
      'State accepted types and the size limit in the hint.',
      'Keep files visible after selection so people can verify them.',
    ],
    dont: ['Rely on drag and drop alone.', 'Start uploading silently without showing progress.'],
  },
  related: ['progress', 'form-field', 'file-tree'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <FileUpload
        accept=".pdf,.docx"
        maxSize={10 * 1024 * 1024}
        title="Drop the contract here"
        hint="PDF or DOCX, up to 10 MB"
      />
    </div>
  );
}

export function Multiple() {
  const [files, setFiles] = React.useState<File[]>([]);
  return (
    <div style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 520 }}>
      <FileUpload
        multiple
        maxFiles={5}
        accept=".csv,.xlsx"
        hint="CSV or Excel, up to 5 files"
        title="Import organisation users"
        value={files}
        onFilesChange={setFiles}
      />
      <span style={{ fontSize: 13 }}>{files.length} of 5 files selected</span>
    </div>
  );
}

export function Compact() {
  return (
    <FileUpload
      variant="compact"
      accept="image/*"
      buttonLabel="Upload logo"
      hint="PNG or SVG, square works best"
    />
  );
}

export function InForm() {
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <FormField
        label="Countersigned copy"
        description="Upload the version signed by both parties."
        required
      >
        <FileUpload accept=".pdf" hint="PDF only" />
      </FormField>
    </div>
  );
}
