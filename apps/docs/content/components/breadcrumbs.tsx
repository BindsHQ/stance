import { BreadcrumbItem, Breadcrumbs, Icon } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'breadcrumbs',
  name: 'Breadcrumbs',
  category: 'navigation',
  summary: 'Shows where the current page sits in a hierarchy and links back up it.',
  description:
    'Use Breadcrumbs on pages that are two or more levels deep, such as a template inside a team inside an organisation. They complement, not replace, primary navigation. Long trails collapse their middle items behind an expandable ellipsis, and on screens narrower than 640px they collapse to the first and last items.',
  imports: ['Breadcrumbs', 'BreadcrumbItem'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic' },
    {
      name: 'Collapsed',
      title: 'Collapsed trail',
      description:
        'More items than maxItems collapse behind an ellipsis button that reveals them and moves focus to the first revealed link.',
    },
    { name: 'CustomSeparator', title: 'Custom separator and icons' },
    {
      name: 'WithRouterLinks',
      title: 'With router links',
      description: 'Use asChild to render your framework link component, such as Next.js Link.',
    },
  ],
  props: [
    {
      component: 'Breadcrumbs',
      name: 'label',
      type: 'string',
      default: "'Breadcrumb'",
      description: 'Accessible name of the navigation landmark.',
    },
    {
      component: 'Breadcrumbs',
      name: 'separator',
      type: 'ReactNode',
      default: 'chevron icon',
      description: 'Content between items; always hidden from assistive technology.',
    },
    {
      component: 'Breadcrumbs',
      name: 'maxItems',
      type: 'number',
      default: '5',
      description: 'Collapse middle items when there are more items than this.',
    },
    {
      component: 'Breadcrumbs',
      name: 'itemsBeforeCollapse',
      type: 'number',
      default: '1',
      description: 'Items kept before the ellipsis.',
    },
    {
      component: 'Breadcrumbs',
      name: 'itemsAfterCollapse',
      type: 'number',
      default: '2',
      description: 'Items kept after the ellipsis.',
    },
    {
      component: 'Breadcrumbs',
      name: 'collapseOnMobile',
      type: 'boolean',
      default: 'true',
      description: 'Below 640px, show only the first and last items.',
    },
    {
      component: 'Breadcrumbs',
      name: 'expandLabel',
      type: 'string',
      default: "'Show all breadcrumbs'",
      description: 'Accessible label for the ellipsis button.',
    },
    {
      component: 'Breadcrumbs',
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Text size.',
    },
    {
      component: 'BreadcrumbItem',
      name: 'href',
      type: 'string',
      description: 'Destination. Items without href render as text.',
    },
    {
      component: 'BreadcrumbItem',
      name: 'current',
      type: 'boolean',
      default: 'false',
      description: 'Marks the current page with aria-current="page" and renders plain text.',
    },
    {
      component: 'BreadcrumbItem',
      name: 'icon',
      type: 'ReactNode',
      description: 'Icon before the label.',
    },
    {
      component: 'BreadcrumbItem',
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'Render your own link element with breadcrumb styles.',
    },
  ],
  accessibility: [
    'Renders a <nav> landmark with an accessible name and an ordered list, so screen readers announce the number of levels.',
    'The current page is plain text with aria-current="page"; it is not a link to itself.',
    'Separators are aria-hidden, so they are not read as “greater than” or similar.',
    'The ellipsis is a real button announcing how many items are hidden; after expanding, focus moves to the first revealed link.',
  ],
  keyboard: [
    { keys: ['Tab'], description: 'Moves between links and the expand button.' },
    { keys: ['Enter'], description: 'Follows a link or expands the collapsed items.' },
  ],
  guidelines: {
    do: [
      'Use the page title as the last item.',
      'Keep labels short; long labels truncate at 16rem.',
    ],
    dont: [
      'Use breadcrumbs for linear flows; use Stepper.',
      'Show breadcrumbs on top-level pages where there is nothing above.',
    ],
  },
  related: ['sidebar', 'tabs', 'link'],
};

export function Basic() {
  return (
    <Breadcrumbs>
      <BreadcrumbItem href="#dashboard">Dashboard</BreadcrumbItem>
      <BreadcrumbItem href="#templates">Templates</BreadcrumbItem>
      <BreadcrumbItem current>Sales signature</BreadcrumbItem>
    </Breadcrumbs>
  );
}

export function Collapsed() {
  return (
    <Breadcrumbs maxItems={3}>
      <BreadcrumbItem href="#org">Binds</BreadcrumbItem>
      <BreadcrumbItem href="#teams">Teams</BreadcrumbItem>
      <BreadcrumbItem href="#sales">Sales</BreadcrumbItem>
      <BreadcrumbItem href="#emea">EMEA</BreadcrumbItem>
      <BreadcrumbItem href="#templates">Templates</BreadcrumbItem>
      <BreadcrumbItem current>Q4 campaign banner</BreadcrumbItem>
    </Breadcrumbs>
  );
}

export function CustomSeparator() {
  return (
    <Breadcrumbs separator="/">
      <BreadcrumbItem href="#home" icon={<Icon name="home" size={14} />}>
        Home
      </BreadcrumbItem>
      <BreadcrumbItem href="#settings">Settings</BreadcrumbItem>
      <BreadcrumbItem current>Billing</BreadcrumbItem>
    </Breadcrumbs>
  );
}

export function WithRouterLinks() {
  // Replace <a> with your router's Link component.
  return (
    <Breadcrumbs>
      <BreadcrumbItem asChild>
        <a href="#workspace">Workspace</a>
      </BreadcrumbItem>
      <BreadcrumbItem asChild>
        <a href="#integrations">Integrations</a>
      </BreadcrumbItem>
      <BreadcrumbItem current>Exchange relay</BreadcrumbItem>
    </Breadcrumbs>
  );
}
