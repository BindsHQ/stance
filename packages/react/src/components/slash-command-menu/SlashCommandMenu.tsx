'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { Align, Side } from '../../internal/position.js';
import {
  PromptListbox,
  matchesPromptQuery,
  type PromptListboxItem,
} from '../../internal/prompt-listbox.js';
import { Kbd } from '../kbd/Kbd.js';

export interface SlashCommand {
  /** Stable identifier. */
  id: string;
  /** The command name shown and matched against the query, for example "summarise". */
  name: string;
  /** What the command does. Also matched against the query. */
  description?: string;
  /** Leading visual, for example an Icon. */
  icon?: React.ReactNode;
  /** Keys of a keyboard shortcut for the same command, for example `['mod', 'k']`. */
  shortcut?: string[];
}

export interface SlashCommandMenuProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSelect' | 'children'
> {
  /** Whether the menu is showing. The composer opens it when the draft starts with a slash. */
  open: boolean;
  /** The text typed after the slash. A leading slash is ignored. Default empty. */
  query?: string;
  /** The commands on offer. */
  commands: SlashCommand[];
  /** Called with the chosen command. Run it or insert it, then close the menu. */
  onSelect?: (command: SlashCommand) => void;
  /** Called with false when the reader presses Escape or clicks outside. */
  onOpenChange?: (open: boolean) => void;
  /** The focused element the menu belongs to, normally the composer text area. */
  anchor: React.RefObject<Element | null>;
  /** Shown when nothing matches. Default "No commands". */
  emptyLabel?: React.ReactNode;
  /** Shows the loading label instead of the commands. */
  loading?: boolean;
  /** Shown while loading. Default "Loading". */
  loadingLabel?: React.ReactNode;
  /** Accessible name of the listbox. Default "Commands". */
  label?: string;
  /** Filter commands by `query` on name and description. Set false when the server filters. Default true. */
  filter?: boolean;
  /** Called with the id of the active option, for `aria-activedescendant` on the text area. */
  onActiveDescendantChange?: (id: string | undefined) => void;
  /** Side of the anchor to open on. Default `top`. */
  side?: Side;
  /** Alignment along the anchor. Default `start`. */
  align?: Align;
  /** Render in place instead of in a portal. */
  disablePortal?: boolean;
}

/**
 * A command list that opens when the draft starts with a slash. Focus stays in the
 * text area; arrow keys move the active option.
 */
export const SlashCommandMenu = React.forwardRef<HTMLDivElement, SlashCommandMenuProps>(
  function SlashCommandMenu(
    {
      open,
      query = '',
      commands,
      onSelect,
      onOpenChange,
      anchor,
      emptyLabel = 'No commands',
      loading = false,
      loadingLabel = 'Loading',
      label = 'Commands',
      filter = true,
      onActiveDescendantChange,
      side,
      align,
      disablePortal,
      className,
      ...props
    },
    ref,
  ) {
    const term = query.replace(/^\//, '');
    const visible = React.useMemo(
      () =>
        filter
          ? commands.filter((command) =>
              matchesPromptQuery(term, command.name, command.description),
            )
          : commands,
      [commands, term, filter],
    );
    const rows: PromptListboxItem[] = visible.map((command) => ({
      id: command.id,
      label: command.name,
      description: command.description,
      icon: command.icon,
      trailing: command.shortcut?.length ? <Kbd keys={command.shortcut} size="sm" /> : undefined,
    }));
    return (
      <PromptListbox
        ref={ref}
        open={open}
        items={rows}
        onSelectItem={(id) => {
          const command = visible.find((candidate) => candidate.id === id);
          if (command) onSelect?.(command);
        }}
        onOpenChange={onOpenChange}
        anchor={anchor}
        label={label}
        emptyLabel={emptyLabel}
        loading={loading}
        loadingLabel={loadingLabel}
        onActiveDescendantChange={onActiveDescendantChange}
        side={side}
        align={align}
        disablePortal={disablePortal}
        className={cx('st-slash-command-menu', className)}
        {...props}
      />
    );
  },
);
