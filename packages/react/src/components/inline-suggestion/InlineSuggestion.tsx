'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { logicalKey } from '../../internal/direction.js';
import { useComposedRefs } from '../../internal/refs.js';
import { Slot } from '../../internal/slot.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';
import { Input } from '../input/Input.js';
import { Textarea } from '../textarea/Textarea.js';

type FieldElement = HTMLInputElement | HTMLTextAreaElement;

export interface InlineSuggestionLabels {
  /** Announced when a suggestion appears. Default "Suggestion: text. Press Tab to accept, Escape to dismiss." */
  announce: (suggestion: string) => string;
  /** The key shown after the ghost text. Default "Tab". */
  acceptKey: string;
}

export interface InlineSuggestionProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  /** The text in the field. The suggestion is drawn after it and is never part of it. */
  value: string;
  /** The completion that would follow the value. Empty or omitted shows nothing. */
  suggestion?: string;
  /** Called with the whole suggestion when the person presses Tab. Append it to the value. */
  onAccept?: (suggestion: string) => void;
  /** Called with the next word and what is left of the suggestion, on Ctrl or Cmd plus Right. */
  onAcceptWord?: (word: string, rest: string) => void;
  /** Called when the person presses Escape. The ghost text hides until the suggestion changes. */
  onDismiss?: () => void;
  /** A suggestion is on its way. Shows a quiet mark after the text. Default false. */
  loading?: boolean;
  /** The field: one input or textarea element, or a Stance Input or Textarea. Omit it to render one. */
  children?: React.ReactElement;
  /** Called with the new text when the built in field changes. */
  onValueChange?: (value: string) => void;
  /** Render the built in field as a text area. Default false. */
  multiline?: boolean;
  /** Placeholder of the built in field. */
  placeholder?: string;
  /** Disables the built in field. */
  disabled?: boolean;
  /** Extra props for the built in field, such as `aria-label`, `name` or `rows`. */
  fieldProps?: React.InputHTMLAttributes<HTMLInputElement> &
    React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /** Ref to the input or textarea element. */
  fieldRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
  /** Show the accept key after the ghost text. Default true. */
  showHint?: boolean;
  /** Translations for the built in strings. */
  labels?: Partial<InlineSuggestionLabels>;
}

/** Splits a suggestion into its next word, with the space before it, and the rest. */
export function splitSuggestionWord(suggestion: string): [word: string, rest: string] {
  const match = /^\s*\S+/.exec(suggestion);
  const word = match ? match[0] : suggestion;
  return [word, suggestion.slice(word.length)];
}

// Everything that decides where the field draws its text.
const mirrored = [
  'box-sizing',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant',
  'font-stretch',
  'font-feature-settings',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-transform',
  'text-indent',
  'text-align',
  'direction',
  'tab-size',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
];

/**
 * Ghost text completion inside a text field. Tab accepts, Ctrl or Cmd plus Right accepts one
 * word and Escape dismisses. The field value never changes until the person accepts.
 */
export const InlineSuggestion = React.forwardRef<HTMLDivElement, InlineSuggestionProps>(
  function InlineSuggestion(
    {
      value,
      suggestion = '',
      onAccept,
      onAcceptWord,
      onDismiss,
      loading = false,
      children,
      onValueChange,
      multiline = false,
      placeholder,
      disabled,
      fieldProps,
      fieldRef: fieldRefProp,
      showHint = true,
      labels: labelsProp,
      className,
      ...props
    },
    forwardedRef,
  ) {
    const labels: InlineSuggestionLabels = {
      announce: (text) => `Suggestion: ${text}. Press Tab to accept, Escape to dismiss.`,
      acceptKey: 'Tab',
      ...labelsProp,
    };
    const rootRef = React.useRef<HTMLDivElement>(null);
    const composedRoot = useComposedRefs(forwardedRef, rootRef);
    const fieldRef = React.useRef<FieldElement>(null);
    const composedField = useComposedRefs(fieldRefProp as React.Ref<FieldElement>, fieldRef);
    const ghostRef = React.useRef<HTMLDivElement>(null);
    const [composing, setComposing] = React.useState(false);
    const [caretAtEnd, setCaretAtEnd] = React.useState(true);
    const [focused, setFocused] = React.useState(false);
    const [single, setSingle] = React.useState(!multiline);
    // The value and suggestion pair the person dismissed with Escape.
    const [dismissed, setDismissed] = React.useState<string | null>(null);

    const pair = `${value}\u0000${suggestion}`;
    const visible = suggestion !== '' && dismissed !== pair && !composing && caretAtEnd;
    const waiting = loading && !visible && !composing && caretAtEnd && suggestion === '';

    const readCaret = () => {
      const field = fieldRef.current;
      if (!field) return;
      let end = true;
      try {
        // The caret only means something in the focused field. Some input types have no
        // selection; treat them as having the caret at the end.
        if (field.ownerDocument.activeElement === field && field.selectionStart !== null)
          end =
            field.selectionStart === field.selectionEnd &&
            field.selectionEnd === field.value.length;
      } catch {
        end = true;
      }
      setCaretAtEnd(end);
    };

    // Lay the ghost exactly over the field's text box and copy its text metrics.
    const sync = React.useCallback(() => {
      const root = rootRef.current;
      const field = fieldRef.current;
      const ghost = ghostRef.current;
      if (!root || !field || !ghost) return;
      const computed = window.getComputedStyle(field);
      for (const property of mirrored)
        ghost.style.setProperty(property, computed.getPropertyValue(property));
      const fieldRect = field.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      // A scrollbar narrows the text box; it sits on the left in right to left text areas.
      const bar =
        field.offsetWidth -
        field.clientWidth -
        (parseFloat(computed.borderLeftWidth) || 0) -
        (parseFloat(computed.borderRightWidth) || 0);
      const barWidth = bar > 0 ? bar : 0;
      const rtl = computed.direction === 'rtl';
      // Physical on purpose: these are measured viewport offsets.
      ghost.style.left = `${fieldRect.left - rootRect.left + (rtl ? barWidth : 0)}px`;
      ghost.style.top = `${fieldRect.top - rootRect.top}px`;
      ghost.style.width = `${fieldRect.width - barWidth}px`;
      ghost.style.height = `${fieldRect.height}px`;
      ghost.scrollTop = field.scrollTop;
      ghost.scrollLeft = field.scrollLeft;
    }, []);

    const showGhost = visible || waiting;
    useIsomorphicLayoutEffect(() => {
      const field = fieldRef.current;
      if (field) setSingle(field.tagName !== 'TEXTAREA');
      if (showGhost) sync();
    });
    React.useEffect(() => {
      const field = fieldRef.current;
      if (!showGhost || !field || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(sync);
      observer.observe(field);
      return () => observer.disconnect();
    }, [showGhost, sync]);

    // The caret can only have moved to the end when the text changes under it.
    React.useEffect(readCaret, [value]);

    const { announce, region } = useAnnouncer();
    const announced = React.useRef<string | null>(null);
    const announceRef = React.useRef(labels.announce);
    announceRef.current = labels.announce;
    React.useEffect(() => {
      // Typing through a suggestion keeps the same full text, so it is spoken once.
      const full = value + suggestion;
      if (!visible) {
        if (suggestion === '') announced.current = null;
        return;
      }
      if (!focused || announced.current === full) return;
      announced.current = full;
      announce(announceRef.current(suggestion));
    }, [visible, focused, value, suggestion, announce]);

    const acceptAll = () => onAccept?.(suggestion);

    const onKeyDown = (event: React.KeyboardEvent<FieldElement>) => {
      if (!visible || event.defaultPrevented) return;
      // Keys pressed while an input method is composing belong to the input method.
      if (composing || event.nativeEvent.isComposing || event.keyCode === 229) return;
      const modified = event.ctrlKey || event.metaKey;
      if (event.key === 'Tab' && !event.shiftKey && !event.altKey && !modified) {
        if (!onAccept) return;
        event.preventDefault();
        acceptAll();
      } else if (
        logicalKey(event.key, event.currentTarget) === 'ArrowRight' &&
        modified &&
        !event.shiftKey &&
        !event.altKey
      ) {
        if (!onAcceptWord) return;
        event.preventDefault();
        const [word, rest] = splitSuggestionWord(suggestion);
        onAcceptWord(word, rest);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setDismissed(pair);
        onDismiss?.();
      }
    };

    const field =
      children ??
      (multiline ? (
        <Textarea
          {...fieldProps}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => {
            fieldProps?.onChange?.(event as never);
            onValueChange?.(event.target.value);
          }}
        />
      ) : (
        <Input
          {...(fieldProps as Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'>)}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => {
            fieldProps?.onChange?.(event as never);
            onValueChange?.(event.target.value);
          }}
        />
      ));

    return (
      <div
        ref={composedRoot}
        className={cx('st-inline-suggestion', className)}
        data-suggesting={visible ? '' : undefined}
        data-loading={loading ? '' : undefined}
        {...props}
      >
        <Slot
          ref={composedField as React.Ref<HTMLElement>}
          onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLElement>}
          onSelect={readCaret}
          onKeyUp={readCaret}
          onClick={readCaret}
          onScroll={sync}
          onFocus={() => {
            setFocused(true);
            readCaret();
          }}
          onBlur={() => {
            setFocused(false);
            setCaretAtEnd(true);
          }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => {
            setComposing(false);
            readCaret();
          }}
        >
          {field}
        </Slot>
        {showGhost && (
          <div
            ref={ghostRef}
            className="st-inline-suggestion__ghost"
            data-multiline={single ? undefined : ''}
            aria-hidden="true"
          >
            <span className="st-inline-suggestion__line">
              <span className="st-inline-suggestion__typed">{value}</span>
              {visible ? (
                <>
                  <span className="st-inline-suggestion__text">{suggestion}</span>
                  {showHint && onAccept && (
                    <span
                      className="st-inline-suggestion__hint"
                      // Tapping the key accepts on touch screens, where there is no Tab key.
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={acceptAll}
                    >
                      {labels.acceptKey}
                    </span>
                  )}
                </>
              ) : (
                <span className="st-inline-suggestion__pending" />
              )}
            </span>
          </div>
        )}
        {region}
      </div>
    );
  },
);
