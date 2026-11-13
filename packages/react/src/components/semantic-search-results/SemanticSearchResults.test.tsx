import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import {
  SemanticSearchResults,
  splitHighlights,
  type SemanticSearchResult,
} from './SemanticSearchResults';

const results: SemanticSearchResult[] = [
  {
    id: 'a',
    title: 'Master services agreement',
    href: '/documents/a',
    snippet: 'Either party may end the agreement with 90 days notice before the term ends.',
    highlights: ['90 days notice', 'term'],
    source: 'Contracts',
    score: 0.92,
    reason: 'Describes how to end the contract',
  },
  {
    id: 'b',
    title: 'Renewal policy',
    snippet: 'Contracts renew yearly unless cancelled.',
  },
];
const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;

describe('SemanticSearchResults', () => {
  it('renders a labelled section with a count and an ordered list', () => {
    render(<SemanticSearchResults query="cancel contract" results={results} />);
    const section = screen.getByRole('region', { name: 'Search results' });
    expect(within(section).getByText('2 results for cancel contract')).toBeVisible();
    const list = within(section).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(section).getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('marks the matching passage with mark elements', () => {
    const { container } = render(<SemanticSearchResults results={results} />);
    const marks = [...container.querySelectorAll('mark')].map((m) => m.textContent);
    expect(marks).toEqual(['90 days notice', 'term']);
    expect(
      screen.getByText(/Either party may end the agreement with/).closest('p'),
    ).toHaveTextContent(
      'Either party may end the agreement with 90 days notice before the term ends.',
    );
  });

  it('splits highlights case insensitively and treats special characters as text', () => {
    expect(splitHighlights('Notice (90) days. notice', ['NOTICE', '(90)'])).toEqual([
      { text: 'Notice', match: true },
      { text: ' ', match: false },
      { text: '(90)', match: true },
      { text: ' days. ', match: false },
      { text: 'notice', match: true },
    ]);
    expect(splitHighlights('Plain', undefined)).toEqual([{ text: 'Plain', match: false }]);
    expect(splitHighlights('Plain', ['', '  '])).toEqual([{ text: 'Plain', match: false }]);
  });

  it('shows the source, the score in words and why it matched', () => {
    render(<SemanticSearchResults results={results} />);
    const first = screen.getAllByRole('listitem')[0]!;
    expect(within(first).getByText('Contracts')).toBeVisible();
    expect(within(first).getByText('92% match')).toBeVisible();
    expect(
      within(first)
        .getByText(/Describes how to end the contract/)
        .closest('p'),
    ).toHaveTextContent('Why it matched: Describes how to end the contract');
  });

  it('uses a link with href and a button without, and reports the selection', async () => {
    const user = userEvent.setup();
    const onResultSelect = vi.fn();
    render(
      <SemanticSearchResults results={results} onResultSelect={onResultSelect} target="_blank" />,
    );
    const link = screen.getByRole('link', { name: 'Master services agreement' });
    expect(link).toHaveAttribute('href', '/documents/a');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    link.addEventListener('click', (e) => e.preventDefault());
    await user.click(link);
    expect(onResultSelect).toHaveBeenLastCalledWith(results[0]);
    const button = screen.getByRole('button', { name: 'Renewal policy' });
    button.focus();
    await user.keyboard('{Enter}');
    expect(onResultSelect).toHaveBeenLastCalledWith(results[1]);
  });

  it('shows placeholders while loading and announces the count once when it ends', () => {
    const { rerender, container } = render(
      <SemanticSearchResults query="notice" results={[]} status="submitted" />,
    );
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Searching')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
    expect(container.querySelectorAll('.st-semantic-search-results__placeholder')).toHaveLength(3);
    expect(announcer(container)).toBeEmptyDOMElement();
    rerender(<SemanticSearchResults query="notice" results={results} status="complete" />);
    expect(screen.getByRole('region')).not.toHaveAttribute('aria-busy');
    expect(announcer(container)).toHaveTextContent('2 results for notice');
  });

  it('does not announce on first render', () => {
    const { container } = render(<SemanticSearchResults results={results} />);
    expect(announcer(container)).toBeEmptyDOMElement();
  });

  it('shows an empty state, a custom one, and an error', () => {
    const { rerender } = render(<SemanticSearchResults query="zzz" results={[]} />);
    expect(screen.getByRole('heading', { name: 'No results' })).toBeInTheDocument();
    expect(screen.getByText('Try other words or a broader question.')).toBeVisible();
    rerender(<SemanticSearchResults results={[]} emptyState={<p>Nothing here yet</p>} />);
    expect(screen.getByText('Nothing here yet')).toBeVisible();
    rerender(<SemanticSearchResults results={results} status="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('The search could not be completed');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('shows an AI answer above the results', () => {
    render(
      <SemanticSearchResults results={results} answer={<p>Give 90 days notice in writing.</p>} />,
    );
    const answer = screen.getByRole('group', { name: 'Answer' });
    expect(within(answer).getByText('Give 90 days notice in writing.')).toBeVisible();
    expect(within(answer).getByText('Generated by AI')).toBeVisible();
  });

  it('honours translated labels and the heading level', () => {
    render(
      <SemanticSearchResults
        results={results.slice(0, 1)}
        headingLevel={2}
        labels={{
          label: 'Sökresultat',
          count: (n) => `${n} träff`,
          score: (s) => `${Math.round(s * 100)} procent`,
        }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Sökresultat' })).toBeInTheDocument();
    expect(screen.getByText('1 träff')).toBeVisible();
    expect(screen.getByText('92 procent')).toBeVisible();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('forwards the ref, className and props', () => {
    const ref = React.createRef<HTMLElement>();
    render(<SemanticSearchResults ref={ref} results={results} className="mine" id="found" />);
    expect(ref.current).toHaveClass('st-semantic-search-results', 'mine');
    expect(ref.current).toHaveAttribute('id', 'found');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SemanticSearchResults query="notice" results={results} answer={<p>Give notice.</p>} />
        <SemanticSearchResults results={[]} labels={{ label: 'Empty results' }} />
        <SemanticSearchResults
          results={[]}
          status="submitted"
          labels={{ label: 'Loading results' }}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
