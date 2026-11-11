import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { spaceVar, type SpaceKey } from '../../internal/space.js';

export interface DividerProps extends React.HTMLAttributes<HTMLElement> {
  /** Optional text in the line, e.g. “or”. */
  label?: React.ReactNode;
  /** Label position. Default `center`. */
  labelPosition?: 'start' | 'center' | 'end';
  /** Vertical margin around the divider (space scale). Default 6. */
  spacing?: SpaceKey;
  /** Default `default`. */
  tone?: 'subtle' | 'default' | 'strong';
  /** Line style. Default `solid`. */
  variant?: 'solid' | 'dashed';
}

/**
 * A section divider. Renders a semantic <hr> (a thematic break) when unlabelled,
 * and a separator with visible text when labelled.
 */
export const Divider = React.forwardRef<HTMLElement, DividerProps>(function Divider(
  {
    label,
    labelPosition = 'center',
    spacing = 6,
    tone = 'default',
    variant = 'solid',
    className,
    style,
    ...props
  },
  ref,
) {
  const common = {
    className: cx('st-divider', className),
    'data-tone': tone,
    'data-variant': variant,
    style: { ['--st-divider-spacing' as string]: spaceVar(spacing), ...style },
  };
  if (label == null) {
    return <hr ref={ref as React.Ref<HTMLHRElement>} {...common} {...props} />;
  }
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      role="separator"
      data-labelled=""
      data-label-position={labelPosition}
      {...common}
      {...props}
    >
      <span className="st-divider__label">{label}</span>
    </div>
  );
});
