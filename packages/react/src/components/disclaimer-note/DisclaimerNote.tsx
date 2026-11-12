import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';

export interface DisclaimerNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The note, for example "AI can make mistakes. Check important facts." */
  children?: React.ReactNode;
  /** A leading icon. Defaults to the info icon; pass `null` for none. */
  icon?: React.ReactNode;
  /** A link or small button after the text, such as "Learn more". */
  action?: React.ReactNode;
  /** Text alignment. Use `center` under a composer. Default `start`. */
  align?: 'start' | 'center';
}

/**
 * A quiet note under the composer or a response, such as a reminder to check important
 * facts. It is exposed as a note and is not announced on its own.
 */
export const DisclaimerNote = React.forwardRef<HTMLDivElement, DisclaimerNoteProps>(
  function DisclaimerNote({ children, icon, action, align = 'start', className, ...props }, ref) {
    const mark = icon === undefined ? <Icon name="info" size={14} /> : icon;
    return (
      <div
        ref={ref}
        role="note"
        className={cx('st-disclaimer-note', className)}
        data-align={align}
        {...props}
      >
        {mark != null && mark !== false && (
          <span className="st-disclaimer-note__icon" aria-hidden="true">
            {mark}
          </span>
        )}
        <span className="st-disclaimer-note__text">
          {children}
          {action != null && <span className="st-disclaimer-note__action">{action}</span>}
        </span>
      </div>
    );
  },
);
