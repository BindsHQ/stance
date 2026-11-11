import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { ConfirmationDialog, ConfirmProvider, useConfirm } from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  it('closes after a resolved async confirm, showing loading meanwhile', async () => {
    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(
      <ConfirmationDialog
        trigger={<button type="button">Remove user</button>}
        title="Remove Ada from Binds?"
        description="They lose access immediately."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove user' }));
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    const confirm = screen.getByRole('button', { name: 'Remove' });
    expect(confirm).toHaveAttribute('data-variant', 'danger');
    await userEvent.click(confirm);
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    resolve();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('stays open and shows the error when confirm rejects', async () => {
    render(
      <ConfirmationDialog
        defaultOpen
        title="Publish template?"
        onConfirm={() => Promise.reject(new Error('Network unavailable'))}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByText('Network unavailable')).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('calls onCancel', async () => {
    const onCancel = vi.fn();
    render(<ConfirmationDialog defaultOpen title="Discard draft?" onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('useConfirm resolves true on confirm and false on cancel', async () => {
    const results: boolean[] = [];
    function Page() {
      const confirm = useConfirm();
      return (
        <button
          type="button"
          onClick={async () =>
            results.push(await confirm({ title: 'Deploy signatures?', confirmLabel: 'Deploy' }))
          }
        >
          Deploy
        </button>
      );
    }
    render(
      <ConfirmProvider>
        <Page />
      </ConfirmProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Deploy' }));
    await user.click(screen.getAllByRole('button', { name: 'Deploy' }).at(-1)!);
    await waitFor(() => expect(results).toEqual([true]));
    await user.click(screen.getByRole('button', { name: 'Deploy' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(results).toEqual([true, false]));
  });

  it('useConfirm throws outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bad() {
      useConfirm();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(/ConfirmProvider/);
    spy.mockRestore();
  });

  it('has no axe violations', async () => {
    render(
      <ConfirmationDialog
        defaultOpen
        title="Leave workspace?"
        description="You can rejoin by invite."
      />,
    );
    await expectNoA11yViolations(document.body);
  });
});
