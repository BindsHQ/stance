import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { getPaginationRange, Pagination } from './Pagination';

describe('getPaginationRange', () => {
  it('shows every page when they fit', () => {
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getPaginationRange(1, 0)).toEqual([]);
  });
  it('inserts ellipses with a stable length', () => {
    expect(getPaginationRange(1, 20)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
    expect(getPaginationRange(10, 20)).toEqual([
      1,
      'start-ellipsis',
      9,
      10,
      11,
      'end-ellipsis',
      20,
    ]);
    expect(getPaginationRange(20, 20)).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
    expect(getPaginationRange(4, 20)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
    expect(getPaginationRange(5, 20)).toEqual([1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', 20]);
    for (let p = 1; p <= 20; p++) expect(getPaginationRange(p, 20)).toHaveLength(7);
  });
  it('honours sibling and boundary counts', () => {
    expect(getPaginationRange(10, 20, 2, 2)).toEqual([
      1,
      2,
      'start-ellipsis',
      8,
      9,
      10,
      11,
      12,
      'end-ellipsis',
      19,
      20,
    ]);
    expect(getPaginationRange(10, 20, 0, 1)).toEqual([1, 'start-ellipsis', 10, 'end-ellipsis', 20]);
  });
});

describe('Pagination', () => {
  it('renders a labelled nav with the current page marked', () => {
    render(<Pagination page={3} pageCount={10} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange and disables prev/next at the ends', async () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination page={1} pageCount={10} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Page 10' }));
    expect(onPageChange.mock.calls).toEqual([[2], [10]]);
    rerender(<Pagination page={10} pageCount={10} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('renders links when getHref is provided', () => {
    render(<Pagination page={2} pageCount={4} getHref={(p) => `?page=${p}`} />);
    expect(screen.getByRole('link', { name: 'Page 3' })).toHaveAttribute('href', '?page=3');
    expect(screen.getByRole('link', { name: 'Previous page' })).toHaveAttribute('href', '?page=1');
  });

  it('shows a compact summary', () => {
    render(<Pagination page={3} pageCount={12} variant="compact" />);
    expect(screen.getByText('Page 3 of 12')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page 3' })).toBeNull();
  });

  it('accepts translated labels', () => {
    render(
      <Pagination page={1} pageCount={3} labels={{ nav: 'Seiten', page: (p) => `Seite ${p}` }} />,
    );
    expect(screen.getByRole('navigation', { name: 'Seiten' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seite 2' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Pagination page={6} pageCount={20} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
