import { Avatar } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'avatar',
  name: 'Avatar',
  category: 'data-display',
  summary: 'A person or organisation shown as an image or initials, with optional presence.',
  description:
    'Avatar shows who something belongs to. Without an image, or if it fails to load, it shows initials on a tint taken from the name, so a person keeps the same colour everywhere. Tints are mixes of ivory and indigo, so they stay within the Binds palette in every theme.',
  imports: ['Avatar'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Sizes', title: 'Sizes' },
    { name: 'Status', title: 'Presence' },
    {
      name: 'Shapes',
      title: 'Organisations',
      description: 'Use the square shape for organisations and workspaces.',
    },
  ],
  props: [
    {
      component: 'Avatar',
      name: 'name',
      type: 'string',
      required: true,
      description: 'Used for initials, tint and the accessible name.',
    },
    {
      component: 'Avatar',
      name: 'src',
      type: 'string',
      description: 'Image URL; falls back to initials while loading or on error.',
    },
    {
      component: 'Avatar',
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: '20, 28, 36, 48 or 64px.',
    },
    {
      component: 'Avatar',
      name: 'shape',
      type: "'circle' | 'square'",
      default: "'circle'",
      description: 'Square suits organisations.',
    },
    {
      component: 'Avatar',
      name: 'status',
      type: "'online' | 'away' | 'busy' | 'offline'",
      description: 'Presence dot.',
    },
    {
      component: 'Avatar',
      name: 'statusLabel',
      type: 'string',
      description: 'Announced status text; defaults to the status name.',
    },
    {
      component: 'Avatar',
      name: 'decorative',
      type: 'boolean',
      default: 'false',
      description: 'Hide from assistive tech when the name is already visible.',
    },
  ],
  accessibility: [
    'Exposed as role="img" named after the person, including status, e.g. "Ada Lovelace (online)".',
    'The inner image has an empty alt, so the name is not announced twice.',
    'Set decorative when the name appears as text next to the avatar.',
    'Presence is announced in text; the coloured dot is visual reinforcement only.',
  ],
  guidelines: {
    do: ['Show the person’s name next to small avatars.'],
    dont: ['Use avatars as the only way to identify people in dense lists.'],
  },
  playground: {
    render: (p) => (
      <Avatar
        name={p.name as string}
        size={p.size as 'md'}
        shape={p.shape as 'circle'}
        status={(p.status as string) === 'none' ? undefined : (p.status as 'online')}
      />
    ),
    controls: {
      name: { type: 'text', default: 'Amara Okafor' },
      size: { type: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'lg' },
      shape: { type: 'select', options: ['circle', 'square'], default: 'circle' },
      status: {
        type: 'select',
        options: ['none', 'online', 'away', 'busy', 'offline'],
        default: 'none',
      },
    },
  },
  related: ['avatar-group', 'list-item'],
};

export function Basic() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Avatar name="Amara Okafor" />
      <Avatar name="Lukas Novak" />
      <Avatar name="Priya Raman" />
      <Avatar name="Tomás Ferreira" />
      <Avatar name="Hana Sato" />
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <Avatar key={s} name="Priya Raman" size={s} />
      ))}
    </div>
  );
}

export function Status() {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <Avatar name="Amara Okafor" size="lg" status="online" />
      <Avatar name="Lukas Novak" size="lg" status="away" />
      <Avatar name="Priya Raman" size="lg" status="busy" statusLabel="In a meeting" />
      <Avatar name="Oliver Grant" size="lg" status="offline" />
    </div>
  );
}

export function Shapes() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Avatar name="Binds" shape="square" size="lg" />
      <Avatar name="eSignify" shape="square" size="lg" />
      <Avatar name="Northwind Ltd" shape="square" size="lg" />
    </div>
  );
}
