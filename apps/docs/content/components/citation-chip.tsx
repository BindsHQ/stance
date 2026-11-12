import { CitationChip } from '@bindshq/stance-react';
import type { Source } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'citation-chip',
  name: 'CitationChip',
  category: 'ai',
  summary:
    'An inline numbered marker that links a claim to its source and previews it on hover, focus or tap.',
  description:
    'Place a CitationChip right after the sentence it supports. Readers can check the source without leaving the answer: the preview shows the title, site and snippet, and activating the marker opens the source.',
  imports: ['CitationChip'],
  status: 'beta',
  examples: [
    { name: 'Inline', title: 'In running text', minHeight: 220 },
    {
      name: 'LocalSource',
      title: 'A source without a link',
      description:
        'With no href or source.url the marker is a button. Use onOpen to show the file in your app.',
      minHeight: 200,
    },
    {
      name: 'NoPreview',
      title: 'Without a preview',
      description: 'Turn the preview off when the sources are already listed beside the answer.',
    },
  ],
  props: [
    {
      component: 'CitationChip',
      name: 'index',
      type: 'number',
      required: true,
      description: 'The citation number shown in the marker.',
    },
    {
      component: 'CitationChip',
      name: 'source',
      type: 'Source',
      required: true,
      description: 'The source: { title, url?, domain?, favicon?, snippet? }.',
    },
    {
      component: 'CitationChip',
      name: 'href',
      type: 'string',
      description: 'Link for the marker. Defaults to source.url. Without either it is a button.',
    },
    {
      component: 'CitationChip',
      name: 'onOpen',
      type: '(source: Source) => void',
      description: 'Called when the reader opens the source from the marker or its preview.',
    },
    {
      component: 'CitationChip',
      name: 'target',
      type: 'HTMLAttributeAnchorTarget',
      default: "'_blank'",
      description: 'Link target.',
    },
    {
      component: 'CitationChip',
      name: 'preview',
      type: 'boolean',
      default: 'true',
      description: 'Show the source preview on hover, focus and tap.',
    },
    {
      component: 'CitationChip',
      name: 'previewOpen',
      type: 'boolean',
      description: 'Controlled open state of the preview.',
    },
    {
      component: 'CitationChip',
      name: 'onPreviewOpenChange',
      type: '(open: boolean) => void',
      description: 'Called when the preview opens or closes.',
    },
    {
      component: 'CitationChip',
      name: 'openDelay',
      type: 'number',
      default: '300',
      description: 'Delay before the preview opens on hover, in ms.',
    },
    {
      component: 'CitationChip',
      name: 'labels',
      type: 'Partial<CitationChipLabels>',
      description:
        'Translations. labels.source builds the accessible name from the index and title.',
    },
  ],
  accessibility: [
    'The marker is a link, or a button without a url, named “Source 2: title”, so the number alone is never the whole name.',
    'Keyboard focus opens the preview and links it to the marker as its description. Escape closes it and focus stays on the marker.',
    'On touch screens the first tap shows the preview, which holds the link to the source.',
    'The marker stays small in text while its hit area meets the minimum target size.',
    'Nothing is announced when an answer streams in; markers are read in place with the text.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Focuses the marker and shows the preview.' },
    { keys: ['Enter'], description: 'Opens the source.' },
    { keys: ['Esc'], description: 'Closes the preview.' },
  ],
  guidelines: {
    do: [
      'Put the marker directly after the claim it supports.',
      'Number sources in the order they first appear.',
    ],
    dont: [
      'Cite a source that does not contain the claim.',
      'Stack many markers after one sentence; list the sources instead.',
    ],
  },
  related: ['source-list', 'source-preview', 'hover-card'],
};

const retention: Source = {
  title: 'Retention policy for signed documents',
  url: 'https://www.example.com/policies/retention',
  snippet: 'Signed documents are kept for seven years from the date of the last signature.',
};

const regions: Source = {
  title: 'Where your data is stored',
  url: 'https://www.example.com/trust/regions',
  snippet: 'Documents stay in the region chosen when the workspace was created.',
};

export function Inline() {
  return (
    <p style={{ margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
      Signed documents are kept for seven years
      <CitationChip index={1} source={retention} /> and never leave the region you chose
      <CitationChip index={2} source={regions} />.
    </p>
  );
}

export function LocalSource() {
  return (
    <p style={{ margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
      Either party may end the agreement with 30 days notice
      <CitationChip
        index={1}
        source={{
          title: 'Master services agreement.pdf',
          domain: 'Uploaded file',
          snippet: 'Either party may end this agreement with 30 days written notice.',
        }}
        onOpen={() => {}}
      />
      .
    </p>
  );
}

export function NoPreview() {
  return (
    <p style={{ margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
      Documents stay in your region
      <CitationChip index={2} source={regions} preview={false} />.
    </p>
  );
}
