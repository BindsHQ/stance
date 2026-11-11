import { Button, LoadingOverlay } from '@bindshq/stance-react';
import * as React from 'react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'loading-overlay',
  name: 'LoadingOverlay',
  category: 'feedback',
  summary: 'Covers a region or the whole screen with a spinner while work is in progress.',
  description:
    'LoadingOverlay keeps layout stable while content refreshes, and prevents interaction with stale data. The covered content is marked aria-busy and made inert so it cannot be clicked or focused. Prefer Skeleton for first loads and a Button’s loading state for single actions; use the overlay when a whole panel is temporarily unusable.',
  imports: ['LoadingOverlay'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Covering a panel', minHeight: 220 },
    {
      name: 'Solid',
      title: 'Solid backdrop',
      description: 'Hide content entirely when partial data would mislead.',
      minHeight: 220,
    },
    {
      name: 'FullScreen',
      title: 'Full screen',
      description: 'For app-wide transitions such as switching organisation.',
      minHeight: 120,
    },
  ],
  props: [
    {
      component: 'LoadingOverlay',
      name: 'visible',
      type: 'boolean',
      required: true,
      description: 'Show the overlay.',
    },
    {
      component: 'LoadingOverlay',
      name: 'message',
      type: 'ReactNode',
      default: "'Loading…'",
      description: 'Shown under the spinner and announced politely.',
    },
    {
      component: 'LoadingOverlay',
      name: 'backdrop',
      type: "'subtle' | 'solid'",
      default: "'subtle'",
      description: 'Subtle keeps content faintly visible.',
    },
    {
      component: 'LoadingOverlay',
      name: 'fullScreen',
      type: 'boolean',
      default: 'false',
      description: 'Cover the viewport (rendered in a portal).',
    },
    {
      component: 'LoadingOverlay',
      name: 'children',
      type: 'ReactNode',
      description: 'Content to cover; made inert and aria-busy while visible.',
    },
  ],
  accessibility: [
    'The wrapper has aria-busy="true" while visible and the content is inert (not focusable or clickable).',
    'The message is in a role="status" region so screen readers hear it once.',
    'The spinner slows instead of stopping under prefers-reduced-motion.',
  ],
  guidelines: {
    do: [
      'Write a specific message: “Deploying signatures…”.',
      'Return focus to a sensible place when loading finishes.',
    ],
    dont: ['Cover the screen for background refreshes; update in place instead.'],
  },
  related: ['spinner', 'skeleton', 'progress'],
};

const panel: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  width: 320,
  padding: 20,
  border: '1px solid var(--st-color-border-default)',
  borderRadius: 12,
  background: 'var(--st-color-bg-surface)',
};

export function Basic() {
  const [busy, setBusy] = React.useState(true);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <LoadingOverlay visible={busy} message="Refreshing usage…" style={{ borderRadius: 12 }}>
        <div style={panel}>
          <strong>Seat usage</strong>
          <span>48 of 50 seats used</span>
          <Button size="sm" variant="outline">
            Manage seats
          </Button>
        </div>
      </LoadingOverlay>
      <Button size="sm" variant="secondary" onClick={() => setBusy((b) => !b)}>
        {busy ? 'Finish loading' : 'Start loading'}
      </Button>
    </div>
  );
}

export function Solid() {
  return (
    <LoadingOverlay visible backdrop="solid" message="Loading report…" style={{ borderRadius: 12 }}>
      <div style={panel}>
        <strong>Deployment report</strong>
        <span>128 mailboxes</span>
      </div>
    </LoadingOverlay>
  );
}

export function FullScreen() {
  const [busy, setBusy] = React.useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setBusy(true);
          setTimeout(() => setBusy(false), 1500);
        }}
      >
        Switch organisation
      </Button>
      <LoadingOverlay visible={busy} fullScreen message="Switching to Binds Ltd…" />
    </>
  );
}
