'use client';
import * as React from 'react';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { SliderCore, type SliderCommonProps } from '../slider/SliderCore.js';

export interface RangeSliderProps extends SliderCommonProps {
  value?: [number, number];
  defaultValue?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  onValueCommit?: (value: [number, number]) => void;
  /** Minimum distance between the two thumbs, in steps. Default 0. */
  minStepsBetween?: number;
  /** Accessible names for the two thumbs. Default ["Minimum", "Maximum"]. */
  thumbLabels?: [string, string];
}

/** Select a range with two thumbs that cannot cross. */
export const RangeSlider = React.forwardRef<HTMLDivElement, RangeSliderProps>(function RangeSlider(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    thumbLabels = ['Minimum', 'Maximum'],
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState<[number, number]>({
    value: valueProp,
    defaultValue: defaultValue ?? [min, max],
    onChange: onValueChange,
  });
  return (
    <SliderCore
      ref={ref}
      min={min}
      max={max}
      values={value}
      thumbLabels={thumbLabels}
      onValuesChange={(v) => setValue([v[0]!, v[1]!])}
      onValuesCommit={onValueCommit ? (v) => onValueCommit([v[0]!, v[1]!]) : undefined}
      {...props}
    />
  );
});
