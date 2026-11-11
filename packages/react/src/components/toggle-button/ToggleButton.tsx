'use client';
import * as React from 'react';
import { composeHandlers } from '../../internal/compose-handlers.js';
import { cx } from '../../internal/cx.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useRovingFocus } from '../../internal/roving-focus.js';
import { useControllableState } from '../../internal/use-controllable-state.js';

interface GroupContextValue {
  isPressed: (value: string) => boolean;
  toggle: (value: string) => void;
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
}
const ToggleGroupContext = React.createContext<GroupContextValue | null>(null);

export interface ToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Controlled pressed state (standalone use). */
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** Identifies the button inside a ToggleButtonGroup. */
  value?: string;
  /** Default `md`. Inherited from the group. */
  size?: 'sm' | 'md' | 'lg';
  /** Icon rendered before the label. */
  icon?: React.ReactNode;
}

/** A button that stays on or off, exposed with aria-pressed. */
export const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  function ToggleButton(
    {
      pressed: pressedProp,
      defaultPressed = false,
      onPressedChange,
      value,
      size,
      icon,
      disabled,
      className,
      children,
      onClick,
      ...props
    },
    ref,
  ) {
    const group = React.useContext(ToggleGroupContext);
    const [own, setOwn] = useControllableState({
      value: pressedProp,
      defaultValue: defaultPressed,
      onChange: onPressedChange,
    });
    const inGroup = group !== null && value !== undefined;
    const pressed = inGroup ? group.isPressed(value) : own;
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        disabled={disabled ?? group?.disabled}
        data-state={pressed ? 'on' : 'off'}
        data-size={size ?? group?.size ?? 'md'}
        data-roving-item={inGroup ? '' : undefined}
        data-roving-active={inGroup && pressed ? 'true' : undefined}
        className={cx('st-toggle-button', className)}
        onClick={composeHandlers(onClick, () => (inGroup ? group.toggle(value) : setOwn(!own)))}
        {...props}
      >
        {icon && (
          <span className="st-toggle-button__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {children}
      </button>
    );
  },
);

interface GroupBase extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** Accessible name for the group. */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  /** Visually join the buttons into a segmented control. Default true. */
  attached?: boolean;
}
export interface ToggleButtonGroupSingleProps extends GroupBase {
  type?: 'single';
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** In single mode, prevent deselecting the active item. Default false. */
  required?: boolean;
}
export interface ToggleButtonGroupMultipleProps extends GroupBase {
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  required?: never;
}
export type ToggleButtonGroupProps = ToggleButtonGroupSingleProps | ToggleButtonGroupMultipleProps;

/** A set of toggle buttons with single or multiple selection and arrow-key navigation. */
export const ToggleButtonGroup = React.forwardRef<HTMLDivElement, ToggleButtonGroupProps>(
  function ToggleButtonGroup(props, forwardedRef) {
    const {
      label,
      size = 'md',
      orientation = 'horizontal',
      disabled = false,
      attached = true,
      className,
      children,
      onKeyDown,
      ...rest
    } = props;
    const multiple = props.type === 'multiple';
    const {
      type: _t,
      value: _v,
      defaultValue: _d,
      onValueChange: _o,
      required,
      ...domProps
    } = rest as ToggleButtonGroupSingleProps & { type?: string };
    const [value, setValue] = useControllableState<string | null | string[]>({
      value: props.value as string | string[] | null | undefined,
      defaultValue: (props.defaultValue ?? (multiple ? [] : null)) as string | string[] | null,
      onChange: props.onValueChange as ((v: string | string[] | null) => void) | undefined,
    });
    const ref = React.useRef<HTMLDivElement>(null);
    const composed = useComposedRefs(forwardedRef, ref);
    const roving = useRovingFocus(ref, { orientation });
    const ctx = React.useMemo<GroupContextValue>(
      () => ({
        size,
        disabled,
        isPressed: (v) => (Array.isArray(value) ? value.includes(v) : value === v),
        toggle: (v) => {
          if (Array.isArray(value))
            setValue(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
          else if (value === v) {
            if (!required) setValue(null);
          } else setValue(v);
        },
      }),
      [value, setValue, size, disabled, required],
    );
    return (
      <ToggleGroupContext.Provider value={ctx}>
        <div
          ref={composed}
          role="group"
          aria-label={label}
          data-orientation={orientation}
          data-attached={attached ? '' : undefined}
          className={cx('st-toggle-button-group', className)}
          onKeyDown={composeHandlers(onKeyDown, roving.onKeyDown)}
          {...domProps}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  },
);
