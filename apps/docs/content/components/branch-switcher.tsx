import * as React from 'react';
import { BranchSwitcher, Message, MessageActions } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'branch-switcher',
  name: 'BranchSwitcher',
  category: 'ai',
  summary:
    'Steps between alternative versions of a message after an edit or a retry, and shows which one is on screen.',
  description:
    'When a message is edited or an answer is regenerated, keep the earlier versions and let people move between them with BranchSwitcher. It shows the position, for example 2 of 3, and reports the new index. It renders nothing when there is only one version.',
  imports: ['BranchSwitcher'],
  status: 'beta',
  examples: [
    { name: 'Basic', title: 'Uncontrolled' },
    {
      name: 'Controlled',
      title: 'Switching the answer',
      description: 'The index is zero based.',
      layout: 'fill',
    },
    { name: 'Translated', title: 'Translated labels' },
  ],
  props: [
    {
      component: 'BranchSwitcher',
      name: 'count',
      type: 'number',
      required: true,
      description: 'How many versions exist. Nothing renders for fewer than two.',
    },
    {
      component: 'BranchSwitcher',
      name: 'index',
      type: 'number',
      description: 'Controlled, zero based index of the version on screen.',
    },
    {
      component: 'BranchSwitcher',
      name: 'defaultIndex',
      type: 'number',
      description: 'Initial index when uncontrolled. Default: the last version.',
    },
    {
      component: 'BranchSwitcher',
      name: 'onIndexChange',
      type: '(index: number) => void',
      description: 'Called with the new zero based index.',
    },
    {
      component: 'BranchSwitcher',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disable both buttons, for example while a response streams.',
    },
    {
      component: 'BranchSwitcher',
      name: 'size',
      type: "'xs' | 'sm'",
      default: "'xs'",
      description: 'Button size.',
    },
    {
      component: 'BranchSwitcher',
      name: 'labels',
      type: 'Partial<BranchSwitcherLabels>',
      description:
        'Translations: group, previous, next, and position as a function of index and count.',
    },
  ],
  accessibility: [
    'A labelled group with Previous version and Next version buttons.',
    'The position text is a polite live region, so a change is read as 2 of 3.',
    'At the first and last version the button is marked disabled but keeps focus, so keyboard users do not lose their place.',
    'The arrows mirror in right to left layouts.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between the two buttons.' },
    { keys: ['Enter', 'Space'], description: 'Shows the previous or next version.' },
  ],
  guidelines: {
    do: ['Place it beside the message actions of the message it belongs to.'],
    dont: ['Use it for paging through unrelated content; use Pagination.'],
  },
  related: ['message-actions', 'message', 'pagination'],
};

const versions = [
  'The notice period is 60 days.',
  'Either side must give 60 days written notice.',
  'You need to give notice in writing, 60 days ahead.',
];

export function Basic() {
  return <BranchSwitcher count={3} />;
}

export function Controlled() {
  const [index, setIndex] = React.useState(0);
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <Message
        author="Assistant"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <BranchSwitcher count={versions.length} index={index} onIndexChange={setIndex} />
            <MessageActions copyValue={versions[index]} />
          </div>
        }
      >
        {versions[index]}
      </Message>
    </div>
  );
}

export function Translated() {
  return (
    <BranchSwitcher
      count={4}
      defaultIndex={1}
      labels={{
        group: 'Versionen',
        previous: 'Vorherige Version',
        next: 'Nächste Version',
        position: (index, count) => `${index + 1} von ${count}`,
      }}
    />
  );
}
