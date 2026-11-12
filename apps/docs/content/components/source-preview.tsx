import { SourcePreview } from '@bindshq/stance-react';
import type { Source } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'source-preview',
  name: 'SourcePreview',
  category: 'ai',
  summary:
    'A card for one source behind an answer: its title, site, a short snippet and a link to open it.',
  description:
    'Use SourcePreview wherever a reader should be able to judge a source before opening it: inside a citation preview, in a list of sources, or beside an answer. It only shows what you pass in; it never fetches the page.',
  imports: ['SourcePreview'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'A web source' },
    {
      name: 'Numbered',
      title: 'With a citation number',
      description: 'index shows the same number as the matching CitationChip.',
    },
    {
      name: 'LocalFile',
      title: 'A source without a link',
      description:
        'Without a url the title becomes a button when onOpen is set, so the app can open the file itself.',
    },
    { name: 'Sizes', title: 'Sizes' },
  ],
  props: [
    {
      component: 'SourcePreview',
      name: 'source',
      type: 'Source',
      required: true,
      description: 'The source: { title, url?, domain?, favicon?, snippet? }.',
    },
    {
      component: 'SourcePreview',
      name: 'onOpen',
      type: '(source: Source) => void',
      description: 'Called when the reader opens the source.',
    },
    {
      component: 'SourcePreview',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Card density.',
    },
    {
      component: 'SourcePreview',
      name: 'index',
      type: 'number',
      description: 'A citation number shown before the site name.',
    },
    {
      component: 'SourcePreview',
      name: 'target',
      type: 'HTMLAttributeAnchorTarget',
      default: "'_blank'",
      description: 'Link target for the title.',
    },
    {
      component: 'SourcePreview',
      name: 'snippetLines',
      type: 'number',
      default: '3',
      description: 'Lines of snippet shown before it is cut.',
    },
    {
      component: 'SourcePreview',
      name: 'labels',
      type: 'Partial<SourcePreviewLabels>',
      description: 'Translation for the hidden “opens in a new tab” text.',
    },
  ],
  accessibility: [
    'The title is a real link, or a button when there is no url, so it works with the keyboard and announces what it does.',
    'Links that open a new tab say so to screen readers.',
    'The site icon is decorative and falls back to a globe when it is missing or fails to load.',
    'The site name is derived from the url when domain is not given, so readers always see where a link leads.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves to the title link.' },
    { keys: ['Enter'], description: 'Opens the source.' },
  ],
  guidelines: {
    do: [
      'Pass the real page title and a snippet that supports the claim.',
      'Use the same index as the citation marker in the text.',
    ],
    dont: [
      'Show a source the answer did not use.',
      'Shorten the title so much that the page cannot be recognised.',
    ],
  },
  related: ['citation-chip', 'source-list', 'hover-card'],
};

const policy: Source = {
  title: 'Retention policy for signed documents',
  url: 'https://www.example.com/policies/retention',
  snippet:
    'Signed documents are kept for seven years from the date of the last signature, then removed from every region.',
};

export function Basic() {
  return (
    <div style={{ width: 320 }}>
      <SourcePreview source={policy} />
    </div>
  );
}

export function Numbered() {
  return (
    <div style={{ width: 320 }}>
      <SourcePreview source={policy} index={2} />
    </div>
  );
}

export function LocalFile() {
  return (
    <div style={{ width: 320 }}>
      <SourcePreview
        source={{
          title: 'Master services agreement.pdf',
          domain: 'Uploaded file',
          snippet: 'Either party may end this agreement with 30 days written notice.',
        }}
        onOpen={() => {}}
      />
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'grid', gap: 20, width: 320 }}>
      <SourcePreview source={policy} size="sm" />
      <SourcePreview source={policy} size="md" />
    </div>
  );
}
