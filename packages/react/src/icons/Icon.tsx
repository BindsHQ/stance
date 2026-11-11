import * as React from 'react';
import { cx } from '../internal/cx.js';
import { iconPaths, type IconName } from './paths.js';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

const sizes: Record<Exclude<IconSize, number>, number> = { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 };

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref' | 'name'> {
  /** Name of a Stance icon. */
  name: IconName;
  /** Pixel size or a size token. Default `sm` (16px). */
  size?: IconSize;
  /** Stroke width on the 24px grid. Default 1.75. */
  strokeWidth?: number;
  /**
   * Accessible label. Without it the icon is decorative and hidden from
   * assistive technology, which is correct when it sits beside visible text.
   */
  label?: string;
}

/** Renders a Stance icon as inline SVG that inherits `currentColor`. */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, size = 'sm', strokeWidth = 1.75, label, className, ...props },
  ref,
) {
  const px = typeof size === 'number' ? size : sizes[size];
  const paths = iconPaths[name] as readonly string[];
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx('st-icon', className)}
      data-icon={name}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...props}
    >
      {label ? <title>{label}</title> : null}
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
});
