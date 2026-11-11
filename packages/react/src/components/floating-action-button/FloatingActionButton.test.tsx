import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Icon } from '../../icons/Icon';
import { FloatingActionButton } from './FloatingActionButton';

describe('FloatingActionButton', () => {
  it('icon-only uses label as accessible name', async () => {
    const fn = vi.fn();
    render(<FloatingActionButton icon={<Icon name="plus" />} label="New signature" onClick={fn} />);
    await userEvent.click(screen.getByRole('button', { name: 'New signature' }));
    expect(fn).toHaveBeenCalled();
  });
  it('extended shows visible label', () => {
    render(
      <FloatingActionButton
        icon={<Icon name="plus" />}
        label="New contract"
        extended
        position="static"
      />,
    );
    expect(screen.getByRole('button', { name: 'New contract' })).not.toHaveAttribute('aria-label');
  });
  it.each(THEMES)('axe clean in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <FloatingActionButton icon={<Icon name="plus" />} label="Create" position="static" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
