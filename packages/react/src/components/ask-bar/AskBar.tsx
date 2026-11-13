'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { GenerationStatus } from '../../internal/generation-status.js';
import { formatHotkey, useHotkey } from '../../internal/hotkey.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { IconButton } from '../icon-button/IconButton.js';
import { ShimmerText } from '../shimmer-text/ShimmerText.js';

export interface AskBarSuggestion {
  /** Stable id, passed back on select. */
  id: string;
  /** The question or prompt. */
  label: string;
}

export interface AskBarLabels {
  /** Accessible name of the search landmark and the field. Default "Ask anything". */
  label: string;
  /** Placeholder of the field. Default "Ask anything". */
  placeholder: string;
  /** Accessible name of the submit button. Default "Ask". */
  submit: string;
  /** Accessible name of the stop button. Default "Stop". */
  stop: string;
  /** Accessible name of the clear button. Default "Clear". */
  clear: string;
  /** Accessible name of the suggestion list. Default "Suggestions". */
  suggestions: string;
  /** Accessible name of the answer area. Default "Answer". */
  answer: string;
  /** Shown while waiting for the first words. Default "Working on an answer". */
  thinking: string;
  /** Shown when the answer was stopped early. Default "Answer stopped early". */
  stopped: string;
  /** Shown when the request failed. Default "Something went wrong. Try again." */
  error: string;
}

export interface AskBarProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSubmit' | 'onChange' | 'defaultValue'
> {
  /** The question in the field. Controlled. */
  value?: string;
  /** The question on first render when uncontrolled. Default empty. */
  defaultValue?: string;
  /** Called when the question changes. */
  onValueChange?: (value: string) => void;
  /** Called with the trimmed question on Enter or the submit button. */
  onSubmit?: (value: string) => void;
  /** Placeholder of the field. Overrides `labels.placeholder`. */
  placeholder?: string;
  /** Questions to offer under the field. */
  suggestions?: AskBarSuggestion[];
  /** Called when the person chooses a suggestion. Without it, choosing one submits its label. */
  onSuggestionSelect?: (suggestion: AskBarSuggestion) => void;
  /** Hide suggestions that do not contain the typed text. Set false when the server filters. Default true. */
  filterSuggestions?: boolean;
  /** Where the answer is in its life cycle. Default `idle`. */
  status?: GenerationStatus;
  /** The answer, shown under the field. */
  answer?: React.ReactNode;
  /** Called when the person clears the field and the answer. */
  onClear?: () => void;
  /** Called when the person stops an answer in progress. Turns the submit button into stop. */
  onStop?: () => void;
  /** A hotkey that moves focus to the field, for example `mod+k`. Shown as a hint. */
  shortcut?: string;
  /** Disables the field and its buttons. */
  disabled?: boolean;
  /** Ref to the input element. */
  inputRef?: React.Ref<HTMLInputElement>;
  /** Translations for the built in strings. */
  labels?: Partial<AskBarLabels>;
}

/**
 * A single line ask anything bar for a page or a product, with suggestions under the field
 * and an inline answer area. Focus stays in the field while the suggestions are browsed.
 */
export const AskBar = React.forwardRef<HTMLDivElement, AskBarProps>(function AskBar(
  {
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onSubmit,
    placeholder,
    suggestions = [],
    onSuggestionSelect,
    filterSuggestions = true,
    status = 'idle',
    answer,
    onClear,
    onStop,
    shortcut,
    disabled = false,
    inputRef: inputRefProp,
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels: AskBarLabels = {
    label: 'Ask anything',
    placeholder: 'Ask anything',
    submit: 'Ask',
    stop: 'Stop',
    clear: 'Clear',
    suggestions: 'Suggestions',
    answer: 'Answer',
    thinking: 'Working on an answer',
    stopped: 'Answer stopped early',
    error: 'Something went wrong. Try again.',
    ...labelsProp,
  };
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const inputRef = React.useRef<HTMLInputElement>(null);
  const composedInput = useComposedRefs(inputRefProp, inputRef);
  const listId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const [shortcutText, setShortcutText] = React.useState('');

  // The platform decides how the shortcut reads, so it is filled in after mount.
  React.useEffect(() => {
    setShortcutText(shortcut ? formatHotkey(shortcut) : '');
  }, [shortcut]);
  useHotkey(disabled ? undefined : shortcut, (event) => {
    event.preventDefault();
    inputRef.current?.focus();
    inputRef.current?.select();
  });

  const busy = status === 'submitted' || status === 'streaming';
  const query = value.trim();
  const visible = React.useMemo(() => {
    const q = query.toLowerCase();
    return filterSuggestions && q
      ? suggestions.filter(
          (item) => item.label.toLowerCase().includes(q) && item.label.toLowerCase() !== q,
        )
      : suggestions;
  }, [suggestions, query, filterSuggestions]);
  const expanded = open && !busy && !disabled && visible.length > 0;
  const index = expanded ? Math.min(active, visible.length - 1) : -1;
  const optionId = (i: number) => `${listId}-option-${i}`;
  const showAnswer = answer != null || status !== 'idle';

  React.useEffect(() => {
    if (index >= 0)
      document.getElementById(`${listId}-option-${index}`)?.scrollIntoView({ block: 'nearest' });
  }, [index, listId]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy || disabled) return;
    setOpen(false);
    setActive(-1);
    onSubmit?.(trimmed);
  };
  const choose = (item: AskBarSuggestion) => {
    setValue(item.label);
    setOpen(false);
    setActive(-1);
    if (onSuggestionSelect) onSuggestionSelect(item);
    else if (!busy && !disabled) onSubmit?.(item.label);
  };
  const clear = () => {
    setValue('');
    setActive(-1);
    onClear?.();
    inputRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const last = visible.length - 1;
    switch (event.key) {
      case 'ArrowDown':
        if (visible.length === 0 || busy) return;
        event.preventDefault();
        setOpen(true);
        setActive(expanded ? (index >= last ? 0 : index + 1) : 0);
        return;
      case 'ArrowUp':
        if (visible.length === 0 || busy) return;
        event.preventDefault();
        setOpen(true);
        setActive(expanded ? (index <= 0 ? last : index - 1) : last);
        return;
      case 'Home':
      case 'End':
        if (!expanded || index < 0) return;
        event.preventDefault();
        setActive(event.key === 'Home' ? 0 : last);
        return;
      case 'Enter': {
        const item = index >= 0 ? visible[index] : undefined;
        if (!item) return; // The form submits the typed question.
        event.preventDefault();
        choose(item);
        return;
      }
      case 'Escape':
        if (expanded) {
          event.preventDefault();
          setOpen(false);
          setActive(-1);
        } else if (value !== '') {
          event.preventDefault();
          clear();
        }
        return;
    }
  };

  const canClear = !disabled && (value !== '' || (showAnswer && !busy && onClear !== undefined));

  return (
    <div
      ref={ref}
      className={cx('st-ask-bar', className)}
      data-status={status}
      data-disabled={disabled ? '' : undefined}
      {...props}
    >
      <form
        role="search"
        aria-label={labels.label}
        className="st-ask-bar__form"
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
      >
        <div className="st-ask-bar__field">
          <Icon name="sparkle" size={18} className="st-ask-bar__icon" />
          <input
            ref={composedInput}
            type="text"
            role="combobox"
            className="st-ask-bar__input"
            aria-label={labels.label}
            aria-expanded={expanded}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={index >= 0 ? optionId(index) : undefined}
            autoComplete="off"
            enterKeyHint="search"
            placeholder={placeholder ?? labels.placeholder}
            value={value}
            disabled={disabled}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setOpen(false);
              setActive(-1);
            }}
            onClick={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
          {shortcutText && value === '' && (
            <kbd className="st-ask-bar__shortcut" aria-hidden="true">
              {shortcutText}
            </kbd>
          )}
          {canClear && (
            <IconButton
              className="st-ask-bar__clear"
              label={labels.clear}
              icon={<Icon name="x" />}
              size="sm"
              onClick={clear}
            />
          )}
          {busy && onStop ? (
            <IconButton
              className="st-ask-bar__submit"
              label={labels.stop}
              icon={<Icon name="stop" />}
              size="sm"
              variant="primary"
              shape="circle"
              onClick={onStop}
            />
          ) : (
            <IconButton
              type="submit"
              className="st-ask-bar__submit"
              label={labels.submit}
              icon={<Icon name="arrow-up" />}
              size="sm"
              variant="primary"
              shape="circle"
              disabled={disabled || busy || query === ''}
            />
          )}
        </div>
        <ul
          id={listId}
          role="listbox"
          aria-label={labels.suggestions}
          className="st-ask-bar__suggestions"
          hidden={!expanded}
          // Keep focus in the field while the list is used with a pointer.
          onPointerDown={(event) => event.preventDefault()}
        >
          {expanded &&
            visible.map((item, i) => (
              <li
                key={item.id}
                id={optionId(i)}
                role="option"
                aria-selected={i === index}
                data-active={i === index ? '' : undefined}
                className="st-ask-bar__option"
                onPointerMove={() => {
                  if (i !== index) setActive(i);
                }}
                onClick={() => choose(item)}
              >
                <Icon name="search" size={14} className="st-ask-bar__option-icon" />
                <span>{item.label}</span>
              </li>
            ))}
        </ul>
      </form>
      {showAnswer && (
        <div
          role="region"
          aria-label={labels.answer}
          aria-live="polite"
          aria-atomic="true"
          // Held back while the answer streams, then read once when it is complete.
          aria-busy={busy}
          className="st-ask-bar__answer"
        >
          {status === 'submitted' && answer == null && (
            <ShimmerText className="st-ask-bar__thinking">{labels.thinking}</ShimmerText>
          )}
          {answer != null && <div className="st-ask-bar__answer-body">{answer}</div>}
          {status === 'stopped' && (
            <p className="st-ask-bar__note">
              <Icon name="stop" size={14} />
              <span>{labels.stopped}</span>
            </p>
          )}
          {status === 'error' && (
            <p className="st-ask-bar__note" data-tone="danger">
              <Icon name="alert-circle" size={14} />
              <span>{labels.error}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
});
