import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog';

function Example(props: { onOpenChange?: (o: boolean) => void; dismissOnOutsideClick?: boolean }) {
  return (
    <Dialog onOpenChange={props.onOpenChange}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent dismissOnOutsideClick={props.dismissOnOutsideClick}>
        <DialogHeader>
          <DialogTitle>Rename template</DialogTitle>
          <DialogDescription>Names are visible to your organisation.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <label>
            Name <input defaultValue="Default" />
          </label>
        </DialogBody>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <button type="button">Save</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('opens from the trigger with correct ARIA wiring', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Rename template' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Names are visible to your organisation.');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves focus inside and traps Tab', async () => {
    render(<Example />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('textbox')).toHaveFocus();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('textbox')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const onOpenChange = vi.fn();
    render(<Example onOpenChange={onOpenChange} />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes on outside click unless disabled', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await new Promise((r) => setTimeout(r, 5));
    await user.click(document.querySelector('.st-scrim')!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    render(<Example dismissOnOutsideClick={false} />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await new Promise((r) => setTimeout(r, 5));
    await user.click(document.querySelector('.st-scrim')!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('locks body scroll while open', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(document.body.style.overflow).toBe('hidden');
    await userEvent.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');
  });

  it('supports controlled usage', () => {
    const { rerender } = render(
      <Dialog open={false}>
        <DialogContent><DialogTitle>T</DialogTitle></DialogContent>
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(
      <Dialog open>
        <DialogContent><DialogTitle>T</DialogTitle></DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'T' })).toBeInTheDocument();
  });

  it('has no axe violations when open', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await expectNoA11yViolations(document.body);
  });
});
