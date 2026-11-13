import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { AskBar, type AskBarSuggestion } from './AskBar';

const suggestions: AskBarSuggestion[] = [
  { id: 'renew', label: 'When does this contract renew?' },
  { id: 'notice', label: 'How much notice do we need to give?' },
  { id: 'owner', label: 'Who owns this account?' },
];

describe('AskBar', () => {
  it('is a search landmark with a combobox and a disabled submit when empty', () => {
    render(<AskBar />);
    const search = screen.getByRole('search', { name: 'Ask anything' });
    const input = within(search).getByRole('combobox', { name: 'Ask anything' });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('placeholder', 'Ask anything');
    expect(within(search).getByRole('button', { name: 'Ask' })).toBeDisabled();
    expect(screen.queryByRole('region', { name: 'Answer' })).toBeNull();
  });

  it('submits the trimmed question with Enter and with the button', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onValueChange = vi.fn();
    render(<AskBar onSubmit={onSubmit} onValueChange={onValueChange} />);
    await user.type(screen.getByRole('combobox'), '  renewal date ');
    expect(onValueChange).toHaveBeenLastCalledWith('  renewal date ');
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith('renewal date');
    await user.click(screen.getByRole('button', { name: 'Ask' }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('does not submit an empty question', async () => {
    const onSubmit = vi.fn();
    render(<AskBar onSubmit={onSubmit} defaultValue="   " />);
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('opens suggestions on focus and moves through them with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<AskBar suggestions={suggestions} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('listbox', { name: 'Suggestions' });
    expect(input).toHaveAttribute('aria-controls', list.id);
    const options = within(list).getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(input).not.toHaveAttribute('aria-activedescendant');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute('aria-activedescendant', options[2]!.id);
    await user.keyboard('{Home}');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
    await user.keyboard('{End}');
    expect(input).toHaveAttribute('aria-activedescendant', options[2]!.id);
    expect(input).toHaveFocus();
  });

  it('chooses a suggestion with Enter and reports it', async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = vi.fn();
    const onSubmit = vi.fn();
    render(
      <AskBar
        suggestions={suggestions}
        onSuggestionSelect={onSuggestionSelect}
        onSubmit={onSubmit}
      />,
    );
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onSuggestionSelect).toHaveBeenCalledWith(suggestions[1]);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveValue('How much notice do we need to give?');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('submits the label of a clicked suggestion when no select handler is given', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AskBar suggestions={suggestions} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Who owns this account?' }));
    expect(onSubmit).toHaveBeenCalledWith('Who owns this account?');
    expect(screen.getByRole('combobox')).toHaveValue('Who owns this account?');
  });

  it('filters suggestions by the typed text unless told not to', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AskBar suggestions={suggestions} />);
    await user.type(screen.getByRole('combobox'), 'notice');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.type(screen.getByRole('combobox'), ' zzz');
    expect(screen.queryByRole('option')).toBeNull();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    rerender(<AskBar suggestions={suggestions} filterSuggestions={false} />);
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('Escape closes the suggestions first, then clears the field', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<AskBar suggestions={suggestions} defaultValue="who" onClear={onClear} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveValue('who');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('ignores keys while an input method is composing', () => {
    const onSubmit = vi.fn();
    render(<AskBar suggestions={suggestions} onSubmit={onSubmit} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true });
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('clears with the clear button and returns focus to the field', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<AskBar defaultValue="renewal" onClear={onClear} />);
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getByRole('combobox')).toHaveFocus();
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('holds the answer back while it streams and releases it when complete', () => {
    const { rerender } = render(<AskBar value="renewal" status="submitted" />);
    const region = screen.getByRole('region', { name: 'Answer' });
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveTextContent('Working on an answer');
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
    rerender(<AskBar value="renewal" status="streaming" answer={<p>It renews</p>} />);
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).not.toHaveTextContent('Working on an answer');
    rerender(<AskBar value="renewal" status="complete" answer={<p>It renews on 30 June.</p>} />);
    expect(region).toHaveAttribute('aria-busy', 'false');
    expect(region).toHaveTextContent('It renews on 30 June.');
  });

  it('turns submit into stop while busy when onStop is given', async () => {
    const onStop = vi.fn();
    render(<AskBar value="renewal" status="streaming" answer="It" onStop={onStop} />);
    expect(screen.queryByRole('button', { name: 'Ask' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('states a stopped answer and an error in words', () => {
    const { rerender } = render(<AskBar status="stopped" answer="It renews" />);
    expect(screen.getByText('Answer stopped early')).toBeVisible();
    rerender(<AskBar status="error" />);
    expect(screen.getByText('Something went wrong. Try again.')).toBeVisible();
  });

  it('focuses the field with the shortcut and shows it as a hint', () => {
    const { container } = render(<AskBar shortcut="ctrl+k" />);
    expect(container.querySelector('.st-ask-bar__shortcut')).toHaveTextContent(/Ctrl\+?K/);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('supports a controlled value', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<AskBar value="a" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByRole('combobox'), 'b');
    expect(onValueChange).toHaveBeenCalledWith('ab');
    expect(screen.getByRole('combobox')).toHaveValue('a');
    rerender(<AskBar value="ab" onValueChange={onValueChange} />);
    expect(screen.getByRole('combobox')).toHaveValue('ab');
  });

  it('disables everything when disabled', () => {
    render(<AskBar disabled defaultValue="x" suggestions={suggestions} shortcut="ctrl+k" />);
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('combobox')).not.toHaveFocus();
  });

  it('honours translated labels, placeholder, refs, className and props', () => {
    const ref = React.createRef<HTMLDivElement>();
    const inputRef = React.createRef<HTMLInputElement>();
    render(
      <AskBar
        ref={ref}
        inputRef={inputRef}
        className="mine"
        id="ask"
        placeholder="Fråga om avtalet"
        labels={{ label: 'Fråga vad som helst', submit: 'Fråga' }}
      />,
    );
    expect(ref.current).toHaveClass('st-ask-bar', 'mine');
    expect(ref.current).toHaveAttribute('id', 'ask');
    expect(ref.current).toHaveAttribute('data-status', 'idle');
    expect(inputRef.current).toBe(screen.getByRole('combobox', { name: 'Fråga vad som helst' }));
    expect(inputRef.current).toHaveAttribute('placeholder', 'Fråga om avtalet');
    expect(screen.getByRole('button', { name: 'Fråga' })).toBeInTheDocument();
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const user = userEvent.setup();
    const { container } = render(
      <div data-theme={theme}>
        <AskBar suggestions={suggestions} />
        <AskBar
          labels={{ label: 'Ask about this page' }}
          defaultValue="renewal"
          status="complete"
          answer={<p>It renews on 30 June.</p>}
          onClear={() => {}}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
    await user.click(screen.getByRole('combobox', { name: 'Ask anything' }));
    await user.keyboard('{ArrowDown}');
    await expectNoA11yViolations(container);
  });
});
