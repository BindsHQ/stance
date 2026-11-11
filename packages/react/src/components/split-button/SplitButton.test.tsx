import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { DropdownMenuItem } from '../dropdown-menu/DropdownMenu';
import { SplitButton } from './SplitButton';

describe('SplitButton', () => {
  const setup = (props: Partial<React.ComponentProps<typeof SplitButton>> = {}) => {
    const onClick = vi.fn();
    const onSchedule = vi.fn();
    render(
      <SplitButton
        onClick={onClick}
        menu={
          <>
            <DropdownMenuItem onSelect={onSchedule}>Schedule deployment</DropdownMenuItem>
            <DropdownMenuItem>Deploy to selected users</DropdownMenuItem>
          </>
        }
        {...props}
      >
        Deploy signatures
      </SplitButton>,
    );
    return { onClick, onSchedule };
  };

  it('runs the primary action', async () => {
    const { onClick } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Deploy signatures' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('opens the secondary menu from a labelled toggle', async () => {
    const { onSchedule, onClick } = setup();
    const toggle = screen.getByRole('button', { name: 'More options' });
    expect(toggle).toHaveAttribute('aria-haspopup', 'menu');
    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Schedule deployment' }));
    expect(onSchedule).toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('disables both halves when disabled', () => {
    setup({ disabled: true });
    expect(screen.getByRole('button', { name: 'Deploy signatures' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More options' })).toBeDisabled();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <SplitButton menu={<DropdownMenuItem>Alt</DropdownMenuItem>}>Save</SplitButton>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
