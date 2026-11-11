'use client';
import * as React from 'react';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { SliderCore, type SliderCommonProps, type SliderMark } from './SliderCore.js';

export type { SliderMark };

export interface SliderProps extends SliderCommonProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Called when the user finishes a change (pointer up or a key press). */
  onValueCommit?: (value: number) => void;
}

/** Select a single value from a continuous or stepped range (WAI-ARIA slider pattern). */
export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(function Slider(
  { value: valueProp, defaultValue, onValueChange, onValueCommit, min = 0, ...props },
  ref,
) {
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue: defaultValue ?? min,
    onChange: onValueChange,
  });
  return (
    <SliderCore
      ref={ref}
      min={min}
      values={[value]}
      onValuesChange={(v) => setValue(v[0]!)}
      onValuesCommit={onValueCommit ? (v) => onValueCommit(v[0]!) : undefined}
      {...props}
    />
  );
});
