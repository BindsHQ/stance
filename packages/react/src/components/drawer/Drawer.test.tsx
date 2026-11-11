import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './Drawer';

function Example({ side }: { side?: 'left' | 'right' | 'top' | 'bottom' }) {
  return (
    <Drawer>
      <DrawerTrigger>Filters</DrawerTrigger>
      <DrawerContent side={side} size="lg">
        <DrawerHeader>
          <DrawerTitle>Filter users</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <label>
            Department <input />
          </label>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

describe('Drawer', () => {
  it('opens a modal dialog on the requested edge', async () => {
    render(<Example side="left" />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const dialog = screen.getByRole('dialog', { name: 'Filter users' });
    expect(dialog).toHaveAttribute('data-placement', 'left');
    expect(dialog).toHaveAttribute('data-size', 'lg');
    expect(dialog).toHaveClass('st-drawer');
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('defaults to the right edge and closes on Escape', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-placement', 'right');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has no axe violations', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await expectNoA11yViolations(document.body);
  });
});
