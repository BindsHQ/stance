import { Button, Separator, Text } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'separator',
  name: 'Separator',
  category: 'foundations',
  summary: 'A thin rule between groups in menus, toolbars and lists.',
  description:
    'Separator is a quiet one-pixel line. It is decorative by default and hidden from assistive technology. Set `decorative={false}` when it divides meaningful groups, for example in a toolbar. For section breaks in page content, use Divider.',
  imports: ['Separator'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Horizontal', layout: 'fill' },
    { name: 'Vertical', title: 'Vertical in a toolbar' },
    { name: 'InList', title: 'Between list groups', layout: 'start' },
  ],
  props: [
    {
      component: 'Separator',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: "'horizontal'",
      description: 'Line direction.',
    },
    {
      component: 'Separator',
      name: 'decorative',
      type: 'boolean',
      default: 'true',
      description: 'Hide from assistive technology; false exposes role="separator".',
    },
  ],
  accessibility: [
    'Decorative separators use role="none".',
    'Semantic separators expose role="separator" and aria-orientation when vertical.',
  ],
  guidelines: {
    do: ['Use between groups of related actions.'],
    dont: ['Use as a heading underline.'],
  },
  related: ['divider', 'toolbar', 'dropdown-menu'],
};

export function Basic() {
  return (
    <div style={{ width: '100%', display: 'grid', gap: 12 }}>
      <Text size="sm">Account</Text>
      <Separator />
      <Text size="sm">Organisation</Text>
    </div>
  );
}

export function Vertical() {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}
    >
      <Button variant="ghost" size="sm">
        Bold
      </Button>
      <Button variant="ghost" size="sm">
        Italic
      </Button>
      <Separator orientation="vertical" decorative={false} />
      <Button variant="ghost" size="sm">
        Link
      </Button>
    </div>
  );
}

export function InList() {
  return (
    <div style={{ width: 220, display: 'grid', gap: 6 }}>
      <Text size="sm">Rename</Text>
      <Text size="sm">Duplicate</Text>
      <Separator />
      <Text size="sm" tone="danger">
        Delete template
      </Text>
    </div>
  );
}
