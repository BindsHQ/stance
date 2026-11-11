import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { FilterChip } from './FilterChip';

describe('FilterChip', () => {
  it('shows an inactive filter and opens its editor', async () => {
    render(
      <FilterChip label="Status">
        <label>
          <input type="checkbox" /> Signed
        </label>
      </FilterChip>,
    );
    const trigger = screen.getByRole('button', { name: 'Status' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Status filter' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Signed' })).toBeInTheDocument();
  });

  it('summarises the active value and clears it', async () => {
    const onClear = vi.fn();
    render(<FilterChip label="Status" value="Signed, Pending" onClear={onClear} />);
    expect(screen.getByRole('button', { name: /^Status: ?Signed, Pending$/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear Status filter' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('hides the clear button when inactive', () => {
    render(<FilterChip label="Owner" onClear={() => {}} />);
    expect(screen.queryByRole('button', { name: /Clear/ })).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(<FilterChip label="Status" value="Signed" onClear={() => {}} />);
    await expectNoA11yViolations(container);
  });
});
