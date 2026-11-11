import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { FilterChip } from '../filter-chip/FilterChip';
import { FilterBar } from './FilterBar';

function Example({ onClearAll = vi.fn() }: { onClearAll?: () => void }) {
  const [q, setQ] = React.useState('');
  return (
    <FilterBar
      search={{ value: q, onChange: setQ, label: 'Search users', placeholder: 'Name or email' }}
      onClearAll={onClearAll}
      resultCount={q ? 1 : 48}
    >
      <FilterChip label="Department" value="Sales" onClear={() => {}} />
    </FilterBar>
  );
}

describe('FilterBar', () => {
  it('groups filters under a label with search and results status', async () => {
    render(<Example />);
    expect(screen.getByRole('group', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('48 results');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search users' }), 'ada');
    expect(screen.getByRole('status')).toHaveTextContent('1 result');
  });

  it('clears all', async () => {
    const onClearAll = vi.fn();
    render(<Example onClearAll={onClearAll} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('hides Clear all when nothing is active', () => {
    render(<FilterBar onClearAll={() => {}} canClear={false} />);
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Example />);
    await expectNoA11yViolations(container);
  });
});
