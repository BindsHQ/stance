import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { PromptComposer } from './PromptComposer';

describe('PromptComposer', () => {
  it('renders a labelled form with a labelled text area and a disabled Send button', () => {
    render(<PromptComposer placeholder="Ask anything" />);
    const form = screen.getByRole('form', { name: 'Message' });
    expect(form).toHaveAttribute('data-state', 'empty');
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute(
      'placeholder',
      'Ask anything',
    );
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('enables Send once there is text and treats whitespace as empty', async () => {
    const user = userEvent.setup();
    render(<PromptComposer />);
    const input = screen.getByRole('textbox');
    await user.type(input, '   ');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await user.type(input, 'Hello');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    expect(screen.getByRole('form')).toHaveAttribute('data-state', 'ready');
  });

  it('submits with Enter and clears an uncontrolled draft', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptComposer onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'Summarise this contract{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('Summarise this contract');
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('adds a line with Shift Enter and does not submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptComposer onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'One{Shift>}{Enter}{/Shift}Two');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveValue('One\nTwo');
  });

  it('does not submit an empty draft with Enter', async () => {
    const onSubmit = vi.fn();
    render(<PromptComposer onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('textbox'), '{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits with the Send button', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptComposer onSubmit={onSubmit} defaultValue="Draft" />);
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith('Draft');
  });

  it('needs Ctrl or Cmd Enter when submitOnEnter is off', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptComposer onSubmit={onSubmit} submitOnEnter={false} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'One{Enter}Two');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveValue('One\nTwo');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith('One\nTwo');
  });

  it('ignores Enter while an input method is composing', () => {
    const onSubmit = vi.fn();
    render(<PromptComposer onSubmit={onSubmit} defaultValue="にほん" />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('lets a handler in textareaProps claim Enter before the composer', async () => {
    const onSubmit = vi.fn();
    render(
      <PromptComposer
        onSubmit={onSubmit}
        defaultValue="@ad"
        textareaProps={{ onKeyDown: (event) => event.preventDefault() }}
      />,
    );
    await userEvent.type(screen.getByRole('textbox'), '{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('turns Send into Stop while streaming and keeps focus on the same button', async () => {
    const onStop = vi.fn();
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <PromptComposer defaultValue="Hello" onSubmit={onSubmit} onStop={onStop} />,
    );
    const send = screen.getByRole('button', { name: 'Send' });
    send.focus();
    rerender(
      <PromptComposer
        defaultValue="Hello"
        status="submitted"
        onSubmit={onSubmit}
        onStop={onStop}
      />,
    );
    expect(screen.getByRole('form')).toHaveAttribute('data-state', 'submitted');
    rerender(
      <PromptComposer
        defaultValue="Hello"
        status="streaming"
        onSubmit={onSubmit}
        onStop={onStop}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
    const stop = screen.getByRole('button', { name: 'Stop' });
    expect(stop).toBe(send);
    expect(stop).toHaveFocus();
    expect(stop).toHaveAttribute('type', 'button');
    expect(screen.getByRole('form')).toHaveAttribute('data-state', 'streaming');
    await user.click(stop);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the draft editable but does not submit with Enter while busy', async () => {
    const onSubmit = vi.fn();
    render(<PromptComposer status="streaming" onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Next question{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveValue('Next question');
  });

  it('works controlled and asks to clear after submit', async () => {
    const onSubmit = vi.fn();
    const changes: string[] = [];
    function Controlled() {
      const [value, setValue] = React.useState('');
      return (
        <PromptComposer
          value={value}
          onValueChange={(next) => {
            changes.push(next);
            setValue(next);
          }}
          onSubmit={onSubmit}
        />
      );
    }
    render(<Controlled />);
    await userEvent.type(screen.getByRole('textbox'), 'Hi{Enter}');
    expect(changes).toEqual(['H', 'Hi', '']);
    expect(onSubmit).toHaveBeenCalledWith('Hi');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('does not change a controlled value the parent does not update', async () => {
    render(<PromptComposer value="Fixed" />);
    await userEvent.type(screen.getByRole('textbox'), 'abc');
    expect(screen.getByRole('textbox')).toHaveValue('Fixed');
  });

  it('disables typing and sending when disabled', async () => {
    const onSubmit = vi.fn();
    render(<PromptComposer disabled defaultValue="Hello" onSubmit={onSubmit} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByRole('form')).toHaveAttribute('data-state', 'disabled');
    fireEvent.submit(screen.getByRole('form'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders the header, leading, trailing and footer slots', () => {
    render(
      <PromptComposer
        header={<span>Header slot</span>}
        leading={<button type="button">Attach</button>}
        trailing={<button type="button">Voice</button>}
        footer={<span>Footer slot</span>}
      />,
    );
    expect(screen.getByText('Header slot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voice' })).toBeInTheDocument();
    expect(screen.getByText('Footer slot')).toBeInTheDocument();
  });

  it('exposes the form and text area refs, labels and textareaProps', () => {
    const formRef = React.createRef<HTMLFormElement>();
    const textareaRef = React.createRef<HTMLTextAreaElement>();
    render(
      <PromptComposer
        ref={formRef}
        textareaRef={textareaRef}
        className="mine"
        data-testid="composer"
        labels={{ form: 'Nachricht', input: 'Nachricht schreiben', send: 'Senden' }}
        textareaProps={{
          name: 'prompt',
          'aria-controls': 'mentions',
          'aria-activedescendant': 'mentions-option-1',
          'aria-expanded': true,
        }}
      />,
    );
    expect(formRef.current).toBe(screen.getByTestId('composer'));
    expect(formRef.current).toHaveClass('st-prompt-composer', 'mine');
    expect(formRef.current).toHaveAccessibleName('Nachricht');
    const input = screen.getByLabelText('Nachricht schreiben');
    expect(textareaRef.current).toBe(input);
    expect(input).toHaveAttribute('name', 'prompt');
    expect(input).toHaveAttribute('aria-controls', 'mentions');
    expect(input).toHaveAttribute('aria-activedescendant', 'mentions-option-1');
    expect(screen.getByRole('button', { name: 'Senden' })).toBeInTheDocument();
  });

  it('caps the height at maxRows and scrolls beyond it', () => {
    const scrollHeight = vi
      .spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(400);
    const computed = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: '20px',
      fontSize: '14px',
      paddingTop: '4px',
      paddingBottom: '4px',
      borderTopWidth: '0px',
      borderBottomWidth: '0px',
    } as CSSStyleDeclaration);
    const { rerender } = render(<PromptComposer defaultValue="Long text" maxRows={4} />);
    const input = screen.getByRole('textbox');
    expect(input.style.height).toBe('88px');
    expect(input.style.overflowY).toBe('auto');
    scrollHeight.mockReturnValue(48);
    rerender(<PromptComposer defaultValue="Long text" maxRows={5} />);
    expect(input.style.height).toBe('48px');
    expect(input.style.overflowY).toBe('hidden');
    scrollHeight.mockRestore();
    computed.mockRestore();
  });

  it('focuses the text area when the empty part of the box is clicked', async () => {
    const { container } = render(<PromptComposer />);
    await userEvent.click(container.querySelector('.st-prompt-composer__toolbar')!);
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <PromptComposer placeholder="Ask anything" footer={<span>Check important facts.</span>} />
        <PromptComposer
          labels={{ form: 'Reply', input: 'Reply' }}
          status="streaming"
          defaultValue="Hello"
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
