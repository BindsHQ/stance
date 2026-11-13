import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import type { GenerationStatus } from '../../internal/generation-status';
import { RewriteMenu, type RewriteMenuAction } from './RewriteMenu';

const actions: RewriteMenuAction[] = [
  { id: 'improve', label: 'Improve writing' },
  { id: 'shorten', label: 'Make shorter' },
  {
    id: 'tone',
    label: 'Change tone',
    children: [
      { id: 'formal', label: 'Formal' },
      { id: 'friendly', label: 'Friendly' },
    ],
  },
];

function Harness(props: Partial<React.ComponentProps<typeof RewriteMenu>>) {
  const [open, setOpen] = React.useState(false);
  const anchor = React.useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <textarea ref={anchor} aria-label="Draft" defaultValue="We regret the delay." />
      <button onClick={() => setOpen(true)}>Rewrite selection</button>
      <RewriteMenu
        open={open}
        onOpenChange={setOpen}
        anchor={anchor}
        actions={actions}
        {...props}
      />
    </>
  );
}

describe('RewriteMenu', () => {
  it('renders nothing while closed', () => {
    render(<RewriteMenu actions={actions} />);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a named menu with the actions and a custom instruction item', async () => {
    render(<RewriteMenu defaultOpen actions={actions} />);
    const menu = screen.getByRole('menu', { name: 'Rewrite' });
    const items = within(menu).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Improve writing',
      'Make shorter',
      'Change tone',
      'Custom instruction',
    ]);
    expect(within(menu).getByRole('menuitem', { name: 'Change tone' })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    );
    await waitFor(() => expect(items[0]).toHaveFocus());
  });

  it('uses the default actions when none are passed and can hide the custom item', () => {
    render(<RewriteMenu defaultOpen allowCustom={false} />);
    const names = screen.getAllByRole('menuitem').map((item) => item.textContent);
    expect(names).toEqual([
      'Improve writing',
      'Make shorter',
      'Make longer',
      'Change tone',
      'Translate',
    ]);
  });

  it('reports the chosen action and closes when no rewrite follows', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <RewriteMenu defaultOpen actions={actions} onAction={onAction} onOpenChange={onOpenChange} />,
    );
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onAction).toHaveBeenCalledWith(actions[1], undefined);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('opens a submenu with the arrow keys and reports the parent', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<RewriteMenu defaultOpen actions={actions} onAction={onAction} />);
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Improve writing' })).toHaveFocus(),
    );
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
    const formal = await screen.findByRole('menuitem', { name: 'Formal' });
    await waitFor(() => expect(formal).toHaveFocus());
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onAction).toHaveBeenCalledWith(actions[2]!.children![1], actions[2]);
  });

  it('stays open for the preview when a rewrite follows, then replaces', async () => {
    const user = userEvent.setup();
    const onAcceptPreview = vi.fn();
    function Flow() {
      const [status, setStatus] = React.useState<GenerationStatus>('idle');
      const [preview, setPreview] = React.useState<string | undefined>();
      return (
        <>
          <Harness
            status={status}
            preview={preview}
            onAction={() => setStatus('submitted')}
            onAcceptPreview={() => {
              onAcceptPreview();
              setStatus('idle');
              setPreview(undefined);
            }}
          />
          <button
            onClick={() => {
              setStatus('complete');
              setPreview('Sorry for the delay.');
            }}
          >
            Finish
          </button>
        </>
      );
    }
    render(<Flow />);
    await user.click(screen.getByRole('button', { name: 'Rewrite selection' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Make shorter' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rewrite' });
    expect(screen.queryByRole('menu')).toBeNull();
    const region = within(dialog).getByRole('region', { name: 'Suggested rewrite' });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(within(region).getByRole('status')).toHaveTextContent('Rewriting');
    expect(within(dialog).getByRole('button', { name: 'Replace' })).toBeDisabled();
    await act(async () => {
      screen.getByRole('button', { name: 'Finish' }).click();
    });
    expect(region).not.toHaveAttribute('aria-busy');
    expect(region).toHaveTextContent('Sorry for the delay.');
    await user.click(within(dialog).getByRole('button', { name: 'Replace' }));
    expect(onAcceptPreview).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('discards the preview with the button and with Escape', async () => {
    const user = userEvent.setup();
    const onDiscardPreview = vi.fn();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <RewriteMenu
        open
        onOpenChange={onOpenChange}
        status="complete"
        preview="Sorry for the delay."
        onDiscardPreview={onDiscardPreview}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onDiscardPreview).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    rerender(
      <RewriteMenu
        open
        onOpenChange={onOpenChange}
        status="streaming"
        preview="Sorry"
        onDiscardPreview={onDiscardPreview}
      />,
    );
    await user.keyboard('{Escape}');
    expect(onDiscardPreview).toHaveBeenCalledTimes(2);
  });

  it('states errors and early stops in the preview', () => {
    const { rerender } = render(<RewriteMenu open status="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('The rewrite could not be made');
    expect(screen.getByRole('button', { name: 'Replace' })).toBeDisabled();
    rerender(<RewriteMenu open status="stopped" preview="Sorry for" />);
    expect(screen.getByText('Rewrite stopped early')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Replace' })).toBeEnabled();
  });

  it('takes a custom instruction and can go back to the menu', async () => {
    const user = userEvent.setup();
    const onCustomSubmit = vi.fn();
    render(<RewriteMenu defaultOpen actions={actions} onCustomSubmit={onCustomSubmit} />);
    await user.click(screen.getByRole('menuitem', { name: 'Custom instruction' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rewrite' });
    const input = within(dialog).getByRole('textbox', { name: 'Custom instruction' });
    await waitFor(() => expect(input).toHaveFocus());
    expect(within(dialog).getByRole('button', { name: 'Rewrite' })).toBeDisabled();
    await user.click(within(dialog).getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Custom instruction' }));
    await user.type(await screen.findByRole('textbox'), '  Sound warmer {Enter}');
    expect(onCustomSubmit).toHaveBeenCalledWith('Sound warmer');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes with Escape and returns focus to where it was', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Rewrite selection' });
    await user.click(opener);
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Improve writing' })).toHaveFocus(),
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('accepts an element, a ref or a rectangle as the anchor', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const { rerender, container } = render(<RewriteMenu open anchor={element} actions={actions} />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(container.querySelector('.st-rewrite-menu__anchor')).toBeNull();
    const range = { getBoundingClientRect: () => ({ left: 40, top: 60, width: 120, height: 18 }) };
    rerender(<RewriteMenu open anchor={range} actions={actions} />);
    const stand = container.querySelector('.st-rewrite-menu__anchor') as HTMLElement;
    expect(stand.style.left).toBe('40px');
    expect(stand.style.top).toBe('60px');
    expect(stand.style.width).toBe('120px');
    element.remove();
  });

  it('supports uncontrolled and controlled open state', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<RewriteMenu open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole('menu')).toBeNull();
    rerender(<RewriteMenu open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('honours translated labels, the ref, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender } = render(
      <RewriteMenu
        ref={ref}
        defaultOpen
        actions={actions}
        className="mine"
        id="rewrite"
        labels={{ label: 'Skriv om', custom: 'Egen instruktion' }}
      />,
    );
    expect(ref.current).toBe(screen.getByRole('menu', { name: 'Skriv om' }));
    expect(ref.current).toHaveClass('st-rewrite-menu', 'mine');
    expect(ref.current).toHaveAttribute('id', 'rewrite');
    expect(screen.getByRole('menuitem', { name: 'Egen instruktion' })).toBeInTheDocument();
    rerender(
      <RewriteMenu
        ref={ref}
        open
        status="complete"
        preview="Text"
        className="mine"
        labels={{ replace: 'Ersätt', discard: 'Släng', preview: 'Förslag' }}
      />,
    );
    expect(ref.current).toBe(screen.getByRole('dialog'));
    expect(ref.current).toHaveClass('st-rewrite-menu__panel', 'mine');
    expect(screen.getByRole('region', { name: 'Förslag' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ersätt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Släng' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { rerender } = render(
      <div data-theme={theme}>
        <RewriteMenu defaultOpen actions={actions} />
      </div>,
    );
    await expectNoA11yViolations(document.body);
    rerender(
      <div data-theme={theme}>
        <RewriteMenu open status="complete" preview={<p>Sorry for the delay.</p>} />
      </div>,
    );
    await expectNoA11yViolations(document.body);
  });
});
