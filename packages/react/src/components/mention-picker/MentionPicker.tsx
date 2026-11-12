'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import type { Align, Side } from '../../internal/position.js';
import {
  PromptListbox,
  matchesPromptQuery,
  type PromptListboxItem,
} from '../../internal/prompt-listbox.js';

export interface MentionItem {
  /** Stable identifier. */
  id: string;
  /** The name shown and matched against the query. */
  label: string;
  /** A second line, such as a path or a role. Also matched against the query. */
  description?: string;
  /** Leading visual, for example an Icon or Avatar. */
  icon?: React.ReactNode;
  /** Items that share a group are listed under one heading. */
  group?: string;
}

export interface MentionPickerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSelect' | 'children'
> {
  /** Whether the list is showing. The composer opens it when the trigger character is typed. */
  open: boolean;
  /** The text typed after the trigger character. Default empty. */
  query?: string;
  /** Things that can be referenced: files, people or tools. */
  items: MentionItem[];
  /** Called with the chosen item. Insert it in the draft and close the picker. */
  onSelect?: (item: MentionItem) => void;
  /** Called with false when the reader presses Escape or clicks outside. */
  onOpenChange?: (open: boolean) => void;
  /** The focused element the list belongs to, normally the composer text area. */
  anchor: React.RefObject<Element | null>;
  /** Shown when nothing matches. Default "No matches". */
  emptyLabel?: React.ReactNode;
  /** Shows the loading label instead of the items. */
  loading?: boolean;
  /** Shown while loading. Default "Loading". */
  loadingLabel?: React.ReactNode;
  /** Accessible name of the listbox. Default "Mentions". */
  label?: string;
  /** Filter items by `query` on label and description. Set false when the server filters. Default true. */
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
 * A filterable list that opens from a trigger character to reference files, people or tools.
 * Focus stays in the text area; arrow keys move the active option.
 */
export const MentionPicker = React.forwardRef<HTMLDivElement, MentionPickerProps>(
  function MentionPicker(
    {
      open,
      query = '',
      items,
      onSelect,
      onOpenChange,
      anchor,
      emptyLabel = 'No matches',
      loading = false,
      loadingLabel = 'Loading',
      label = 'Mentions',
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
    const visible = React.useMemo(
      () =>
        filter
          ? items.filter((item) => matchesPromptQuery(query, item.label, item.description))
          : items,
      [items, query, filter],
    );
    const rows: PromptListboxItem[] = visible.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      icon: item.icon,
      group: item.group,
    }));
    return (
      <PromptListbox
        ref={ref}
        open={open}
        items={rows}
        onSelectItem={(id) => {
          const item = visible.find((candidate) => candidate.id === id);
          if (item) onSelect?.(item);
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
        className={cx('st-mention-picker', className)}
        {...props}
      />
    );
  },
);
