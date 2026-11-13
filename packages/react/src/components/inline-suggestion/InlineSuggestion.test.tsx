import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations, THEMES } from '../../../test/a11y';
import { Input } from '../input/Input';
import { InlineSuggestion, splitSuggestionWord } from './InlineSuggestion';

const ghost = (container: HTMLElement) =>
  container.querySelector('.st-inline-suggestion__text') as HTMLElement | null;
const announcer = (container: HTMLElement) => container.querySelector('[data-st-announcer]')!;
const label = { 'aria-label': 'Reply' };

describe('InlineSuggestion', () => {
  it('draws the suggestion after the typed text without touching the field value', () => {
    const { container } = render(
      <InlineSuggestion value="Thanks for" suggestion=" your patience" fieldProps={label} />,
    );
    const field = screen.getByRole('textbox', { name: 'Reply' });
    expect(field).toHaveValue('Thanks for');
    expect(ghost(container)).toHaveTextContent('your patience');
    expect(container.querySelector('.st-inline-suggestion__typed')!.textContent).toBe('Thanks for');
    expect(container.querySelector('.st-inline-suggestion__ghost')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(container.firstElementChild).toHaveAttribute('data-suggesting');
  });

  it('shows nothing without a suggestion', () => {
    const { container } = render(<InlineSuggestion value="Thanks" fieldProps={label} />);
    expect(container.querySelector('.st-inline-suggestion__ghost')).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute('data-suggesting');
  });

  it('Tab accepts the whole suggestion and keeps focus in the field', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onValueChange = vi.fn();
    render(
      <>
        <InlineSuggestion
          value="Thanks for"
          suggestion=" your patience"
          onAccept={onAccept}
          onValueChange={onValueChange}
          fieldProps={label}
        />
        <button>Next</button>
      </>,
    );
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Tab}');
    expect(onAccept).toHaveBeenCalledWith(' your patience');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('textbox')).toHaveValue('Thanks for');
  });

  it('Tab moves focus as usual when there is no suggestion, and Shift Tab always does', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const { rerender } = render(
      <>
        <button>Before</button>
        <InlineSuggestion value="Thanks" onAccept={onAccept} fieldProps={label} />
        <button>Next</button>
      </>,
    );
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Tab}');
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    rerender(
      <>
        <button>Before</button>
        <InlineSuggestion
          value="Thanks"
          suggestion=" a lot"
          onAccept={onAccept}
          fieldProps={label}
        />
        <button>Next</button>
      </>,
    );
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('Ctrl or Cmd plus Right accepts one word', async () => {
    const user = userEvent.setup();
    const onAcceptWord = vi.fn();
    render(
      <InlineSuggestion
        value="Thanks for"
        suggestion=" your patience"
        onAcceptWord={onAcceptWord}
        fieldProps={label}
      />,
    );
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Control>}{ArrowRight}{/Control}');
    expect(onAcceptWord).toHaveBeenLastCalledWith(' your', ' patience');
    await user.keyboard('{Meta>}{ArrowRight}{/Meta}');
    expect(onAcceptWord).toHaveBeenCalledTimes(2);
    await user.keyboard('{ArrowRight}');
    expect(onAcceptWord).toHaveBeenCalledTimes(2);
  });

  it('uses the forward arrow in right to left text', async () => {
    const user = userEvent.setup();
    const onAcceptWord = vi.fn();
    render(
      <div dir="rtl">
        <InlineSuggestion
          value="شكرا"
          suggestion=" على صبرك"
          onAcceptWord={onAcceptWord}
          fieldProps={label}
        />
      </div>,
    );
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Control>}{ArrowRight}{/Control}');
    expect(onAcceptWord).not.toHaveBeenCalled();
    await user.keyboard('{Control>}{ArrowLeft}{/Control}');
    expect(onAcceptWord).toHaveBeenCalledWith(' على', ' صبرك');
  });

  it('splits words with the space before them', () => {
    expect(splitSuggestionWord(' your patience')).toEqual([' your', ' patience']);
    expect(splitSuggestionWord('ience today')).toEqual(['ience', ' today']);
    expect(splitSuggestionWord('last')).toEqual(['last', '']);
    expect(splitSuggestionWord('  ')).toEqual(['  ', '']);
  });

  it('Escape dismisses until the suggestion changes', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const onAccept = vi.fn();
    const { container, rerender } = render(
      <InlineSuggestion
        value="Thanks for"
        suggestion=" your patience"
        onDismiss={onDismiss}
        onAccept={onAccept}
        fieldProps={label}
      />,
    );
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(ghost(container)).toBeNull();
    await user.keyboard('{Tab}');
    expect(onAccept).not.toHaveBeenCalled();
    rerender(
      <InlineSuggestion
        value="Thanks for"
        suggestion=" waiting"
        onDismiss={onDismiss}
        onAccept={onAccept}
        fieldProps={label}
      />,
    );
    expect(ghost(container)).toHaveTextContent('waiting');
  });

  it('is safe with input methods: hides while composing and ignores its keys', async () => {
    const onAccept = vi.fn();
    const onDismiss = vi.fn();
    const { container } = render(
      <InlineSuggestion
        value="こん"
        suggestion="にちは"
        onAccept={onAccept}
        onDismiss={onDismiss}
        fieldProps={label}
      />,
    );
    const field = screen.getByRole('textbox');
    field.focus();
    fireEvent.compositionStart(field);
    expect(ghost(container)).toBeNull();
    fireEvent.keyDown(field, { key: 'Tab' });
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(onAccept).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.compositionEnd(field);
    expect(ghost(container)).toHaveTextContent('にちは');
    fireEvent.keyDown(field, { key: 'Tab', isComposing: true });
    fireEvent.keyDown(field, { key: 'Tab', keyCode: 229 });
    expect(onAccept).not.toHaveBeenCalled();
    fireEvent.keyDown(field, { key: 'Tab' });
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('hides while the caret is not at the end of the text', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <InlineSuggestion value="Thanks for" suggestion=" your patience" fieldProps={label} />,
    );
    const field = screen.getByRole('textbox') as HTMLInputElement;
    await user.click(field);
    field.setSelectionRange(2, 2);
    fireEvent.select(field);
    expect(ghost(container)).toBeNull();
    field.setSelectionRange(10, 10);
    fireEvent.select(field);
    expect(ghost(container)).not.toBeNull();
  });

  it('announces the suggestion once with how to accept it, only when focused', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <InlineSuggestion value="Thanks for" suggestion=" your patience" fieldProps={label} />,
    );
    expect(announcer(container)).toBeEmptyDOMElement();
    await user.click(screen.getByRole('textbox'));
    expect(announcer(container)).toHaveTextContent(
      'Suggestion: your patience. Press Tab to accept, Escape to dismiss.',
    );
    const first = announcer(container).textContent;
    // Typing through the suggestion keeps the same full text and stays quiet.
    rerender(
      <InlineSuggestion value="Thanks for y" suggestion="our patience" fieldProps={label} />,
    );
    expect(announcer(container).textContent).toBe(first);
    rerender(<InlineSuggestion value="Thanks for y" suggestion="ou" fieldProps={label} />);
    expect(announcer(container)).toHaveTextContent('Suggestion: ou.');
  });

  it('shows a quiet mark while loading and the accept key as a hint', () => {
    const { container, rerender } = render(
      <InlineSuggestion value="Thanks" loading fieldProps={label} />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-loading');
    expect(container.querySelector('.st-inline-suggestion__pending')).not.toBeNull();
    rerender(
      <InlineSuggestion
        value="Thanks"
        suggestion=" a lot"
        onAccept={() => {}}
        fieldProps={label}
      />,
    );
    expect(container.querySelector('.st-inline-suggestion__hint')).toHaveTextContent('Tab');
    rerender(
      <InlineSuggestion
        value="Thanks"
        suggestion=" a lot"
        onAccept={() => {}}
        showHint={false}
        fieldProps={label}
      />,
    );
    expect(container.querySelector('.st-inline-suggestion__hint')).toBeNull();
  });

  it('accepts from the hint by pointer', async () => {
    const onAccept = vi.fn();
    const { container } = render(
      <InlineSuggestion
        value="Thanks"
        suggestion=" a lot"
        onAccept={onAccept}
        fieldProps={label}
      />,
    );
    await userEvent.click(container.querySelector('.st-inline-suggestion__hint')!);
    expect(onAccept).toHaveBeenCalledWith(' a lot');
  });

  it('wraps a field passed as a child and keeps its own handlers', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onKeyDown = vi.fn();
    const fieldRef = React.createRef<HTMLInputElement | HTMLTextAreaElement>();
    function Example() {
      const [value, setValue] = React.useState('Dear');
      return (
        <InlineSuggestion
          value={value}
          suggestion=" customer"
          fieldRef={fieldRef}
          onAccept={(text) => {
            onAccept(text);
            setValue((v) => v + text);
          }}
        >
          <Input
            aria-label="Greeting"
            value={value}
            onKeyDown={onKeyDown}
            onChange={(e) => setValue(e.target.value)}
          />
        </InlineSuggestion>
      );
    }
    render(<Example />);
    const field = screen.getByRole('textbox', { name: 'Greeting' });
    expect(fieldRef.current).toBe(field);
    await user.click(field);
    await user.keyboard('{Tab}');
    expect(onKeyDown).toHaveBeenCalled();
    expect(onAccept).toHaveBeenCalledWith(' customer');
    expect(field).toHaveValue('Dear customer');
  });

  it('leaves a key alone when the field already handled it', async () => {
    const onAccept = vi.fn();
    render(
      <InlineSuggestion value="a" suggestion="b" onAccept={onAccept}>
        <input aria-label="Own" value="a" readOnly onKeyDown={(e) => e.preventDefault()} />
      </InlineSuggestion>,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Tab' });
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('renders a text area when multiline and reports edits', async () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <InlineSuggestion
        multiline
        value="Hello"
        suggestion=" there"
        onValueChange={onValueChange}
        placeholder="Write a reply"
        fieldProps={{ ...label, rows: 3 }}
      />,
    );
    const field = screen.getByRole('textbox', { name: 'Reply' });
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveAttribute('placeholder', 'Write a reply');
    expect(container.querySelector('.st-inline-suggestion__ghost')).toHaveAttribute(
      'data-multiline',
    );
    await userEvent.type(field, '!');
    expect(onValueChange).toHaveBeenLastCalledWith('Hello!');
  });

  it('honours translated labels, the ref, className and props', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <InlineSuggestion
        ref={ref}
        className="mine"
        id="ghost"
        value="Tack"
        suggestion=" för hjälpen"
        onAccept={() => {}}
        disabled
        fieldProps={label}
        labels={{ announce: (s) => `Förslag: ${s}`, acceptKey: 'Tabb' }}
      />,
    );
    expect(ref.current).toHaveClass('st-inline-suggestion', 'mine');
    expect(ref.current).toHaveAttribute('id', 'ghost');
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(container.querySelector('.st-inline-suggestion__hint')).toHaveTextContent('Tabb');
  });

  it.each(THEMES)('has no axe violations in %s', async (theme) => {
    const { container } = render(
      <div data-theme={theme}>
        <InlineSuggestion
          value="Thanks for"
          suggestion=" your patience"
          onAccept={() => {}}
          fieldProps={label}
        />
        <InlineSuggestion multiline value="" loading fieldProps={{ 'aria-label': 'Notes' }} />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
