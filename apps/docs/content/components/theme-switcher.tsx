import { ThemeSwitcher } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'theme-switcher',
  name: 'ThemeSwitcher',
  category: 'theming',
  summary: 'A segmented control that lets people choose light, dark, high contrast or system.',
  description:
    'ThemeSwitcher reads and writes the ThemeProvider preference. Place it where people expect appearance settings: a header, footer or settings page. Limit the options when a product only supports some modes, but always keep high contrast available where possible.',
  imports: ['ThemeSwitcher'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Icons' },
    {
      name: 'WithLabels',
      title: 'With labels',
      description: 'Visible labels suit settings pages.',
    },
    {
      name: 'Small',
      title: 'Compact',
      description: 'The small size fits dense headers and footers.',
    },
    { name: 'LimitedOptions', title: 'Limited options' },
  ],
  props: [
    {
      component: 'ThemeSwitcher',
      name: 'showLabels',
      type: 'boolean',
      default: 'false',
      description: 'Show text beside each icon. Icons alone get accessible names and titles.',
    },
    {
      component: 'ThemeSwitcher',
      name: 'options',
      type: "Array<'light' | 'dark' | 'high-contrast' | 'system'>",
      default: 'all four',
      description: 'Which choices to offer.',
    },
    {
      component: 'ThemeSwitcher',
      name: 'label',
      type: 'string',
      default: "'Theme'",
      description: 'Accessible name of the radio group.',
    },
    {
      component: 'ThemeSwitcher',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Control size.',
    },
  ],
  accessibility: [
    'A radiogroup of radio buttons with aria-checked; the group is named “Theme” by default.',
    'One tab stop: arrow keys move between options and select them, matching native radio groups.',
    'Icon-only options have accessible names and visible tooltips through title.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves focus into and out of the group.' },
    { keys: ['←', '→'], description: 'Selects the previous or next theme.' },
    { keys: ['Home', 'End'], description: 'Moves to the first or last option.' },
  ],
  guidelines: {
    do: [
      'Offer System so the product follows operating-system changes.',
      'Keep the switcher in the same place on every page.',
    ],
    dont: [
      'Hide high contrast behind a separate setting.',
      'Use a switch for three or more options.',
    ],
  },
  related: ['theme-provider', 'toggle-button'],
};

export function Basic() {
  return <ThemeSwitcher />;
}

export function WithLabels() {
  return <ThemeSwitcher showLabels />;
}

export function Small() {
  return <ThemeSwitcher size="sm" />;
}

export function LimitedOptions() {
  return <ThemeSwitcher showLabels options={['light', 'dark', 'system']} label="Appearance" />;
}
