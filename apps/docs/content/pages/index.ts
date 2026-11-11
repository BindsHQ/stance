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
import resources_brand from './resources/brand';
import resources_license from './resources/license';

export const pages: GuidePage[] = [
  {
    section: 'docs',
    slug: 'introduction',
    title: 'Introduction',
    description:
      'What Stance is: the open-source Binds design system with design tokens, light, dark and high-contrast themes, and accessible React components.',
    Component: docs_introduction,
  },
  {
    section: 'docs',
    slug: 'installation',
    title: 'Installation',
    description:
      'Install @bindshq/stance-tokens and @bindshq/stance-react, import the styles once, load DM Sans, and use the Tailwind v3 or v4 presets.',
    Component: docs_installation,
  },
  {
    section: 'docs',
    slug: 'quick-start',
    title: 'Quick start',
    description:
      'Set up ThemeProvider and ThemeScript, build a form with FormField and Dialog, add a theme switcher and use Stance tokens in your own CSS.',
    Component: docs_quick_start,
  },
  {
    section: 'docs',
    slug: 'architecture',
    title: 'Architecture',
    description:
      'How Stance is built: two packages, layered design tokens, a plain-CSS styling model and dependency-free accessibility primitives.',
    Component: docs_architecture,
  },
  {
    section: 'docs',
    slug: 'theming',
    title: 'Theming',
    description:
      'Configure light, dark and high-contrast themes in Stance: system detection, persistence, no-flash script, scoped themes and keeping saved preferences.',
    Component: docs_theming,
  },
  {
    section: 'docs',
    slug: 'accessibility',
    title: 'Accessibility',
    description:
      'How Stance meets WCAG 2.2 AA: verified contrast in every theme, axe tests in three modes, WAI-ARIA keyboard patterns and focus management.',
    Component: docs_accessibility,
  },
  {
    section: 'foundations',
    slug: 'colors',
    title: 'Colour',
    description:
      'The two Binds brand colours, the 15-step ink scale interpolated between them, and every semantic colour role for light, dark and high contrast.',
    Component: foundations_colors,
  },
  {
    section: 'foundations',
    slug: 'typography',
    title: 'Typography',
    description:
      'The Stance type system: DM Sans on a 1.2 scale, font sizes, weights, line heights and letter spacing, with guidance for UI and long-form text.',
    Component: foundations_typography,
  },
  {
    section: 'foundations',
    slug: 'spacing',
    title: 'Spacing',
    description:
      'The Stance spacing scale on a 4px grid, shared control heights for buttons and inputs, and rhythm guidance for related elements and sections.',
    Component: foundations_spacing,
  },
  {
    section: 'foundations',
    slug: 'layout',
    title: 'Layout',
    description:
      'Stance breakpoints, container widths and layout principles for mobile-first, intrinsic layouts that reflow cleanly from 320px to wide desktops.',
    Component: foundations_layout,
  },
  {
    section: 'foundations',
    slug: 'radius',
    title: 'Radius',
    description:
      'Stance corner radius tokens from 4px to fully rounded, when to use each one for controls, surfaces and pills, and how to nest rounded corners.',
    Component: foundations_radius,
  },
  {
    section: 'foundations',
    slug: 'elevation',
    title: 'Elevation',
    description:
      'Stance shadow tokens for light and dark themes, solid outlines in high contrast, and the fixed z-index scale for overlays, menus and toasts.',
    Component: foundations_elevation,
  },
  {
    section: 'foundations',
    slug: 'motion',
    title: 'Motion',
    description:
      'Stance motion tokens: durations and easing curves for hover, overlays and dialogs, with reduced-motion support and rules for purposeful animation.',
    Component: foundations_motion,
  },
  {
    section: 'foundations',
    slug: 'icons',
    title: 'Icons',
    description:
      'The original Stance icon set: a 24px grid with 1.75 stroke that inherits text colour, plus a searchable gallery and accessible usage guidance.',
    Component: foundations_icons,
  },
  {
    section: 'guidelines',
    slug: 'principles',
    title: 'Design principles',
    description:
      'The six principles behind Stance: brand-true colour, accessibility by default, precision, editorial restraint, owning the stack and shared foundations.',
    Component: guidelines_principles,
  },
  {
    section: 'guidelines',
    slug: 'composition',
    title: 'Composition',
    description:
      'How to compose Stance components: compound parts, the asChild prop for router links, controlled and uncontrolled state, and extending styles safely.',
    Component: guidelines_composition,
  },
  {
    section: 'guidelines',
    slug: 'responsive',
    title: 'Responsive design',
    description:
      'Responsive guidance for Stance: mobile-first layouts, how components adapt on small screens, touch target sizes, and reflow at 400% zoom.',
    Component: guidelines_responsive,
  },
  {
    section: 'guidelines',
    slug: 'interaction',
    title: 'Interaction patterns',
    description:
      'Interaction patterns in Stance: interactive states, choosing between dialogs, popovers, menus and drawers, feedback timing and destructive actions.',
    Component: guidelines_interaction,
  },
  {
    section: 'guidelines',
    slug: 'content',
    title: 'Content guidelines',
    description:
      'Writing for Binds products with Stance: voice and tone, sentence case, verb-first buttons, helpful errors, empty states, numbers and dates.',
    Component: guidelines_content,
  },
  {
    section: 'guidelines',
    slug: 'accessibility-standards',
    title: 'Accessibility standards',
    description:
      'A practical WCAG 2.2 AA checklist for product screens built with Stance, organised as perceivable, operable, understandable and robust.',
    Component: guidelines_accessibility_standards,
  },
  {
    section: 'resources',
    slug: 'releases',
    title: 'Releases',
    description:
      'Stance release history and package versions, how @bindshq/stance-tokens and @bindshq/stance-react are versioned, and the product adoption policy.',
    Component: resources_releases,
  },
  {
    section: 'resources',
    slug: 'changelog',
    title: 'Changelog',
    description:
      'Every notable change to Stance by release, starting with 0.1.1: tokens, themes, components, accessibility primitives and the documentation site.',
    Component: resources_changelog,
  },
  {
    section: 'resources',
    slug: 'contributing',
    title: 'Contributing',
    description:
      'How to contribute to Stance: development setup, adding a component with tests and docs, the checks every pull request passes, and changesets.',
    Component: resources_contributing,
  },
  {
    section: 'resources',
    slug: 'brand',
    title: 'Brand',
    description:
      'The official Stance logo, mark and app icons in SVG and PNG, with colour rules, clear space, minimum sizes and downloads for every variant.',
    Component: resources_brand,
  },
  {
    section: 'resources',
    slug: 'license',
    title: 'License',
    description:
      'Stance is open source under the MIT License. Read the full licence text and the note on Binds and Stance trademarks and logos.',
    Component: resources_license,
  },
];
