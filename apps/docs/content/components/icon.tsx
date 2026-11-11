import { Button, Icon, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'icon',
  name: 'Icon',
  category: 'media',
  summary: 'Original Stance icons as inline SVG that inherit the current text colour.',
  description:
    'Stance ships its own icon set, drawn on a 24px grid with a 1.75 stroke and round joins, with no icon-library dependency. Icons are decorative by default and hidden from assistive technology. Give an icon a `label` only when it stands alone and carries meaning.',
  imports: ['Icon'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Sizes', title: 'Sizes' },
    {
      name: 'Meaningful',
      title: 'Meaningful icons',
      description: 'A standalone status icon needs a label.',
    },
    { name: 'InButton', title: 'In a button' },
  ],
  props: [
    {
      component: 'Icon',
      name: 'name',
      type: 'IconName',
      required: true,
      description: 'Icon identifier. See the Icons page for all names.',
    },
    {
      component: 'Icon',
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number",
      default: "'sm'",
      description: '12, 16, 20, 24, 32px or a number.',
    },
    {
      component: 'Icon',
      name: 'strokeWidth',
      type: 'number',
      default: '1.75',
      description: 'Stroke width on the 24px grid.',
    },
    {
      component: 'Icon',
      name: 'label',
      type: 'string',
      description: 'Accessible name; omit for decorative icons.',
    },
  ],
  accessibility: [
    'Without a label, icons get aria-hidden="true" and focusable="false".',
    'With a label, icons get role="img", aria-label and a <title>.',
    'Icons use currentColor, so they follow text colour in all themes and in forced-colours mode.',
  ],
  guidelines: {
    do: ['Pair icons with text for actions.', 'Use the same icon for the same concept everywhere.'],
    dont: ['Use an icon alone without a label.'],
  },
  playground: {
    render: (p) => (
      <Icon name={p.name as 'check'} size={Number(p.size)} strokeWidth={Number(p.strokeWidth)} />
    ),
    controls: {
      name: {
        type: 'select',
        options: [
          'signature',
          'file-text',
          'mail',
          'users',
          'calendar',
          'settings',
          'shield',
          'check-circle',
        ],
        default: 'signature',
      },
      size: { type: 'number', default: 32, min: 12, max: 64, step: 4 },
      strokeWidth: { type: 'number', default: 1.75, min: 1, max: 3, step: 0.25 },
    },
  },
  related: ['icon-gallery', 'icon-button'],
};

export function Basic() {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <Icon name="signature" size="lg" />
      <Icon name="file-text" size="lg" />
      <Icon name="mail" size="lg" />
      <Icon name="users" size="lg" />
      <Icon name="shield" size="lg" />
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <Icon key={s} name="pen-nib" size={s} />
      ))}
    </div>
  );
}

export function Meaningful() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--st-color-success-fg)' }}>
        <Icon name="check-circle" size="md" label="Deployed" />
      </span>
      <Text size="sm" as="span">
        Acme Ltd signature
      </Text>
    </div>
  );
}

export function InButton() {
  return (
    <Button variant="outline" leadingIcon={<Icon name="upload" />}>
      Upload users
    </Button>
  );
}
