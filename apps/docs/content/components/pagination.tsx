import { Pagination } from '@bindshq/stance-react';
import { useState } from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'pagination',
  name: 'Pagination',
  category: 'navigation',
  summary:
    'Accessible page navigation for long lists and tables, with previous, next and compact modes.',
  description:
    'Use Pagination below tables and lists that are split into pages. The visible page numbers keep a stable width as the page changes, so the control never jumps under the pointer. Use the compact variant in tight spaces, and getHref when each page has its own URL.',
  imports: ['Pagination'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    {
      name: 'Compact',
      title: 'Compact',
      description:
        '“Page x of y” with previous and next buttons; the summary is announced politely when it changes.',
    },
    {
      name: 'Links',
      title: 'As links',
      description: 'getHref renders anchors, so pages can be opened in new tabs and crawled.',
    },
    { name: 'MoreSiblings', title: 'Sibling and boundary counts' },
    { name: 'Small', title: 'Small with text labels' },
  ],
  props: [
    {
      component: 'Pagination',
      name: 'page',
      type: 'number',
      required: true,
      description: 'Current page, 1-based.',
    },
    {
      component: 'Pagination',
      name: 'pageCount',
      type: 'number',
      required: true,
      description: 'Total number of pages.',
    },
    {
      component: 'Pagination',
      name: 'onPageChange',
      type: '(page: number) => void',
      description: 'Called with the requested page.',
    },
    {
      component: 'Pagination',
      name: 'siblingCount',
      type: 'number',
      default: '1',
      description: 'Pages shown either side of the current page.',
    },
    {
      component: 'Pagination',
      name: 'boundaryCount',
      type: 'number',
      default: '1',
      description: 'Pages always shown at each end.',
    },
    {
      component: 'Pagination',
      name: 'variant',
      type: "'full' | 'compact'",
      default: "'full'",
      description: 'Page numbers or a “Page x of y” summary.',
    },
    {
      component: 'Pagination',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Item height.',
    },
    {
      component: 'Pagination',
      name: 'getHref',
      type: '(page: number) => string',
      description: 'Render items as links.',
    },
    {
      component: 'Pagination',
      name: 'showPrevNextLabels',
      type: 'boolean',
      default: 'false',
      description: 'Show “Previous” / “Next” text beside the arrows.',
    },
    {
      component: 'Pagination',
      name: 'labels',
      type: 'Partial<PaginationLabels>',
      description: 'Translatable strings: nav, previous, next, page(n), summary(n, count).',
    },
    {
      component: 'Pagination',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disable all items, e.g. while loading.',
    },
  ],
  accessibility: [
    'A <nav> landmark named “Pagination” (configurable) containing a list.',
    'Every item has a spoken label such as “Page 4”; the current page has aria-current="page".',
    'Previous and next are disabled at the ends instead of disappearing, so the layout does not shift.',
    'Ellipses are decorative and hidden from assistive technology.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between page controls.' },
    { keys: ['Enter', 'Space'], description: 'Goes to the page.' },
  ],
  guidelines: {
    do: [
      'Show the total number of results near the table.',
      'Move focus to the top of the results after changing page.',
    ],
    dont: [
      'Use pagination for fewer than two pages.',
      'Combine with infinite scroll on the same list.',
    ],
  },
  playground: {
    render: (p) => (
      <Pagination
        page={p.page as number}
        pageCount={p.pageCount as number}
        siblingCount={p.siblingCount as number}
        variant={p.variant as 'full'}
        size={p.size as 'md'}
      />
    ),
    controls: {
      page: { type: 'number', default: 6, min: 1, max: 40 },
      pageCount: { type: 'number', default: 20, min: 1, max: 40 },
      siblingCount: { type: 'number', default: 1, min: 0, max: 3 },
      variant: { type: 'select', options: ['full', 'compact'], default: 'full' },
      size: { type: 'select', options: ['sm', 'md'], default: 'md' },
    },
  },
  related: ['data-table', 'table'],
};

export function Basic() {
  const [page, setPage] = useState(4);
  return <Pagination page={page} pageCount={24} onPageChange={setPage} />;
}

export function Compact() {
  const [page, setPage] = useState(3);
  return <Pagination variant="compact" page={page} pageCount={12} onPageChange={setPage} />;
}

export function Links() {
  return <Pagination page={2} pageCount={8} getHref={(p) => `#page-${p}`} />;
}

export function MoreSiblings() {
  const [page, setPage] = useState(10);
  return (
    <Pagination
      page={page}
      pageCount={40}
      siblingCount={2}
      boundaryCount={2}
      onPageChange={setPage}
    />
  );
}

export function Small() {
  const [page, setPage] = useState(1);
  return (
    <Pagination size="sm" showPrevNextLabels page={page} pageCount={5} onPageChange={setPage} />
  );
}
