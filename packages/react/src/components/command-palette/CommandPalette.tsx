'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import { useHotkey } from '../../internal/hotkey.js';
import { useControllableState } from '../../internal/use-controllable-state.js';
import { VisuallyHidden } from '../../internal/visually-hidden.js';
import {
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandMenu,
  type CommandFilter,
} from '../command-menu/CommandMenu.js';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../dialog/Dialog.js';

export interface CommandPaletteProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Global shortcut that toggles the palette, e.g. `mod+k` (⌘K / Ctrl+K). `false` disables it. Default `mod+k`. */
  hotkey?: string | false;
  /** Accessible title. Default "Command palette". */
  label?: string;
  placeholder?: string;
  /** Message when nothing matches. */
  emptyMessage?: React.ReactNode;
  /** Close after an item is selected. Default true. */
  closeOnSelect?: boolean;
  /** Custom scorer, or `false` to disable filtering. */
  filter?: CommandFilter | false;
  /** Optional trigger element, rendered with asChild. */
  trigger?: React.ReactElement;
  /** Show the keyboard hint footer. Default true. */
  showFooter?: boolean;
  /** CommandGroup / CommandItem elements. */
  children?: React.ReactNode;
  className?: string;
}

/** A CommandMenu in a modal dialog, opened from anywhere with ⌘K / Ctrl+K. */
export function CommandPalette({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  hotkey = 'mod+k',
  label = 'Command palette',
  placeholder,
  emptyMessage = 'No results found.',
  closeOnSelect = true,
  filter,
  trigger,
  showFooter = true,
  children,
  className,
}: CommandPaletteProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  useHotkey(hotkey, (event) => {
    event.preventDefault();
    setOpen((o) => !o);
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent size="md" showClose={false} className={cx('st-command-palette', className)}>
        <VisuallyHidden>
          <DialogTitle>{label}</DialogTitle>
        </VisuallyHidden>
        <CommandMenu
          label={label}
          {...(filter !== undefined && { filter })}
          onItemSelect={closeOnSelect ? () => setOpen(false) : undefined}
        >
          <CommandInput {...(placeholder !== undefined && { placeholder })} />
          <CommandList>{children}</CommandList>
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          {showFooter && (
            <div className="st-command-palette__footer" aria-hidden="true">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> navigate
              </span>
              <span>
                <kbd>↵</kbd> select
              </span>
              <span>
                <kbd>esc</kbd> close
              </span>
            </div>
          )}
        </CommandMenu>
      </DialogContent>
    </Dialog>
  );
}
