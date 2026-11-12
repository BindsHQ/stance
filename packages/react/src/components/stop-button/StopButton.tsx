import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { Icon } from '../../icons/Icon.js';
import { Button, type ButtonSize, type ButtonVariant } from '../button/Button.js';
import { IconButton } from '../icon-button/IconButton.js';

export interface StopButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** Called when the reader asks to stop the response. */
  onStop?: () => void;
  /** The visible text, or the accessible name when `iconOnly`. Default "Stop". */
  label?: string;
  /** Control height: xs 24, sm 32, md 40, lg 48. Default `sm`. */
  size?: ButtonSize;
  /** Visual weight. Default `secondary`. */
  variant?: Exclude<ButtonVariant, 'link'>;
  /** Show only the stop mark. The label stays as the accessible name. Default false. */
  iconOnly?: boolean;
  /** Round the button fully. Default false. */
  pill?: boolean;
}

/** Stops a response that is being generated. */
export const StopButton = React.forwardRef<HTMLButtonElement, StopButtonProps>(function StopButton(
  {
    onStop,
    label = 'Stop',
    size = 'sm',
    variant = 'secondary',
    iconOnly = false,
    pill = false,
    className,
    onClick,
    ...props
  },
  ref,
) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) onStop?.();
  };
  if (iconOnly) {
    return (
      <IconButton
        ref={ref}
        label={label}
        icon={<Icon name="stop" />}
        size={size}
        variant={variant}
        shape={pill ? 'circle' : 'default'}
        className={cx('st-stop-button', className)}
        onClick={handleClick}
        {...props}
      />
    );
  }
  return (
    <Button
      ref={ref}
      size={size}
      variant={variant}
      shape={pill ? 'pill' : 'default'}
      leadingIcon={<Icon name="stop" />}
      className={cx('st-stop-button', className)}
      onClick={handleClick}
      {...props}
    >
      {label}
    </Button>
  );
});
