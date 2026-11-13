import * as React from 'react';
import { Button, SemanticSearchResults } from '@bindshq/stance-react';
import type { GenerationStatus, SemanticSearchResult } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'semantic-search-results',
  name: 'SemanticSearchResults',
  category: 'ai',
  summary:
    'Results ranked by meaning: each shows the passage that matched with the match marked and a reason, under an optional AI answer.',
  description:
    'Use SemanticSearchResults when search understands the question rather than only the words. Each result shows the passage that matched, marks the part that answers the question and says why it was chosen. An AI answer can sit above the list, clearly labelled as generated.',
  imports: ['SemanticSearchResults'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'Results with highlights and reasons',
      layout: 'fill',
    },
    {
      name: 'WithAnswer',
      title: 'With an AI answer',
      layout: 'fill',
    },
    {
      name: 'Loading',
      title: 'Loading and the announced count',
      description: 'When loading ends, the number of results is announced once.',
      layout: 'fill',
    },
    {
      name: 'Empty',
      title: 'No results',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'SemanticSearchResults',
      name: 'results',
      type: 'SemanticSearchResult[]',
      required: true,
      description:
        'The results, best match first. Each has id, title, snippet and optional href, highlights, source, score and reason.',
    },
    {
      component: 'SemanticSearchResults',
      name: 'query',
      type: 'string',
      description: 'The query the results belong to. Used in the count line.',
    },
    {
      component: 'SemanticSearchResults',
      name: 'answer',
      type: 'React.ReactNode',
      description: 'An AI answer shown above the results, with a generated label.',
    },
    {
      component: 'SemanticSearchResults',
      name: 'status',
      type: 'GenerationStatus',
      default: "'complete'",
      description: 'submitted and streaming show the loading state; error shows a message.',
    },
    {
      component: 'SemanticSearchResults',
      name: 'onResultSelect',
      type: '(result: SemanticSearchResult) => void',
      description: 'Called when the reader opens a result.',
    },
    {
      component: 'SemanticSearchResults',
      name: 'emptyState',
      type: 'React.ReactNode',
      description: 'Replaces the built in empty state.',
    },
    {
      component: 'SemanticSearchResults',
      name: 'target',
      type: 'React.HTMLAttributeAnchorTarget',
      description: 'Link target for results with href.',
    },
    {
      component: 'SemanticSearchResults',
      name: 'headingLevel',
      type: '2 | 3 | 4 | 5 | 6',
      default: '3',
      description: 'Heading level of result titles and of the answer heading.',
    },
    {
      component: 'SemanticSearchResults',
      name: 'loadingCount',
      type: 'number',
      default: '3',
      description: 'How many placeholders to show while loading.',
    },
    {
      component: 'SemanticSearchResults',
      name: 'labels',
      type: 'Partial<SemanticSearchResultsLabels>',
      description:
        'Translations: label, count(count, query), loading, answer, generated, emptyTitle, emptyDescription(query), error, reason and score(score).',
    },
  ],
  accessibility: [
    'The results are a labelled section with an ordered list, best match first.',
    'Each title is a heading that holds a link, or a button when there is no address.',
    'Matching passages use the mark element, with weight and an underline as well as colour.',
    'The match score is written in words, for example 92% match.',
    'While searching the section is busy; the count is announced once when loading ends.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves from result to result.' },
    { keys: ['Enter'], description: 'Opens the focused result.' },
  ],
  guidelines: {
    do: [
      'Show the passage that answers the question, not the start of the document.',
      'Say why a result matched when the words differ from the query.',
    ],
    dont: [
      'Show a score without a title and passage to judge it by.',
      'Present the AI answer without the results it draws on.',
    ],
  },
  related: ['ask-bar', 'search-input', 'source-list', 'ai-generated-label'],
};

const results: SemanticSearchResult[] = [
  {
    id: 'msa',
    title: 'Master services agreement',
    href: '#master-services-agreement',
    snippet:
      'Either party may end the agreement by giving 90 days written notice before the term ends.',
    highlights: ['90 days written notice'],
    source: 'Contracts',
    score: 0.92,
    reason: 'Describes how to end the contract',
  },
  {
    id: 'policy',
    title: 'Renewal policy',
    href: '#renewal-policy',
    snippet: 'Contracts renew for one year at a time unless they are cancelled in writing.',
    highlights: ['cancelled in writing'],
    source: 'Policies',
    score: 0.78,
    reason: 'Explains what happens without a cancellation',
  },
  {
    id: 'faq',
    title: 'Billing questions',
    snippet: 'After cancellation the final invoice covers the days up to the end date.',
    source: 'Help centre',
    score: 0.61,
  },
];

export function Basic() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <SemanticSearchResults query="how do we cancel" results={results} />
    </div>
  );
}

export function WithAnswer() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <SemanticSearchResults
        query="how do we cancel"
        results={results.slice(0, 2)}
        answer={
          <p>
            Give 90 days written notice before the term ends. Without it the contract renews for a
            year.
          </p>
        }
      />
    </div>
  );
}

export function Loading() {
  const [status, setStatus] = React.useState<GenerationStatus>('submitted');
  return (
    <div style={{ display: 'grid', gap: 16, width: '100%', maxWidth: 560 }}>
      <SemanticSearchResults query="how do we cancel" results={results} status={status} />
      <div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus((s) => (s === 'submitted' ? 'complete' : 'submitted'))}
        >
          {status === 'submitted' ? 'Finish the search' : 'Search again'}
        </Button>
      </div>
    </div>
  );
}

export function Empty() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <SemanticSearchResults query="warranty for hardware" results={[]} />
    </div>
  );
}
