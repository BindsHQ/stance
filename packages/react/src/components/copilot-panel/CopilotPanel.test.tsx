import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { CopilotPanel } from './CopilotPanel';

const realMatchMedia = window.matchMedia;
function setNarrow(narrow: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: narrow && query.includes('max-width'),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

const composer = <textarea aria-label="Message" />;

function Harness(props: Partial<React.ComponentProps<typeof CopilotPanel>>) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ display: 'flex' }}>
      <main>
        <button onClick={() => setOpen(true)}>Ask the assistant</button>
      </main>
      <CopilotPanel open={open} onOpenChange={setOpen} composer={composer} {...props}>
        <p>How can I help with this invoice?</p>
      </CopilotPanel>
    </div>
  );
}

describe('CopilotPanel', () => {
  it('renders nothing while closed', () => {
    render(<CopilotPanel composer={composer} />);
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a complementary region named by its title on wide screens', () => {
    render(
      <CopilotPanel defaultOpen title="Invoice assistant" composer={composer} width={420}>
        <p>Thread</p>
      </CopilotPanel>,
    );
    const panel = screen.getByRole('complementary', { name: 'Invoice assistant' });
    expect(
      within(panel).getByRole('heading', { level: 2, name: 'Invoice assistant' }),
    ).toBeVisible();
    expect(panel).toHaveAttribute('data-side', 'end');
    expect(panel.style.getPropertyValue('--st-copilot-panel-width')).toBe('420px');
    expect(within(panel).getByText('Thread')).toBeVisible();
    expect(within(panel).getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not take focus when it is open on first render', () => {
    render(<CopilotPanel defaultOpen composer={composer} />);
    expect(document.body).toHaveFocus();
  });

  it('moves focus to the composer on open and returns it on close', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Ask the assistant' });
    await user.click(opener);
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Close assistant' }));
    expect(screen.queryByRole('complementary')).toBeNull();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('opens with the shortcut, focuses the composer, and closes with it again', async () => {
    render(<Harness shortcut="ctrl+j" />);
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
    expect(await screen.findByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus();
    screen.getByRole('button', { name: 'Ask the assistant' }).focus();
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
    await waitFor(() => expect(screen.queryByRole('complementary')).toBeNull());
  });

  it('shows context, header actions and can hide the close button', () => {
    render(
      <CopilotPanel
        defaultOpen
        context={<span>Invoice 204</span>}
        headerActions={<button>New chat</button>}
        showClose={false}
        side="start"
        headingLevel={3}
      />,
    );
    expect(
      within(screen.getByRole('group', { name: 'Context' })).getByText('Invoice 204'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'New chat' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close assistant' })).toBeNull();
    expect(screen.getByRole('complementary')).toHaveAttribute('data-side', 'start');
    expect(screen.getByRole('heading', { level: 3, name: 'Assistant' })).toBeInTheDocument();
  });

  it('is a modal dialog on narrow screens, with focus in the composer and focus return', async () => {
    setNarrow(true);
    const user = userEvent.setup();
    render(<Harness title="Invoice assistant" />);
    const opener = screen.getByRole('button', { name: 'Ask the assistant' });
    await user.click(opener);
    const dialog = await screen.findByRole('dialog', { name: 'Invoice assistant' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('data-modal');
    expect(screen.queryByRole('complementary')).toBeNull();
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('follows the modal prop regardless of width', () => {
    setNarrow(true);
    const { rerender } = render(<CopilotPanel defaultOpen modal="never" />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    setNarrow(false);
    rerender(<CopilotPanel defaultOpen modal="always" />);
    expect(screen.getByRole('dialog', { name: 'Assistant' })).toBeInTheDocument();
  });

  it('supports controlled open state', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<CopilotPanel open onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close assistant' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    rerender(<CopilotPanel open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('honours translated labels, the ref, className and props', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <CopilotPanel
        ref={ref}
        defaultOpen
        className="mine"
        id="copilot"
        labels={{ title: 'Assistent', close: 'Stäng assistenten' }}
      />,
    );
    expect(ref.current).toBe(screen.getByRole('complementary', { name: 'Assistent' }));
    expect(ref.current).toHaveClass('st-copilot-panel', 'mine');
    expect(ref.current).toHaveAttribute('id', 'copilot');
    expect(screen.getByRole('button', { name: 'Stäng assistenten' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { unmount } = render(
      <div data-theme={theme}>
        <CopilotPanel defaultOpen context={<span>Invoice 204</span>} composer={composer}>
          <p>How can I help?</p>
        </CopilotPanel>
      </div>,
    );
    await expectNoA11yViolations(document.body);
    unmount();
    setNarrow(true);
    render(
      <div data-theme={theme}>
        <CopilotPanel defaultOpen composer={composer}>
          <p>How can I help?</p>
        </CopilotPanel>
      </div>,
    );
    await expectNoA11yViolations(document.body);
  });
});
