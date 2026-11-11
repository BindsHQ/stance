import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './Popover';

function Example() {
  return (
    <>
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent aria-label="Filters">
          <button type="button">Apply</button>
          <PopoverClose>Done</PopoverClose>
        </PopoverContent>
      </Popover>
      <button type="button">Outside</button>
    </>
  );
}

describe('Popover', () => {
  it('toggles from the trigger and links aria-controls', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Filters' });
    await userEvent.click(trigger);
    const content = screen.getByRole('dialog', { name: 'Filters' });
    expect(trigger).toHaveAttribute('aria-controls', content.id);
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus();
    await userEvent.click(trigger);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('dismisses on Escape and returns focus', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Filters' });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('dismisses on outside pointer down', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await new Promise((r) => setTimeout(r, 5));
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes via PopoverClose', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has no axe violations', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await expectNoA11yViolations(document.body);
  });
});
