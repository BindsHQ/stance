import * as React from 'react';
import { Button, MarkdownRenderer } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'markdown-renderer',
  name: 'MarkdownRenderer',
  category: 'ai',
  summary:
    'Turns the Markdown a model writes into safe, readable content, and stays steady while the response is still streaming in.',
  description:
    'Use MarkdownRenderer for assistant answers. It parses Markdown to elements and never injects HTML, so text from a model cannot run code or restyle your page. Headings, lists, tables, code, quotes, links and task lists use Stance typography. While a response streams, unfinished Markdown shows as what it is about to become.',
  imports: ['MarkdownRenderer'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'An answer',
      description: 'Headings, emphasis, lists, a table and code from one string.',
      layout: 'fill',
    },
    {
      name: 'Streaming',
      title: 'While streaming',
      description:
        'Open emphasis, a half written table and an open code fence render without flicker.',
      layout: 'fill',
    },
    {
      name: 'Citations',
      title: 'Citations',
      description: 'Numbered markers become citation chips when you pass their sources.',
      layout: 'fill',
    },
    {
      name: 'Untrusted',
      title: 'Untrusted input',
      description: 'HTML stays text. Links with unsafe addresses lose the link and keep the words.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'MarkdownRenderer',
      name: 'children',
      type: 'string',
      description: 'The Markdown source.',
    },
    {
      component: 'MarkdownRenderer',
      name: 'streaming',
      type: 'boolean',
      default: 'false',
      description:
        'The text is still arriving. Unfinished Markdown at the end renders as what it is about to become, and the region is marked busy.',
    },
    {
      component: 'MarkdownRenderer',
      name: 'components',
      type: 'Partial<MarkdownRendererComponents>',
      description:
        'Replace the element for a tag: h1 to h6, p, blockquote, ul, ol, li, hr, a, strong, em, del, code, pre, img, table, thead, tbody, tr, th and td. The pre override receives code, language and incomplete.',
    },
    {
      component: 'MarkdownRenderer',
      name: 'onLinkClick',
      type: '(event: React.MouseEvent<HTMLAnchorElement>, href: string) => void',
      description: 'Called when a link is activated. Prevent the default to handle it yourself.',
    },
    {
      component: 'MarkdownRenderer',
      name: 'citations',
      type: 'Record<number, Source>',
      description: 'Sources for [1] style markers. A marker with a source renders a CitationChip.',
    },
    {
      component: 'MarkdownRenderer',
      name: 'onCitationOpen',
      type: '(source: Source, index: number) => void',
      description: 'Called when the reader opens a cited source.',
    },
    {
      component: 'MarkdownRenderer',
      name: 'allowImages',
      type: 'boolean',
      default: 'false',
      description: 'Render images. When false an image becomes a link with its alt text.',
    },
    {
      component: 'MarkdownRenderer',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Text size.',
    },
    {
      component: 'MarkdownRenderer',
      name: 'headingBaseLevel',
      type: '1 | 2 | 3 | 4 | 5 | 6',
      default: '2',
      description: 'The level a # heading renders at, so the page outline stays valid.',
    },
    {
      component: 'MarkdownRenderer',
      name: 'linkTarget',
      type: 'React.HTMLAttributeAnchorTarget',
      description: 'Target for links. Links always carry rel="noopener noreferrer".',
    },
    {
      component: 'MarkdownRenderer',
      name: 'labels',
      type: 'Partial<MarkdownRendererLabels>',
      description: 'Translations: taskDone, taskTodo, table and code.',
    },
  ],
  accessibility: [
    'Headings, lists, quotes and tables are real elements, so screen reader navigation works.',
    'Heading levels start at headingBaseLevel and never go past h6.',
    'Link addresses are limited to http, https, mailto and relative ones. Others render as text.',
    'Raw HTML in the source is shown as text and never becomes markup.',
    'Images are off by default. When on, the alt text from the source is used.',
    'Task list checkboxes are read only and named Done or To do.',
    'While streaming the region is marked busy. Announce start and finish in the message, not each token.',
    'Wide tables scroll inside a focusable, named region.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through links, citations and code copy buttons.' },
    { keys: ['Enter'], description: 'Follows the focused link or opens the focused citation.' },
  ],
  guidelines: {
    do: [
      'Set streaming while the response arrives and clear it when it ends.',
      'Set headingBaseLevel to fit where the answer sits in the page outline.',
      'Pass citations so numbered markers lead to their sources.',
    ],
    dont: [
      'Turn on images for content from sources you do not trust.',
      'Use it for long documents you write yourself. RichText fits those.',
    ],
  },
  related: ['message', 'streaming-text', 'citation-chip', 'code-block', 'code-suggestion'],
};

const answer = `## Renewal terms

The agreement renews **every year** unless notice is given *90 days* before the term ends.

1. First term ends on 30 June 2027
2. Notice must be in writing
   * Email counts
   * Use \`legal@example.com\`

| Clause | Subject | Days |
|:-------|:--------|-----:|
| 4.2 | First term | 365 |
| 4.3 | Notice | 90 |

\`\`\`ts
const noticeBy = addDays(termEnd, -90);
\`\`\`

- [x] Dates checked
- [ ] Sent to legal

> Check the notice address before you send.
`;

function useFakeStream(text: string) {
  const [length, setLength] = React.useState(text.length);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearInterval(timer.current), []);
  const start = () => {
    window.clearInterval(timer.current);
    setLength(0);
    timer.current = window.setInterval(() => {
      setLength((current) => {
        if (current >= text.length) window.clearInterval(timer.current);
        return Math.min(text.length, current + 3);
      });
    }, 24);
  };
  return { text: text.slice(0, length), streaming: length < text.length, start };
}

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <MarkdownRenderer>{answer}</MarkdownRenderer>
    </div>
  );
}

export function Streaming() {
  const { text, streaming, start } = useFakeStream(answer);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 560 }}>
      <div>
        <Button size="sm" variant="outline" onClick={start} disabled={streaming}>
          Play
        </Button>
      </div>
      <MarkdownRenderer streaming={streaming} size="sm">
        {text}
      </MarkdownRenderer>
    </div>
  );
}

export function Citations() {
  const sources = {
    1: {
      title: 'Master services agreement',
      url: 'https://example.com/msa',
      snippet: 'Clause 4.3: either party may end the agreement with 90 days written notice.',
    },
    2: { title: 'Signature policy', url: 'https://example.com/policy' },
  };
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <MarkdownRenderer citations={sources} linkTarget="_blank">
        {
          'Either party can end the agreement with 90 days notice [1]. Both signatures must be electronic [2]. Read the [full policy](https://example.com/policy).'
        }
      </MarkdownRenderer>
    </div>
  );
}

export function Untrusted() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <MarkdownRenderer>
        {
          'A model may return <script>alert(1)</script> or a [risky link](javascript:alert(1)).\n\nBoth stay harmless. A [safe link](https://example.com) still works.'
        }
      </MarkdownRenderer>
    </div>
  );
}
