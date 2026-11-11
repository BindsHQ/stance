'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useRovingFocus } from '../../internal/roving-focus.js';
import { Icon } from '../../icons/Icon.js';
import type { IconName } from '../../icons/paths.js';
import { useTheme, type ThemePreference } from '../theme-provider/ThemeProvider.js';

const OPTIONS: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'high-contrast', label: 'High contrast', icon: 'contrast' },
  { value: 'system', label: 'System', icon: 'monitor' },
];

export interface ThemeSwitcherProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Show text labels beside icons. Default false (icons with tooltips via title). */
  showLabels?: boolean;
  /** Which options to offer. Default all four. */
  options?: ThemePreference[];
  /** Accessible group label. Default "Theme". */
  label?: string;
  size?: 'sm' | 'md';
}

/** A segmented radio group that switches between Stance themes. */
export const ThemeSwitcher = React.forwardRef<HTMLDivElement, ThemeSwitcherProps>(
  function ThemeSwitcher(
    { showLabels = false, options, label = 'Theme', size = 'md', className, ...props },
    forwardedRef,
  ) {
    const { theme, setTheme } = useTheme();
    const ref = React.useRef<HTMLDivElement>(null);
    const { onKeyDown } = useRovingFocus(ref, { orientation: 'horizontal' });
    const list = OPTIONS.filter((o) => !options || options.includes(o.value));
    React.useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);
    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={label}
        className={cx('st-theme-switcher', className)}
        data-size={size}
        onKeyDown={(e) => {
          onKeyDown(e);
          // Selection follows focus, as in native radio groups.
          const value = (document.activeElement as HTMLElement | null)?.dataset.value as
            ThemePreference | undefined;
          if (value && value !== theme && e.key.startsWith('Arrow')) setTheme(value);
        }}
        {...props}
      >
        {list.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={theme === o.value}
            aria-label={showLabels ? undefined : o.label}
            title={showLabels ? undefined : o.label}
            data-value={o.value}
            data-roving-item=""
            className="st-theme-switcher__option"
            onClick={() => setTheme(o.value)}
          >
            <Icon name={o.icon} size={size === 'sm' ? 14 : 16} />
            {showLabels && <span>{o.label}</span>}
          </button>
        ))}
      </div>
    );
  },
);
