import * as React from 'react';
import { cx } from '../../internal/cx.js';

const symbols: Record<string, { glyph: string; label: string }> = {
  mod: { glyph: '⌘', label: 'Command' },
  cmd: { glyph: '⌘', label: 'Command' },
  command: { glyph: '⌘', label: 'Command' },
  ctrl: { glyph: 'Ctrl', label: 'Control' },
  alt: { glyph: '⌥', label: 'Option' },
  option: { glyph: '⌥', label: 'Option' },
  shift: { glyph: '⇧', label: 'Shift' },
  enter: { glyph: '↵', label: 'Enter' },
  return: { glyph: '↵', label: 'Return' },
  esc: { glyph: 'Esc', label: 'Escape' },
  escape: { glyph: 'Esc', label: 'Escape' },
  tab: { glyph: 'Tab', label: 'Tab' },
  backspace: { glyph: '⌫', label: 'Backspace' },
  up: { glyph: '↑', label: 'Up arrow' },
  down: { glyph: '↓', label: 'Down arrow' },
  left: { glyph: '←', label: 'Left arrow' },
  right: { glyph: '→', label: 'Right arrow' },
  space: { glyph: 'Space', label: 'Space' },
};

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Keys of a shortcut, rendered as a combination, e.g. `['mod', 'k']`.
   * Known names (mod, shift, alt, enter, esc, arrows…) render as symbols with spoken labels.
   * Omit to render `children` as a single key.
   */
  keys?: string[];
  size?: 'sm' | 'md';
}

/** A keyboard key or shortcut, rendered with <kbd> semantics. */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd(
  { keys, size = 'md', className, children, ...props },
  ref,
) {
  if (!keys) {
    return (
      <kbd ref={ref} className={cx('st-kbd', className)} data-size={size} {...props}>
        {children}
      </kbd>
    );
  }
  return (
    <kbd ref={ref} className={cx('st-kbd-combo', className)} data-size={size} {...props}>
      {keys.map((key, i) => {
        const known = symbols[key.toLowerCase()];
        return (
          <React.Fragment key={`${key}-${i}`}>
            {i > 0 && <span className="st-sr-only"> + </span>}
            <kbd className="st-kbd" data-size={size} title={known?.label}>
              {known ? (
                <>
                  <span aria-hidden="true">{known.glyph}</span>
                  <span className="st-sr-only">{known.label}</span>
                </>
              ) : key.length === 1 ? (
                key.toUpperCase()
              ) : (
                key
              )}
            </kbd>
          </React.Fragment>
        );
      })}
    </kbd>
  );
});
