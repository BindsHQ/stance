'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { GenerationStatus } from '../../internal/generation-status.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { useIsomorphicLayoutEffect } from '../../internal/use-isomorphic-layout-effect.js';
import { Icon } from '../../icons/Icon.js';
import { IconButton } from '../icon-button/IconButton.js';

export interface PromptComposerLabels {
  /** Accessible name of the form. Default "Message". */
  form: string;
  /** Accessible name of the text area. Default "Message". */
  input: string;
  /** Name of the send button. Default "Send". */
  send: string;
  /** Name of the same button while a response is in progress. Default "Stop". */
  stop: string;
}

export type PromptComposerState = 'empty' | 'ready' | 'submitted' | 'streaming' | 'disabled';

export interface PromptComposerProps extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'defaultValue' | 'children'
> {
  /** The draft (controlled). */
  value?: string;
  /** The initial draft when uncontrolled. */
  defaultValue?: string;
  /** Called on every change to the draft, and with an empty string after a submit. */
  onValueChange?: (value: string) => void;
  /** Called with the draft when the reader sends it. Never called while empty or busy. */
  onSubmit?: (value: string) => void;
  /** Called when the reader presses Stop while a response is in progress. */
  onStop?: () => void;
  /** Generation status. `submitted` and `streaming` turn Send into Stop. Default `idle`. */
  status?: GenerationStatus;
  /** Hint shown while the draft is empty. */
  placeholder?: string;
  /** Turns off typing and sending. */
  disabled?: boolean;
  /** The text area grows up to this many lines, then scrolls. Default 8. */
  maxRows?: number;
  /** Enter sends and Shift Enter adds a line. When false, Ctrl or Cmd Enter sends. Default true. */
  submitOnEnter?: boolean;
  /** Slot at the start of the toolbar, for attach, mention or model controls. */
  leading?: React.ReactNode;
  /** Slot at the end of the toolbar, before the send button, for voice input and similar. */
  trailing?: React.ReactNode;
  /** Slot above the text area, for attachments and context. */
  header?: React.ReactNode;
  /** Slot under the composer, for hints and meters. */
  footer?: React.ReactNode;
  /** Translations for the built in strings. */
  labels?: Partial<PromptComposerLabels>;
  /** Ref to the text area, for focus and as the anchor of MentionPicker or SlashCommandMenu. */
  textareaRef?: React.Ref<HTMLTextAreaElement>;
  /** Extra props for the text area, such as `aria-controls`, `aria-activedescendant` or `name`. */
  textareaProps?: Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'defaultValue' | 'disabled' | 'placeholder'
  >;
}

const defaultLabels: PromptComposerLabels = {
  form: 'Message',
  input: 'Message',
  send: 'Send',
  stop: 'Stop',
};

/**
 * The message input: a text area that grows with its content, with slots for attachments,
 * tools and hints. The send button becomes a stop button while a response is in progress.
 */
export const PromptComposer = React.forwardRef<HTMLFormElement, PromptComposerProps>(
  function PromptComposer(
    {
      value: valueProp,
      defaultValue = '',
      onValueChange,
      onSubmit,
      onStop,
      status = 'idle',
      placeholder,
      disabled = false,
      maxRows = 8,
      submitOnEnter = true,
      leading,
      trailing,
      header,
      footer,
      labels: labelsProp,
      textareaRef,
      textareaProps,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const labels = { ...defaultLabels, ...labelsProp };
    const [value, setValue] = useControllableState({
      value: valueProp,
      defaultValue,
      onChange: onValueChange,
    });
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const composedInputRef = useComposedRefs(inputRef, textareaRef);
    const busy = status === 'submitted' || status === 'streaming';
    const empty = value.trim() === '';
    const canSend = !disabled && !busy && !empty;
    const state: PromptComposerState = disabled
      ? 'disabled'
      : status === 'streaming'
        ? 'streaming'
        : status === 'submitted'
          ? 'submitted'
          : empty
            ? 'empty'
            : 'ready';

    // Grow with the content up to maxRows, then scroll inside the text area.
    useIsomorphicLayoutEffect(() => {
      const el = inputRef.current;
      if (!el) return;
      el.style.height = 'auto';
      const content = el.scrollHeight;
      if (!content) {
        el.style.height = '';
        return;
      }
      const cs = window.getComputedStyle(el);
      const line = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 14) * 1.5;
      const chrome =
        (parseFloat(cs.paddingTop) || 0) +
        (parseFloat(cs.paddingBottom) || 0) +
        (parseFloat(cs.borderTopWidth) || 0) +
        (parseFloat(cs.borderBottomWidth) || 0);
      const max = line * Math.max(1, maxRows) + chrome;
      el.style.height = `${Math.min(content, max)}px`;
      el.style.overflowY = content > max ? 'auto' : 'hidden';
    }, [value, maxRows]);

    const submit = () => {
      if (!canSend) return;
      onSubmit?.(value);
      setValue('');
    };

    const {
      onChange: onInputChange,
      onKeyDown: onInputKeyDown,
      className: inputClassName,
      'aria-label': inputAriaLabel,
      'aria-labelledby': inputAriaLabelledBy,
      ...inputProps
    } = textareaProps ?? {};

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onInputKeyDown?.(event);
      // A picker that owns the key (MentionPicker, SlashCommandMenu) prevents the default first.
      if (event.defaultPrevented || event.key !== 'Enter') return;
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      const modifier = event.metaKey || event.ctrlKey;
      const wantsSubmit = submitOnEnter ? !event.shiftKey && !event.altKey : modifier;
      if (!wantsSubmit) return;
      event.preventDefault();
      submit();
    };

    return (
      <form
        ref={ref}
        aria-label={labels.form}
        noValidate
        className={cx('st-prompt-composer', className)}
        data-state={state}
        data-status={status}
        data-disabled={disabled ? '' : undefined}
        style={{ ['--st-prompt-composer-max-rows' as string]: maxRows, ...style }}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        {...props}
      >
        <div
          className="st-prompt-composer__box"
          onClick={(event) => {
            // Clicking the empty parts of the box puts the caret in the text area.
            const target = event.target as HTMLElement;
            if (!target.closest('button, a, input, select, textarea, [role], label'))
              inputRef.current?.focus();
          }}
        >
          {header != null && header !== false && (
            <div className="st-prompt-composer__header">{header}</div>
          )}
          <textarea
            ref={composedInputRef}
            rows={1}
            className={cx('st-prompt-composer__input', inputClassName)}
            aria-label={inputAriaLabelledBy ? undefined : (inputAriaLabel ?? labels.input)}
            aria-labelledby={inputAriaLabelledBy}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            enterKeyHint={submitOnEnter ? 'send' : 'enter'}
            onChange={(event) => {
              onInputChange?.(event);
              setValue(event.target.value);
            }}
            onKeyDown={handleKeyDown}
            {...inputProps}
          />
          <div className="st-prompt-composer__toolbar">
            {leading != null && leading !== false && (
              <div className="st-prompt-composer__leading">{leading}</div>
            )}
            <div className="st-prompt-composer__trailing">
              {trailing}
              {/* One button element for both jobs, so focus survives the switch to Stop. */}
              <IconButton
                type={busy ? 'button' : 'submit'}
                label={busy ? labels.stop : labels.send}
                icon={<Icon name={busy ? 'stop' : 'arrow-up'} />}
                variant="primary"
                size="sm"
                shape="circle"
                className="st-prompt-composer__submit"
                data-action={busy ? 'stop' : 'send'}
                disabled={busy ? disabled : !canSend}
                onClick={busy ? () => onStop?.() : undefined}
              />
            </div>
          </div>
        </div>
        {footer != null && footer !== false && (
          <div className="st-prompt-composer__footer">{footer}</div>
        )}
      </form>
    );
  },
);
