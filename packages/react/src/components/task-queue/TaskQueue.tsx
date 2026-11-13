'use client';
import * as React from 'react';
import { cx } from '../../internal/cx.js';
import {
  defaultStepStatusLabels,
  StepStatusIcon,
  type AgentStepStatus,
  type StepStatusLabels,
} from '../../internal/step-status.js';
import { Button } from '../button/Button.js';
import { Progress } from '../progress/Progress.js';

/** One task an agent has queued, is running or has finished. */
export interface TaskQueueTask {
  id: string;
  /** What the task does, in a few words. */
  title: string;
  /** Where the task is. */
  status: AgentStepStatus;
  /** Progress from 0 to 100, shown while the task runs. */
  progress?: number;
  /** One line on what is happening now. */
  detail?: string;
  /** When the task started. */
  startedAt?: Date | string | number;
  /** A running task that is on hold. It shows resume in place of pause. */
  paused?: boolean;
}

/** How many tasks are in each part of the queue. */
export interface TaskQueueCounts {
  /** Running or waiting for a person. */
  running: number;
  /** Not started yet. */
  queued: number;
  /** Complete, failed or skipped. */
  finished: number;
  total: number;
}

export interface TaskQueueLabels {
  /** Accessible name of the list. Default "Tasks". */
  list: string;
  /** The count summary. Default "1 running, 2 queued, 3 finished". */
  summary: (counts: TaskQueueCounts) => string;
  /** The words for each status. */
  status: StepStatusLabels;
  /** The status of a paused task. Default "Paused". */
  paused: string;
  /** Default "Pause". */
  pause: string;
  /** Default "Resume". */
  resume: string;
  /** Default "Cancel". */
  cancel: string;
  /** Default "Retry". */
  retry: string;
  /** Names an action for its task. Default "Cancel Export the report". */
  actionName: (action: string, title: string) => string;
  /** The start time text. Default "Started 10:42". */
  started: (date: Date) => string;
  /** Shown when there are no tasks. Default "No tasks". */
  empty: string;
}

/** Translations for TaskQueue. Status words can be overridden one by one. */
export type TaskQueueLabelOverrides = Partial<Omit<TaskQueueLabels, 'status'>> & {
  status?: Partial<StepStatusLabels>;
};

export interface TaskQueueProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onSelect' | 'onCancel' | 'onPause'
> {
  /** The tasks, in queue order. */
  tasks: TaskQueueTask[];
  /** Called with the task id. Shows cancel on tasks that have not finished. */
  onCancel?: (id: string) => void;
  /** Called with the task id. Shows retry on failed and skipped tasks. */
  onRetry?: (id: string) => void;
  /** Called with the task id. Shows pause on running tasks. */
  onPause?: (id: string) => void;
  /** Called with the task id. Shows resume on paused tasks. */
  onResume?: (id: string) => void;
  /** Called with the task id. Makes each title a button. */
  onSelect?: (id: string) => void;
  /** Replaces the default empty text. */
  emptyState?: React.ReactNode;
  /** Translations for the built in strings. */
  labels?: TaskQueueLabelOverrides;
}

const defaultSummary = ({ running, queued, finished }: TaskQueueCounts) =>
  [
    running ? `${running} running` : null,
    queued ? `${queued} queued` : null,
    finished ? `${finished} finished` : null,
  ]
    .filter(Boolean)
    .join(', ');

const defaultStarted = (date: Date) => {
  try {
    return `Started ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)}`;
  } catch {
    return '';
  }
};

const toDate = (value: Date | string | number): Date | null => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * The tasks an agent has queued, running and finished. Each task states its status
 * in words and offers pause, resume, cancel or retry where they apply.
 */
export const TaskQueue = React.forwardRef<HTMLDivElement, TaskQueueProps>(function TaskQueue(
  {
    tasks,
    onCancel,
    onRetry,
    onPause,
    onResume,
    onSelect,
    emptyState,
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels: TaskQueueLabels = {
    list: 'Tasks',
    summary: defaultSummary,
    paused: 'Paused',
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Cancel',
    retry: 'Retry',
    actionName: (action, title) => `${action} ${title}`,
    started: defaultStarted,
    empty: 'No tasks',
    ...labelsProp,
    status: { ...defaultStepStatusLabels, ...labelsProp?.status },
  };
  const summaryId = React.useId();
  const counts: TaskQueueCounts = { running: 0, queued: 0, finished: 0, total: tasks.length };
  for (const task of tasks) {
    if (task.status === 'running' || task.status === 'waiting') counts.running++;
    else if (task.status === 'pending') counts.queued++;
    else counts.finished++;
  }

  const action = (
    label: string,
    task: TaskQueueTask,
    handler: ((id: string) => void) | undefined,
  ) =>
    handler && (
      <Button
        key={label}
        size="xs"
        variant="ghost"
        aria-label={labels.actionName(label, task.title)}
        onClick={() => handler(task.id)}
      >
        {label}
      </Button>
    );

  return (
    <div ref={ref} className={cx('st-task-queue', className)} {...props}>
      {tasks.length === 0 ? (
        <div className="st-task-queue__empty">{emptyState ?? labels.empty}</div>
      ) : (
        <>
          <p id={summaryId} className="st-task-queue__summary">
            {labels.summary(counts)}
          </p>
          <ul className="st-task-queue__list" aria-label={labels.list} aria-describedby={summaryId}>
            {tasks.map((task) => {
              const running = task.status === 'running';
              const paused = running && !!task.paused;
              const active = running || task.status === 'pending' || task.status === 'waiting';
              const retryable = task.status === 'error' || task.status === 'skipped';
              const statusText = paused ? labels.paused : labels.status[task.status];
              const started = task.startedAt !== undefined ? toDate(task.startedAt) : null;
              const startedText = started ? labels.started(started) : '';
              const actions = [
                running && !paused && action(labels.pause, task, onPause),
                paused && action(labels.resume, task, onResume),
                active && action(labels.cancel, task, onCancel),
                retryable && action(labels.retry, task, onRetry),
              ].filter(Boolean);
              return (
                <li
                  key={task.id}
                  className="st-task-queue__task"
                  data-status={task.status}
                  data-paused={paused ? '' : undefined}
                >
                  <StepStatusIcon
                    status={paused ? 'pending' : task.status}
                    className="st-task-queue__icon"
                  />
                  <div className="st-task-queue__body">
                    <div className="st-task-queue__head">
                      {onSelect ? (
                        <button
                          type="button"
                          className="st-task-queue__title"
                          onClick={() => onSelect(task.id)}
                        >
                          {task.title}
                        </button>
                      ) : (
                        <span className="st-task-queue__title">{task.title}</span>
                      )}
                      <span className="st-task-queue__status">{statusText}</span>
                    </div>
                    {(task.detail || startedText) && (
                      <div className="st-task-queue__meta">
                        {task.detail && <span>{task.detail}</span>}
                        {started && startedText && (
                          <time dateTime={started.toISOString()} suppressHydrationWarning>
                            {startedText}
                          </time>
                        )}
                      </div>
                    )}
                    {running && task.progress !== undefined && (
                      <Progress
                        className="st-task-queue__progress"
                        size="sm"
                        value={task.progress}
                        aria-label={task.title}
                      />
                    )}
                  </div>
                  {actions.length > 0 && <div className="st-task-queue__actions">{actions}</div>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
});
