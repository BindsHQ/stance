import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders a removable tag with a labelled remove button', async () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Marketing</Tag>);
    const button = screen.getByRole('button', { name: 'Remove Marketing' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('uses removeLabel for non-text children and disables removal', () => {
    render(
      <Tag onRemove={() => {}} removeLabel="Remove London office" disabled>
        <b>London</b>
      </Tag>,
    );
    expect(screen.getByRole('button', { name: 'Remove London office' })).toBeDisabled();
  });

  it('is static without onRemove', () => {
    render(<Tag>Finance</Tag>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <Tag onRemove={() => {}}>Sales</Tag>
        <Tag size="sm">EU</Tag>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
