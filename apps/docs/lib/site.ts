export const site = {
  name: 'Stance',
  tagline: 'The Binds Design System',
  description:
    'Stance is the official open-source design system by Binds: design tokens, three appearance modes and accessible, dependency-free React components.',
  url: 'https://stanceui.com',
  github: 'https://github.com/BindsHQ/stance',
  npmTokens: 'https://www.npmjs.com/package/@bindshq/stance-tokens',
  npmReact: 'https://www.npmjs.com/package/@bindshq/stance-react',
  binds: 'https://binds.si',
  version: '0.1.1',
};

export interface NavItem {
  title: string;
  href: string;
}
export interface NavSection {
  title: string;
  items: NavItem[];
}

export const guideNav: NavSection[] = [
  {
    title: 'Getting started',
    items: [
      { title: 'Introduction', href: '/docs/introduction' },
      { title: 'Platform strategy', href: '/docs/platforms' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Quick start', href: '/docs/quick-start' },
      { title: 'Architecture', href: '/docs/architecture' },
      { title: 'Theming', href: '/docs/theming' },
      { title: 'Accessibility', href: '/docs/accessibility' },
    ],
  },
  {
    title: 'Foundations',
    items: [
      { title: 'Colour', href: '/foundations/colors' },
      { title: 'Typography', href: '/foundations/typography' },
      { title: 'Spacing', href: '/foundations/spacing' },
      { title: 'Layout', href: '/foundations/layout' },
      { title: 'Radius', href: '/foundations/radius' },
      { title: 'Elevation', href: '/foundations/elevation' },
      { title: 'Motion', href: '/foundations/motion' },
      { title: 'Icons', href: '/foundations/icons' },
      { title: 'Design tokens', href: '/foundations/design-tokens' },
    ],
  },
  {
    title: 'Patterns',
    items: [
      { title: 'Forms', href: '/patterns/forms' },
      { title: 'Authentication', href: '/patterns/authentication' },
      { title: 'Dashboards', href: '/patterns/dashboards' },
      { title: 'Data tables', href: '/patterns/data-tables' },
      { title: 'Navigation', href: '/patterns/navigation' },
      { title: 'Search and filtering', href: '/patterns/search' },
      { title: 'Notifications and feedback', href: '/patterns/notifications' },
      { title: 'Documents and signatures', href: '/patterns/documents' },
    ],
  },
  {
    title: 'Guidelines',
    items: [
      { title: 'Design principles', href: '/guidelines/principles' },
      { title: 'Composition', href: '/guidelines/composition' },
      { title: 'Responsive design', href: '/guidelines/responsive' },
      { title: 'Interaction patterns', href: '/guidelines/interaction' },
      { title: 'Content', href: '/guidelines/content' },
      { title: 'Accessibility standards', href: '/guidelines/accessibility-standards' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { title: 'Releases', href: '/resources/releases' },
      { title: 'Changelog', href: '/resources/changelog' },
      { title: 'Contributing', href: '/resources/contributing' },
      { title: 'Brand', href: '/resources/brand' },
      { title: 'License', href: '/resources/license' },
    ],
  },
];

export const categoryLabels: Record<string, string> = {
  theming: 'Theming',
  foundations: 'Layout',
  typography: 'Typography',
  actions: 'Actions',
  forms: 'Forms',
  navigation: 'Navigation',
  'data-display': 'Data display',
  feedback: 'Feedback',
  overlays: 'Overlays',
  media: 'Media & code',
  advanced: 'Advanced',
};
export const categoryOrder = Object.keys(categoryLabels);
