import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
  CardTitle,
  Icon,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'card',
  name: 'Card',
  category: 'data-display',
  summary: 'A contained surface for related content, with header, media, content and footer parts.',
  description:
    'Use Card to group information about one subject, such as a template, contract or integration. Cards can be static, contain actions, or be fully clickable through CardLink. Avoid nesting cards inside cards.',
  imports: [
    'Card',
    'CardHeader',
    'CardTitle',
    'CardDescription',
    'CardContent',
    'CardFooter',
    'CardMedia',
    'CardLink',
  ],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    { name: 'Variants', title: 'Variants' },
    {
      name: 'Interactive',
      title: 'Clickable card',
      description:
        'CardLink stretches its hit area across the card. Header actions stay clickable above it.',
    },
    { name: 'WithMedia', title: 'With media' },
  ],
  props: [
    {
      component: 'Card',
      name: 'variant',
      type: "'outline' | 'elevated' | 'filled'",
      default: "'outline'",
      description: 'Surface treatment.',
    },
    {
      component: 'Card',
      name: 'padding',
      type: "'none' | 'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Inner padding.',
    },
    {
      component: 'Card',
      name: 'interactive',
      type: 'boolean',
      default: 'false',
      description: 'Make the card a click target through its CardLink.',
    },
    {
      component: 'Card',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render as the child element, e.g. <article>.',
    },
    {
      component: 'CardHeader',
      name: 'actions',
      type: 'ReactNode',
      description: 'Trailing header actions.',
    },
    {
      component: 'CardTitle',
      name: 'level',
      type: '2 | 3 | 4 | 5 | 6',
      default: '3',
      description: 'Heading level.',
    },
    {
      component: 'CardFooter',
      name: 'align',
      type: "'start' | 'end' | 'between'",
      default: "'end'",
      description: 'Footer alignment.',
    },
    {
      component: 'CardMedia',
      name: 'ratio',
      type: 'number | string',
      default: "'16 / 9'",
      description: 'Aspect ratio of the media area.',
    },
    {
      component: 'CardLink',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your router link as the card link.',
    },
  ],
  accessibility: [
    'CardTitle renders a real heading; choose a level that fits the page outline.',
    'Clickable cards use one real link (CardLink) rather than onClick on a div. Its accessible name is the title, so screen-reader link lists stay concise.',
    'Buttons and links in an interactive card are lifted above the stretched link, so they stay independently operable.',
    'The focus ring is drawn around the whole card while its link has keyboard focus.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves to the card link, then to any actions in the card.' },
  ],
  guidelines: {
    do: [
      'Keep one primary action per card.',
      'Use asChild with <article> for self-contained content.',
    ],
    dont: ['Wrap a whole card in <a> when it contains buttons.', 'Nest cards.'],
  },
  playground: {
    render: (p) => (
      <Card variant={p.variant as 'outline'} padding={p.padding as 'md'} style={{ maxWidth: 360 }}>
        <CardHeader>
          <CardTitle>Sales 2026</CardTitle>
          <CardDescription>Default signature for the sales team</CardDescription>
        </CardHeader>
        <CardContent>Assigned to 48 people across 3 offices.</CardContent>
      </Card>
    ),
    controls: {
      variant: { type: 'select', options: ['outline', 'elevated', 'filled'], default: 'outline' },
      padding: { type: 'select', options: ['none', 'sm', 'md', 'lg'], default: 'md' },
    },
  },
  related: ['stat-card', 'list', 'empty-state'],
};

export function Basic() {
  return (
    <Card style={{ maxWidth: 380 }}>
      <CardHeader
        actions={
          <Badge tone="success" dot>
            Live
          </Badge>
        }
      >
        <CardTitle>Exchange relay</CardTitle>
        <CardDescription>Deploys signatures to Microsoft 365 mailboxes.</CardDescription>
      </CardHeader>
      <CardContent>Last sync 4 minutes ago · 312 mailboxes</CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">
          View logs
        </Button>
        <Button size="sm">Sync now</Button>
      </CardFooter>
    </Card>
  );
}

export function Variants() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        width: '100%',
      }}
    >
      {(['outline', 'elevated', 'filled'] as const).map((v) => (
        <Card key={v} variant={v}>
          <CardTitle>{v[0]!.toUpperCase() + v.slice(1)}</CardTitle>
          <CardDescription>3 contracts awaiting review</CardDescription>
        </Card>
      ))}
    </div>
  );
}

export function Interactive() {
  return (
    <Card interactive style={{ maxWidth: 380 }}>
      <CardHeader
        actions={
          <Button size="xs" variant="ghost" aria-label="Duplicate Executive template">
            <Icon name="copy" />
          </Button>
        }
      >
        <CardTitle>
          <CardLink href="#executive">Executive</CardLink>
        </CardTitle>
        <CardDescription>Used by 6 people · edited last week</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function WithMedia() {
  return (
    <Card style={{ maxWidth: 340 }}>
      <CardMedia ratio="16 / 7" aria-hidden="true">
        <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice">
          <rect width="320" height="140" fill="currentColor" opacity="0.06" />
          <rect x="24" y="36" width="120" height="10" rx="5" fill="currentColor" opacity="0.5" />
          <rect x="24" y="56" width="180" height="8" rx="4" fill="currentColor" opacity="0.25" />
          <rect x="24" y="72" width="150" height="8" rx="4" fill="currentColor" opacity="0.25" />
        </svg>
      </CardMedia>
      <CardHeader>
        <CardTitle>Minimal</CardTitle>
        <CardDescription>A clean, single-column signature layout.</CardDescription>
      </CardHeader>
      <CardFooter align="between">
        <Badge>Gallery</Badge>
        <Button size="sm" variant="outline">
          Use template
        </Button>
      </CardFooter>
    </Card>
  );
}
