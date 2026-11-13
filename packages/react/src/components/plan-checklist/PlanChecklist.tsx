'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import {
  defaultStepStatusLabels,
  StepStatusIcon,
  type AgentStepStatus,
  type StepStatusLabels,
} from '../../internal/step-status.js';
import { useComposedRefs } from '../../internal/refs.js';
import { useAnnouncer } from '../../internal/use-announcer.js';
import { Icon } from '../../icons/Icon.js';
import { Button } from '../button/Button.js';
import { IconButton } from '../icon-button/IconButton.js';
import { Progress } from '../progress/Progress.js';
import { SortableList, type SortableListLabels } from '../sortable-list/SortableList.js';

/** One step of a proposed plan. */
export interface PlanChecklistItem {
  id: string;
  /** What the step does, in a few words. */
  title: string;
  /** One line of supporting text. */
  description?: string;
  /** Where the step is. Use `pending` for a plan that has not started. */
  status: AgentStepStatus;
}

export interface PlanChecklistLabels {
  /** The heading and accessible name. Default "Plan". */
  title: string;
  /** Accessible name of the list of steps. Default "Steps". */
  list: string;
  /** The progress summary. Default "2 of 5 steps done". */
  progress: (done: number, total: number) => string;
  /** The approve button. Default "Approve plan". */
  approve: string;
  /** The reject button. Default "Reject". */
  reject: string;
  /** Names the edit button of a step. Default "Edit Read the contract". */
  edit: (title: string) => string;
  /** Names the remove button of a step. Default "Remove Read the contract". */
  remove: (title: string) => string;
  /** Announced after a step is removed. Default "Removed Read the contract". */
  removed: (title: string) => string;
  /** Names the text field while a step is edited. Default "Step title". */
  titleField: string;
  /** Saves an edited title. Default "Save". */
  save: string;
  /** Leaves edit mode without saving. Default "Cancel". */
  cancel: string;
  /** Shown when the plan has no steps. Default "No steps". */
  empty: string;
  /** The words for each status. */
  status: StepStatusLabels;
  /** Translations for the reorder controls and announcements. */
  sortable: Partial<SortableListLabels>;
}

/** Translations for PlanChecklist. Status words can be overridden one by one. */
export type PlanChecklistLabelOverrides = Partial<Omit<PlanChecklistLabels, 'status'>> & {
  status?: Partial<StepStatusLabels>;
};

export interface PlanChecklistProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title' | 'children'
> {
  /** The steps of the plan, in order. */
  items: PlanChecklistItem[];
  /** Let people rename, reorder and remove steps. Default false. */
  editable?: boolean;
  /** Called with the next steps after an edit, a move or a removal. */
  onItemsChange?: (items: PlanChecklistItem[]) => void;
  /** Called when the plan is approved. Shows the approve button. */
  onApprove?: () => void;
  /** Called when the plan is rejected. Shows the reject button. */
  onReject?: () => void;
  /** Progress from 0 to 100. Derived from the step statuses when omitted. */
  progress?: number;
  /** Overrides the heading. Defaults to `labels.title`. */
  title?: React.ReactNode;
  /** Disables editing and the approve and reject buttons, for example while saving. */
  disabled?: boolean;
  /** Translations for the built in strings. */
  labels?: PlanChecklistLabelOverrides;
}

const isDone = (status: AgentStepStatus) => status === 'complete' || status === 'skipped';

/**
 * The plan an agent proposes before it starts. People can review the steps, rename,
 * reorder or remove them, then approve or reject the plan.
 */
export const PlanChecklist = React.forwardRef<HTMLDivElement, PlanChecklistProps>(
  function PlanChecklist(
    {
      items,
      editable = false,
      onItemsChange,
      onApprove,
      onReject,
      progress: progressProp,
      title,
      disabled = false,
      labels: labelsProp,
      className,
      ...props
    },
    ref,
  ) {
    const labels: PlanChecklistLabels = {
      title: 'Plan',
      list: 'Steps',
      progress: (done, total) => `${done} of ${total} ${total === 1 ? 'step' : 'steps'} done`,
      approve: 'Approve plan',
      reject: 'Reject',
      edit: (t) => `Edit ${t}`,
      remove: (t) => `Remove ${t}`,
      removed: (t) => `Removed ${t}`,
      titleField: 'Step title',
      save: 'Save',
      cancel: 'Cancel',
      empty: 'No steps',
      sortable: {},
      ...labelsProp,
      status: { ...defaultStepStatusLabels, ...labelsProp?.status },
    };
    const titleId = React.useId();
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const composedRef = useComposedRefs(ref, rootRef);
    const [editing, setEditing] = React.useState<{ id: string; draft: string } | null>(null);
    const { announce, region } = useAnnouncer();
    // Where focus goes after the DOM settles: a step's edit button, or the group itself.
    const focusNext = React.useRef<string | null>(null);

    const done = items.filter((item) => isDone(item.status)).length;
    const total = items.length;
    const value = Math.min(
      100,
      Math.max(0, progressProp ?? (total === 0 ? 0 : (done / total) * 100)),
    );
    const summary = labels.progress(done, total);

    React.useEffect(() => {
      const target = focusNext.current;
      if (target === null) return;
      focusNext.current = null;
      const root = rootRef.current;
      if (!root) return;
      const button =
        target && root.querySelector<HTMLElement>(`[data-plan-edit="${CSS.escape(target)}"]`);
      (button || root).focus();
    });

    const save = () => {
      if (!editing) return;
      const next = editing.draft.trim();
      const current = items.find((item) => item.id === editing.id);
      if (next && current && next !== current.title)
        onItemsChange?.(
          items.map((item) => (item.id === editing.id ? { ...item, title: next } : item)),
        );
      focusNext.current = editing.id;
      setEditing(null);
    };
    const cancel = () => {
      if (!editing) return;
      focusNext.current = editing.id;
      setEditing(null);
    };
    const remove = (item: PlanChecklistItem, index: number) => {
      const next = items.filter((i) => i.id !== item.id);
      focusNext.current = (next[index] ?? next[index - 1])?.id ?? '';
      onItemsChange?.(next);
      announce(labels.removed(item.title));
    };

    const text = (item: PlanChecklistItem) => (
      <span className="st-plan-checklist__text">
        <span className="st-plan-checklist__item-title">
          {item.title}
          <span className="st-sr-only">, {labels.status[item.status]}</span>
        </span>
        {item.description && (
          <span className="st-plan-checklist__description">{item.description}</span>
        )}
      </span>
    );

    const row = (item: PlanChecklistItem, index: number) => {
      if (editing?.id === item.id) {
        return (
          <form
            className="st-plan-checklist__row"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <StepStatusIcon status={item.status} />
            <input
              className="st-plan-checklist__input"
              aria-label={labels.titleField}
              value={editing.draft}
              autoFocus
              onChange={(event) => setEditing({ id: item.id, draft: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  cancel();
                }
              }}
            />
            <Button type="submit" size="xs" variant="secondary">
              {labels.save}
            </Button>
            <Button size="xs" variant="ghost" onClick={cancel}>
              {labels.cancel}
            </Button>
          </form>
        );
      }
      return (
        <div className="st-plan-checklist__row" data-status={item.status}>
          <StepStatusIcon status={item.status} />
          {text(item)}
          {editable && (
            <span className="st-plan-checklist__item-actions">
              <IconButton
                size="xs"
                label={labels.edit(item.title)}
                icon={<Icon name="pencil" size={14} />}
                disabled={disabled}
                data-plan-edit={item.id}
                onClick={() => setEditing({ id: item.id, draft: item.title })}
              />
              <IconButton
                size="xs"
                label={labels.remove(item.title)}
                icon={<Icon name="trash" size={14} />}
                disabled={disabled}
                onClick={() => remove(item, index)}
              />
            </span>
          )}
        </div>
      );
    };

    return (
      <div
        ref={composedRef}
        role="group"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('st-plan-checklist', className)}
        data-editable={editable ? '' : undefined}
        {...props}
      >
        <div className="st-plan-checklist__header">
          <div id={titleId} className="st-plan-checklist__title">
            {title ?? labels.title}
          </div>
          <div className="st-plan-checklist__summary">{summary}</div>
        </div>
        <Progress
          className="st-plan-checklist__progress"
          size="sm"
          value={value}
          aria-label={labels.title}
          formatValue={() => summary}
        />
        {total === 0 ? (
          <p className="st-plan-checklist__empty">{labels.empty}</p>
        ) : editable ? (
          <SortableList
            className="st-plan-checklist__list"
            items={items}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.title}
            renderItem={(item, state) => row(item, state.index)}
            onReorder={(next) => onItemsChange?.(next)}
            label={labels.list}
            disabled={disabled || editing !== null}
            showMoveButtons
            labels={labels.sortable}
          />
        ) : (
          <ol className="st-plan-checklist__list" aria-label={labels.list}>
            {items.map((item, index) => (
              <li key={item.id} className="st-plan-checklist__item">
                {row(item, index)}
              </li>
            ))}
          </ol>
        )}
        {(onApprove || onReject) && (
          <div className="st-plan-checklist__footer">
            {onReject && (
              <Button size="sm" variant="outline" disabled={disabled} onClick={onReject}>
                {labels.reject}
              </Button>
            )}
            {onApprove && (
              <Button
                size="sm"
                disabled={disabled || total === 0 || editing !== null}
                onClick={onApprove}
              >
                {labels.approve}
              </Button>
            )}
          </div>
        )}
        {region}
      </div>
    );
  },
);
