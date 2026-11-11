import type { ReactNode } from 'react';
import { Container, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

const Frame = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      width: '100%',
      background: 'var(--st-color-bg-muted)',
      padding: '12px 0',
      borderRadius: 8,
    }}
  >
    {children}
  </div>
);
const Inner = ({ label }: { label: string }) => (
  <div
    style={{
      padding: 12,
      background: 'var(--st-color-bg-surface)',
      border: '1px solid var(--st-color-border-default)',
      borderRadius: 6,
    }}
  >
    <Text size="sm">{label}</Text>
  </div>
);

export const doc: ComponentDoc = {
  slug: 'container',
  name: 'Container',
  category: 'foundations',
  summary: 'Centres page content with a maximum width and responsive gutters.',
  description:
    'Container sets the readable width of a page region. Sizes come from the size tokens: sm 640, md 880, lg 1240 (the Binds site width) and xl 1440. The side gutters scale from 16 to 40px with the viewport.',
  imports: ['Container'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    { name: 'Sizes', title: 'Sizes', layout: 'fill' },
    { name: 'Landmark', title: 'As a landmark', layout: 'fill' },
  ],
  props: [
    {
      component: 'Container',
      name: 'as',
      type: 'keyof JSX.IntrinsicElements',
      default: "'div'",
      description: 'Element to render, e.g. main or section.',
    },
    {
      component: 'Container',
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl' | 'full'",
      default: "'lg'",
      description: 'Maximum width.',
    },
    {
      component: 'Container',
      name: 'flush',
      type: 'boolean',
      default: 'false',
      description: 'Remove side gutters.',
    },
  ],
  accessibility: [
    'Render page regions as landmarks (`as="main"`, `as="section"` with a label) so they can be navigated.',
  ],
  guidelines: {
    do: ['Use md for forms and long-form reading.', 'Use lg for marketing pages and dashboards.'],
    dont: ['Nest containers; one per region.'],
  },
  related: ['grid', 'stack'],
};

export function Basic() {
  return (
    <Frame>
      <Container size="sm">
        <Inner label="Content is centred at up to 640px wide." />
      </Container>
    </Frame>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'grid', gap: 8, width: '100%' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Frame key={s}>
          <Container size={s}>
            <Inner label={`size="${s}"`} />
          </Container>
        </Frame>
      ))}
    </div>
  );
}

export function Landmark() {
  return (
    <Frame>
      <Container as="section" aria-label="Pricing" size="md">
        <Inner label="A labelled section landmark" />
      </Container>
    </Frame>
  );
}
