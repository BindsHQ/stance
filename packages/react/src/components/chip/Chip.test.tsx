import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Chip } from './Chip';

describe('Chip', () => {
  it('toggles aria-pressed uncontrolled with mouse and keyboard', async () => {
    render(<Chip>Pending</Chip>);
    const chip = screen.getByRole('button', { name: 'Pending' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard(' ');
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('is controllable', async () => {
    const onSelectedChange = vi.fn();
    const { rerender } = render(
      <Chip selected={false} onSelectedChange={onSelectedChange}>
        Signed
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    rerender(
      <Chip selected onSelectedChange={onSelectedChange}>
        Signed
      </Chip>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not toggle when disabled', async () => {
    render(<Chip disabled>Archived</Chip>);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Chip defaultSelected>Active</Chip>
        <Chip>Draft</Chip>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
