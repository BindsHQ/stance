import { ScrollArea } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'scroll-area',
  name: 'ScrollArea',
  category: 'advanced',
  summary: 'A native scroll container with thin themed scrollbars, edge fades and keyboard access.',
  description:
    'Use ScrollArea for bounded regions that scroll independently, such as an activity feed, a long legal disclaimer or a row of template thumbnails. It uses the browser’s real scrolling, so wheel, touch, keyboard and assistive technology all behave natively. When content overflows it becomes a focusable, labelled region.',
  imports: ['ScrollArea'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Vertical', layout: 'fill' },
    { name: 'Horizontal', title: 'Horizontal', layout: 'fill' },
    {
      name: 'NoFade',
      title: 'Without fades',
      description: 'Edge fades are removed automatically in high contrast mode.',
      layout: 'fill',
    },
  ],
  props: [
    {
      component: 'ScrollArea',
      name: 'label',
      type: 'string',
      description: 'Accessible label. Required for the region to be announced when it overflows.',
    },
    {
      component: 'ScrollArea',
      name: 'orientation',
      type: "'vertical' | 'horizontal' | 'both'",
      default: "'vertical'",
      description: 'Scroll axis.',
    },
    {
      component: 'ScrollArea',
      name: 'maxHeight',
      type: 'number | string',
      description: 'Maximum height before vertical scrolling.',
    },
    {
      component: 'ScrollArea',
      name: 'height',
      type: 'number | string',
      description: 'Fixed height.',
    },
    {
      component: 'ScrollArea',
      name: 'maxWidth',
      type: 'number | string',
      description: 'Maximum width before horizontal scrolling.',
    },
    {
      component: 'ScrollArea',
      name: 'fade',
      type: 'boolean',
      default: 'true',
      description: 'Fade content at edges that have more to scroll.',
    },
    {
      component: 'ScrollArea',
      name: 'scrollbar',
      type: "'thin' | 'auto'",
      default: "'thin'",
      description: 'Scrollbar thickness.',
    },
  ],
  accessibility: [
    'When content overflows, the area gets tabindex="0" and role="region" with your label, so keyboard users can focus it and scroll with the arrow keys (WCAG 2.1.1).',
    'When content fits, the area stays out of the tab order.',
    'Scrollbars are native, so platform settings such as “always show scrollbars” are respected.',
    'Edge fades are disabled in high contrast mode and under prefers-contrast: more.',
  ],
  keyboard: [
    { keys: ['↑', '↓', '←', '→'], description: 'Scroll when the area is focused.' },
    {
      keys: ['Page Up', 'Page Down', 'Home', 'End'],
      description: 'Scroll by page or to the ends.',
    },
  ],
  guidelines: {
    do: [
      'Give every ScrollArea a label that describes its content.',
      'Keep scrolling regions few; prefer letting the page scroll.',
    ],
    dont: [
      'Nest scroll areas in the same direction.',
      'Hide essential actions inside a scrolling region.',
    ],
  },
  related: ['virtualized-list', 'table'],
};

const activity = [
  'Priya Nair deployed the Sales team signature to 12 mailboxes',
  'Amara Okafor updated the legal disclaimer',
  'Exchange relay synced 48 mailboxes',
  'Lukas Brenner joined the organisation',
  'Hana Sato approved the Finance template',
  'Tomás Ruiz requested access to Integrations',
  'Owen Price created the Q4 summit banner',
  'Zainab Haddad archived the Holiday template',
  'Mateja Kovač connected Azure AD',
  'Rollout completed for Customer Success',
];

export function Basic() {
  return (
    <div
      style={{
        maxWidth: 420,
        border: '1px solid var(--st-color-border-default)',
        borderRadius: 12,
      }}
    >
      <ScrollArea label="Recent activity" maxHeight={200}>
        <ul style={{ margin: 0, padding: '8px 16px' }}>
          {activity.map((a) => (
            <li key={a} style={{ padding: '8px 0' }}>
              {a}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

export function Horizontal() {
  return (
    <ScrollArea label="Signature templates" orientation="horizontal" style={{ maxWidth: 520 }}>
      <div style={{ display: 'flex', gap: 12, padding: 4, width: 'max-content' }}>
        {[
          'Standard',
          'Sales team',
          'Legal',
          'Recruiting',
          'Q4 summit',
          'Holiday',
          'Support',
          'Partners',
        ].map((t) => (
          <div
            key={t}
            style={{
              width: 140,
              height: 90,
              padding: 12,
              borderRadius: 10,
              border: '1px solid var(--st-color-border-default)',
              background: 'var(--st-color-bg-subtle)',
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function NoFade() {
  return (
    <ScrollArea label="Legal disclaimer" maxHeight={140} fade={false} style={{ maxWidth: 480 }}>
      <p style={{ margin: 0 }}>
        This email and any attachments are confidential and intended solely for the addressee. If
        you have received it in error, please notify the sender and delete it. Binds d.o.o. accepts
        no liability for changes made to this message after it was sent. Opinions expressed are
        those of the author and do not necessarily represent Binds. Our privacy notice explains how
        we process personal data in correspondence and is available at binds.si/privacy.
      </p>
    </ScrollArea>
  );
}
