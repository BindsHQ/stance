import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './AlertDialog';

function Example({ onAction }: { onAction?: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Delete template</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “Sales signature”?</AlertDialogTitle>
          <AlertDialogDescription>32 people use this template.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onAction}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe('AlertDialog', () => {
  it('uses role alertdialog and focuses Cancel first', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete template' }));
    const dialog = screen.getByRole('alertdialog', { name: /Delete “Sales signature”/ });
    expect(dialog).toHaveAccessibleDescription('32 people use this template.');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('does not close on outside click but closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Delete template' }));
    await new Promise((r) => setTimeout(r, 5));
    await user.click(document.querySelector('.st-scrim')!);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('runs the action and closes', async () => {
    const onAction = vi.fn();
    render(<Example onAction={onAction} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete template' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('has no axe violations', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete template' }));
    await expectNoA11yViolations(document.body);
  });
});
