import * as React from 'react';
import { EmptyState, Icon, TaskQueue } from '@bindshq/stance-react';
import type { TaskQueueTask } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'task-queue',
  name: 'TaskQueue',
  category: 'ai',
  summary:
    'Lists what an agent has waiting, in progress and finished, with pause, resume, cancel and retry on each task.',
  description:
    'Use TaskQueue when an agent works through several jobs in the background. People see what is running, what is next and what failed, and can step in on any task. The app owns the tasks and decides what each action does.',
  imports: ['TaskQueue'],
  status: 'beta',
  examples: [
    {
      name: 'Basic',
      title: 'A working queue',
      description: 'Pause, resume, cancel and retry update the task they belong to.',
      layout: 'fill',
    },
    {
      name: 'Selectable',
      title: 'Selectable tasks',
      description: 'With onSelect each title is a button.',
      layout: 'fill',
    },
    {
      name: 'ReadOnly',
      title: 'Read only',
      description: 'Without handlers the queue has no buttons.',
      layout: 'fill',
    },
    {
      name: 'Empty',
      title: 'Empty state',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'TaskQueue',
      name: 'tasks',
      type: 'TaskQueueTask[]',
      required: true,
      description:
        'The tasks in queue order: id, title, status, progress from 0 to 100, detail, startedAt and paused.',
    },
    {
      component: 'TaskQueue',
      name: 'onCancel',
      type: '(id: string) => void',
      description: 'Shows cancel on tasks that have not finished.',
    },
    {
      component: 'TaskQueue',
      name: 'onRetry',
      type: '(id: string) => void',
      description: 'Shows retry on failed and skipped tasks.',
    },
    {
      component: 'TaskQueue',
      name: 'onPause',
      type: '(id: string) => void',
      description: 'Shows pause on running tasks.',
    },
    {
      component: 'TaskQueue',
      name: 'onResume',
      type: '(id: string) => void',
      description: 'Shows resume on paused tasks.',
    },
    {
      component: 'TaskQueue',
      name: 'onSelect',
      type: '(id: string) => void',
      description: 'Makes each title a button.',
    },
    {
      component: 'TaskQueue',
      name: 'emptyState',
      type: 'React.ReactNode',
      description: 'Replaces the default empty text.',
    },
    {
      component: 'TaskQueue',
      name: 'labels',
      type: 'TaskQueueLabelOverrides',
      description:
        'Translations: list, summary(counts), status words, paused, pause, resume, cancel, retry, actionName(action, title), started(date) and empty.',
    },
  ],
  accessibility: [
    'A named list described by a count summary, for example 1 running, 2 queued, 3 finished.',
    'Every task states its status in words beside an icon with its own shape.',
    'Each action names its task, for example Cancel Export the report.',
    'Progress bars are named by their task.',
    'The summary is not a live region, so a busy queue does not interrupt the reader.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves through titles and actions, task by task.' },
    { keys: ['Enter', 'Space'], description: 'Activates the focused title or action.' },
  ],
  guidelines: {
    do: [
      'Keep running tasks at the top and finished ones at the end.',
      'Say what failed in the detail line and offer retry.',
    ],
    dont: [
      'Remove a task the moment it is cancelled. Show it as skipped so people can retry.',
      'Use it for the steps inside one task. Use StepTimeline for that.',
    ],
  },
  related: ['step-timeline', 'agent-status-pill', 'subagent-tree', 'run-log', 'progress'],
};

const initial: TaskQueueTask[] = [
  {
    id: 'export',
    title: 'Export the quarterly report',
    status: 'running',
    progress: 40,
    detail: 'Page 4 of 10',
  },
  { id: 'images', title: 'Resize 120 images', status: 'running', paused: true },
  { id: 'email', title: 'Email the team', status: 'pending' },
  { id: 'sync', title: 'Sync contacts', status: 'error', detail: 'The server did not respond.' },
  { id: 'index', title: 'Index new documents', status: 'complete' },
];

export function Basic() {
  const [tasks, setTasks] = React.useState(initial);
  const update = (id: string, patch: Partial<TaskQueueTask>) =>
    setTasks((list) => list.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <TaskQueue
        tasks={tasks}
        onPause={(id) => update(id, { paused: true })}
        onResume={(id) => update(id, { paused: false })}
        onCancel={(id) => update(id, { status: 'skipped', paused: false })}
        onRetry={(id) => update(id, { status: 'pending', detail: undefined })}
      />
    </div>
  );
}

export function Selectable() {
  const [selected, setSelected] = React.useState('nothing yet');
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 560 }}>
      <TaskQueue tasks={initial} onSelect={setSelected} />
      <p style={{ margin: 0, fontSize: 14 }}>Selected: {selected}</p>
    </div>
  );
}

export function ReadOnly() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <TaskQueue tasks={initial.slice(0, 3)} />
    </div>
  );
}

export function Empty() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <TaskQueue
        tasks={[]}
        emptyState={
          <EmptyState
            size="sm"
            icon={<Icon name="inbox" />}
            title="Nothing in the queue"
            description="Tasks you hand to the assistant show up here."
          />
        }
      />
    </div>
  );
}
