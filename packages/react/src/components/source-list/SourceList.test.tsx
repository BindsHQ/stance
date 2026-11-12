import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { SourceList, type SourceListItem } from './SourceList';

const sources: SourceListItem[] = [
  { id: 'a', title: 'Signature policy', url: 'https://www.example.com/policy', snippet: 'Policy.' },
  { id: 'b', title: 'Brand guide', url: 'https://brand.example.com/guide', snippet: 'Guide.' },
  { id: 'c', title: 'Legal footer rules', url: 'https://legal.example.com/footer' },
  { id: 'd', title: 'Uploaded brief.pdf', snippet: 'A local file.' },
  { id: 'e', title: 'Release notes', url: 'https://example.org/notes' },
];

describe('SourceList', () => {
  it('is a labelled group showing up to max sources inline with a control for the rest', () => {
    render(<SourceList sources={sources} />);
    const group = screen.getByRole('group', { name: 'Sources' });
    const links = within(group).getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAccessibleName(/example\.com.*Signature policy.*opens in a new tab/);
    expect(links[0]).toHaveAttribute('href', 'https://www.example.com/policy');
    const toggle = within(group).getByRole('button', { name: '+2 more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById(toggle.getAttribute('aria-controls')!)).toBeInTheDocument();
  });

  it('expands to the full numbered list and collapses again, keeping focus on the control', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<SourceList sources={sources} onExpandedChange={onExpandedChange} />);
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    const toggle = screen.getByRole('button', { name: '+2 more' });
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    const less = screen.getByRole('button', { name: 'Show fewer' });
    expect(less).toHaveAttribute('aria-expanded', 'true');
    expect(less).toHaveFocus();
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveAttribute('id', less.getAttribute('aria-controls'));
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText('A local file.')).toBeInTheDocument();
    await user.keyboard(' ');
    expect(screen.getByRole('button', { name: '+2 more' })).toBeInTheDocument();
    expect(screen.queryByText('A local file.')).toBeNull();
  });

  it('has no expand control when everything fits', () => {
    render(<SourceList sources={sources.slice(0, 2)} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('renders full rows in the list variant, optionally folded by max', async () => {
    const { rerender } = render(<SourceList sources={sources} variant="list" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: /more/ })).toBeNull();
    rerender(<SourceList sources={sources} variant="list" max={2} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: '+3 more' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('reports the opened source from chips, rows and sources without a url', async () => {
    const user = userEvent.setup();
    const onSourceOpen = vi.fn();
    render(<SourceList sources={sources} max={4} onSourceOpen={onSourceOpen} />);
    const first = screen.getAllByRole('link')[0]!;
    first.addEventListener('click', (e) => e.preventDefault());
    await user.click(first);
    expect(onSourceOpen).toHaveBeenLastCalledWith(sources[0]);
    await user.click(screen.getByRole('button', { name: /Uploaded brief\.pdf/ }));
    expect(onSourceOpen).toHaveBeenLastCalledWith(sources[3]);
    await user.click(screen.getByRole('button', { name: '+1 more' }));
    await user.click(screen.getByRole('button', { name: 'Uploaded brief.pdf' }));
    expect(onSourceOpen).toHaveBeenLastCalledWith(sources[3]);
    expect(onSourceOpen).toHaveBeenCalledTimes(3);
  });

  it('supports controlled expansion, custom labels, className, ref and renders nothing when empty', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender, container } = render(
      <SourceList
        ref={ref}
        sources={sources}
        expanded
        className="custom"
        labels={{ title: 'Viri', less: 'Manj', more: (n, total) => `+${n} od ${total}` }}
      />,
    );
    const group = screen.getByRole('group', { name: 'Viri' });
    expect(ref.current).toBe(group);
    expect(group).toHaveClass('st-source-list', 'custom');
    expect(group).toHaveAttribute('data-state', 'expanded');
    expect(screen.getByRole('button', { name: 'Manj' })).toBeInTheDocument();
    rerender(
      <SourceList
        sources={sources}
        expanded={false}
        labels={{ more: (n, total) => `+${n} od ${total}` }}
      />,
    );
    expect(screen.getByRole('button', { name: '+2 od 5' })).toBeInTheDocument();
    rerender(<SourceList sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SourceList sources={sources} />
        <SourceList sources={sources} variant="list" max={2} />
        <SourceList sources={sources} defaultExpanded />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
