import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './Sheet';

function Example() {
  return (
    <Sheet>
      <SheetTrigger>Share</SheetTrigger>
      <SheetContent dismissThreshold={100}>
        <SheetHeader>
          <SheetTitle>Share signature</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <button type="button">Copy link</button>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

describe('Sheet', () => {
  it('opens as a bottom dialog with a drag handle', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    const dialog = screen.getByRole('dialog', { name: 'Share signature' });
    expect(dialog).toHaveAttribute('data-placement', 'bottom');
    expect(dialog.querySelector('[data-sheet-handle]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('dismisses when dragged past the threshold', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    const handle = document.querySelector('[data-sheet-handle]')!;
    fireEvent.pointerDown(handle, { button: 0, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 260, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 260, pointerId: 1 });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('snaps back for a short drag', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    const handle = document.querySelector('[data-sheet-handle]')!;
    fireEvent.pointerDown(handle, { button: 0, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 110, pointerId: 1 });
    await new Promise((r) => setTimeout(r, 120));
    fireEvent.pointerUp(handle, { clientY: 110, pointerId: 1 });
    const dialog = screen.getByRole('dialog');
    expect(dialog.style.transform).toBe('');
  });

  it('has no axe violations', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    await expectNoA11yViolations(document.body);
  });
});
