'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { Icon } from '../../icons/Icon.js';
import { Button } from '../button/Button.js';

export interface SensitiveContentGateLabels {
  /** The button that shows the content. */
  reveal: string;
  /** The button that hides the content again. */
  hide: string;
  /** Accessible name of the revealed content region. */
  content: string;
}

export interface SensitiveContentGateProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  /** The notice heading. Default "Sensitive content". */
  title?: React.ReactNode;
  /** Why the content is hidden, in a sentence. */
  description?: React.ReactNode;
  /** Controlled revealed state. */
  revealed?: boolean;
  /** Start revealed when uncontrolled. Default false. */
  defaultRevealed?: boolean;
  /** Called when the reader shows or hides the content. */
  onRevealedChange?: (revealed: boolean) => void;
  /** The content behind the gate. It is not rendered at all until revealed. */
  children?: React.ReactNode;
  /** Offer a button to hide the content again. Default true. */
  allowHide?: boolean;
  /** The notice icon. Defaults to the hidden eye; pass `null` for none. */
  icon?: React.ReactNode;
  /** Translations for the built in strings. */
  labels?: Partial<SensitiveContentGateLabels>;
}

/**
 * Hides content behind a notice until the reader chooses to see it. While hidden the
 * content is not in the page at all. On reveal, focus moves to the content.
 */
export const SensitiveContentGate = React.forwardRef<HTMLDivElement, SensitiveContentGateProps>(
  function SensitiveContentGate(
    {
      title = 'Sensitive content',
      description,
      revealed: revealedProp,
      defaultRevealed = false,
      onRevealedChange,
      children,
      allowHide = true,
      icon,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels = {
      reveal: 'Show content',
      hide: 'Hide content',
      content: 'Sensitive content, now shown',
      ...labelsProp,
    };
    const [revealed, setRevealed] = useControllableState({
      value: revealedProp,
      defaultValue: defaultRevealed,
      onChange: onRevealedChange,
    });
    const contentRef = React.useRef<HTMLDivElement>(null);
    const revealRef = React.useRef<HTMLButtonElement>(null);
    // Focus only follows the reader's own action, never a change made by the app.
    const moveFocus = React.useRef(false);
    const id = React.useId();
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;

    React.useEffect(() => {
      if (!moveFocus.current) return;
      moveFocus.current = false;
      (revealed ? contentRef : revealRef).current?.focus();
    }, [revealed]);

    const toggle = (next: boolean) => {
      moveFocus.current = true;
      setRevealed(next);
    };
    const mark = icon === undefined ? <Icon name="eye-off" size={20} /> : icon;

    return (
      <div
        ref={ref}
        className={cx('st-sensitive-content-gate', className)}
        data-state={revealed ? 'revealed' : 'hidden'}
        {...props}
      >
        {revealed ? (
          <>
            <div
              ref={contentRef}
              role="group"
              aria-label={labels.content}
              tabIndex={-1}
              className="st-sensitive-content-gate__content"
            >
              {children}
            </div>
            {allowHide && (
              <div className="st-sensitive-content-gate__footer">
                <Button
                  variant="ghost"
                  size="sm"
                  leadingIcon={<Icon name="eye-off" />}
                  onClick={() => toggle(false)}
                >
                  {labels.hide}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div
            role="group"
            aria-labelledby={titleId}
            aria-describedby={description != null ? descriptionId : undefined}
            className="st-sensitive-content-gate__notice"
          >
            {mark != null && mark !== false && (
              <span className="st-sensitive-content-gate__icon" aria-hidden="true">
                {mark}
              </span>
            )}
            <div className="st-sensitive-content-gate__text">
              <span id={titleId} className="st-sensitive-content-gate__title">
                {title}
              </span>
              {description != null && (
                <span id={descriptionId} className="st-sensitive-content-gate__description">
                  {description}
                </span>
              )}
            </div>
            <Button
              ref={revealRef}
              variant="outline"
              size="sm"
              leadingIcon={<Icon name="eye" />}
              className="st-sensitive-content-gate__reveal"
              onClick={() => toggle(true)}
            >
              {labels.reveal}
            </Button>
          </div>
        )}
      </div>
    );
  },
);
