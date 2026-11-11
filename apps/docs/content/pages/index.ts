import type { GuidePage } from '../../lib/pages-types';
import docs_introduction from './docs/introduction';
import docs_installation from './docs/installation';
import docs_quick_start from './docs/quick-start';
import docs_architecture from './docs/architecture';
import docs_theming from './docs/theming';
import docs_accessibility from './docs/accessibility';
import foundations_colors from './foundations/colors';
import foundations_typography from './foundations/typography';
import foundations_spacing from './foundations/spacing';
import foundations_layout from './foundations/layout';
import foundations_radius from './foundations/radius';
import foundations_elevation from './foundations/elevation';
import foundations_motion from './foundations/motion';
import foundations_icons from './foundations/icons';
import guidelines_principles from './guidelines/principles';
import guidelines_composition from './guidelines/composition';
import guidelines_responsive from './guidelines/responsive';
import guidelines_interaction from './guidelines/interaction';
import guidelines_content from './guidelines/content';
import guidelines_accessibility_standards from './guidelines/accessibility-standards';
import resources_releases from './resources/releases';
import resources_changelog from './resources/changelog';
import resources_contributing from './resources/contributing';
import resources_license from './resources/license';

export const pages: GuidePage[] = [
  {
    section: 'docs',
    slug: 'introduction',
    title: 'Introduction',
    description:
      'Stance is the Binds design system: tokens, themes and accessible React components shared across Binds products.',
    Component: docs_introduction,
  },
  {
    section: 'docs',
    slug: 'installation',
    title: 'Installation',
    description: 'Install the packages, import the styles and load the typeface.',
    Component: docs_installation,
  },
  {
    section: 'docs',
    slug: 'quick-start',
    title: 'Quick start',
    description: 'Set up theming and build your first screen in a few minutes.',
    Component: docs_quick_start,
  },
  {
    section: 'docs',
    slug: 'architecture',
    title: 'Architecture',
    description:
      'How Stance is structured: packages, token layers, styling model and accessibility primitives.',
    Component: docs_architecture,
  },
  {
    section: 'docs',
    slug: 'theming',
    title: 'Theming',
    description:
      'Light, dark and high contrast: how themes work, how to configure them and how to scope them.',
    Component: docs_theming,
  },
  {
    section: 'docs',
    slug: 'accessibility',
    title: 'Accessibility',
    description: 'How Stance approaches WCAG 2.2 AA and what is verified automatically.',
    Component: docs_accessibility,
  },
  {
    section: 'foundations',
    slug: 'colors',
    title: 'Colour',
    description: 'Two brand colours, a derived ink scale and semantic roles for every theme.',
    Component: foundations_colors,
  },
  {
    section: 'foundations',
    slug: 'typography',
    title: 'Typography',
    description: 'DM Sans on a minor-third scale with clear weights and rhythm.',
    Component: foundations_typography,
  },
  {
    section: 'foundations',
    slug: 'spacing',
    title: 'Spacing',
    description: 'A 4px grid for padding, gaps and control sizes.',
    Component: foundations_spacing,
  },
  {
    section: 'foundations',
    slug: 'layout',
    title: 'Layout',
    description: 'Breakpoints, containers and layout principles.',
    Component: foundations_layout,
  },
  {
    section: 'foundations',
    slug: 'radius',
    title: 'Radius',
    description: 'Restrained, geometric corner radii.',
    Component: foundations_radius,
  },
  {
    section: 'foundations',
    slug: 'elevation',
    title: 'Elevation',
    description: 'Shadows and z-index layers across themes.',
    Component: foundations_elevation,
  },
  {
    section: 'foundations',
    slug: 'motion',
    title: 'Motion',
    description: 'Durations and easing that confirm cause and effect.',
    Component: foundations_motion,
  },
  {
    section: 'foundations',
    slug: 'icons',
    title: 'Icons',
    description: 'The Stance icon set: 24px grid, 1.75 stroke, inherits colour.',
    Component: foundations_icons,
  },
  {
    section: 'guidelines',
    slug: 'principles',
    title: 'Design principles',
    description: 'The ideas behind every decision in Stance.',
    Component: guidelines_principles,
  },
  {
    section: 'guidelines',
    slug: 'composition',
    title: 'Composition',
    description: 'Compound components, asChild and controlled state.',
    Component: guidelines_composition,
  },
  {
    section: 'guidelines',
    slug: 'responsive',
    title: 'Responsive design',
    description: 'Mobile-first layouts, touch and reflow.',
    Component: guidelines_responsive,
  },
  {
    section: 'guidelines',
    slug: 'interaction',
    title: 'Interaction patterns',
    description: 'States, overlays, feedback and destructive actions.',
    Component: guidelines_interaction,
  },
  {
    section: 'guidelines',
    slug: 'content',
    title: 'Content guidelines',
    description: 'Voice, tone and writing rules for Binds products.',
    Component: guidelines_content,
  },
  {
    section: 'guidelines',
    slug: 'accessibility-standards',
    title: 'Accessibility standards',
    description: 'A WCAG 2.2 AA checklist for product screens.',
    Component: guidelines_accessibility_standards,
  },
  {
    section: 'resources',
    slug: 'releases',
    title: 'Releases',
    description: 'Versions, packages and the adoption policy.',
    Component: resources_releases,
  },
  {
    section: 'resources',
    slug: 'changelog',
    title: 'Changelog',
    description: 'What changed in each release.',
    Component: resources_changelog,
  },
  {
    section: 'resources',
    slug: 'contributing',
    title: 'Contributing',
    description: 'Set up the repository and add components.',
    Component: resources_contributing,
  },
  {
    section: 'resources',
    slug: 'license',
    title: 'License',
    description: 'Stance is open source under the MIT License.',
    Component: resources_license,
  },
];
