import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'accordion',
  name: 'Accordion',
  category: 'data-display',
  summary: 'Stacked headings that each reveal a section, with single or multiple open items.',
  description:
    'Use Accordion to shorten long pages whose sections people read selectively, such as FAQs, settings groups and policy details. Avoid hiding content everyone needs. Built on the WAI-ARIA accordion pattern with real headings and buttons.',
  imports: ['Accordion', 'AccordionItem', 'AccordionTrigger', 'AccordionContent'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Basic', layout: 'fill' },
    { name: 'Multiple', title: 'Multiple open', layout: 'fill' },
    { name: 'Separated', title: 'Separated variant', layout: 'fill' },
  ],
  props: [
    {
      component: 'Accordion',
      name: 'type',
      type: "'single' | 'multiple'",
      default: "'single'",
      description: 'One or many open items.',
    },
    {
      component: 'Accordion',
      name: 'value',
      type: 'string | null | string[]',
      description: 'Controlled open item(s).',
    },
    {
      component: 'Accordion',
      name: 'defaultValue',
      type: 'string | null | string[]',
      description: 'Initially open item(s).',
    },
    {
      component: 'Accordion',
      name: 'onValueChange',
      type: '(value) => void',
      description: 'Called when items open or close.',
    },
    {
      component: 'Accordion',
      name: 'collapsible',
      type: 'boolean',
      default: 'true',
      description: 'Single mode: allow closing the open item.',
    },
    {
      component: 'Accordion',
      name: 'headingLevel',
      type: '2 | 3 | 4 | 5 | 6',
      default: '3',
      description: 'Heading level wrapping each trigger.',
    },
    {
      component: 'Accordion',
      name: 'variant',
      type: "'default' | 'separated'",
      default: "'default'",
      description: 'Ruled list or separate panels.',
    },
    {
      component: 'Accordion',
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disable all items.',
    },
    {
      component: 'AccordionItem',
      name: 'value',
      type: 'string',
      required: true,
      description: 'Unique item value.',
    },
    {
      component: 'AccordionItem',
      name: 'disabled',
      type: 'boolean',
      description: 'Disable this item.',
    },
    {
      component: 'AccordionTrigger',
      name: 'hideIndicator',
      type: 'boolean',
      default: 'false',
      description: 'Hide the chevron.',
    },
    {
      component: 'AccordionContent',
      name: 'forceMount',
      type: 'boolean',
      default: 'false',
      description: 'Keep mounted while closed.',
    },
  ],
  accessibility: [
    'Each trigger is a button inside a heading, with aria-expanded and aria-controls.',
    'Each panel is a region labelled by its trigger.',
    'Arrow keys, Home and End move between headers; disabled items are skipped.',
    'Closed panels are removed from the accessibility tree.',
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], description: 'Opens or closes the focused section.' },
    { keys: ['ArrowDown', 'ArrowUp'], description: 'Moves to the next or previous header.' },
    { keys: ['Home', 'End'], description: 'Moves to the first or last header.' },
    { keys: ['Tab'], description: 'Moves through headers and into open panels.' },
  ],
  guidelines: {
    do: ['Write triggers as clear questions or section names.'],
    dont: ['Nest accordions.', 'Hide critical information in a closed panel.'],
  },
  related: ['collapsible', 'tabs'],
};

const faqs = [
  [
    'deploy',
    'How are signatures deployed?',
    'eSignify pushes signatures through your Exchange relay, so every email sent from Outlook, mobile or web gets the right signature.',
  ],
  [
    'change',
    'Can people edit their own details?',
    'Yes. Admins choose which fields people can edit, such as job title or phone number. Everything else is locked to the template.',
  ],
  [
    'remove',
    'What happens when someone leaves?',
    'Removing a user stops future deployments. Their last signature stays in sent mail but is no longer updated.',
  ],
] as const;

export function Basic() {
  return (
    <Accordion defaultValue="deploy">
      {faqs.map(([value, q, a]) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{q}</AccordionTrigger>
          <AccordionContent>{a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function Multiple() {
  return (
    <Accordion type="multiple" defaultValue={['deploy', 'change']}>
      {faqs.map(([value, q, a]) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{q}</AccordionTrigger>
          <AccordionContent>{a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function Separated() {
  return (
    <Accordion variant="separated" headingLevel={4}>
      <AccordionItem value="relay">
        <AccordionTrigger>Exchange relay</AccordionTrigger>
        <AccordionContent>Connected to smtp.binds.si on port 587.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="azure">
        <AccordionTrigger>Azure AD sync</AccordionTrigger>
        <AccordionContent>Syncs users and departments every hour.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="google" disabled>
        <AccordionTrigger>Google Workspace (coming soon)</AccordionTrigger>
        <AccordionContent>Not yet available.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
