import { Badge, DescriptionList, DescriptionListItem } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'description-list',
  name: 'DescriptionList',
  category: 'data-display',
  summary: 'Key–value pairs such as account details or contract metadata, using native <dl>.',
  description:
    'Use DescriptionList to show attributes of one thing: an organisation’s settings, a contract’s parties and dates, an integration’s configuration. Choose horizontal for detail pages, vertical for narrow panels and grid for summary headers. Every layout stacks on phones.',
  imports: ['DescriptionList', 'DescriptionListItem'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Horizontal', layout: 'fill' },
    { name: 'Grid', title: 'Grid summary', layout: 'fill' },
    { name: 'Vertical', title: 'Vertical', layout: 'fill' },
  ],
  props: [
    {
      component: 'DescriptionList',
      name: 'layout',
      type: "'horizontal' | 'vertical' | 'grid'",
      default: "'horizontal'",
      description: 'Arrangement of terms and details.',
    },
    {
      component: 'DescriptionList',
      name: 'columns',
      type: '2 | 3 | 4',
      default: '2',
      description: 'Columns for the grid layout.',
    },
    {
      component: 'DescriptionList',
      name: 'dividers',
      type: 'boolean',
      default: 'true for horizontal',
      description: 'Lines between rows.',
    },
    {
      component: 'DescriptionList',
      name: 'items',
      type: '{ term: ReactNode; details: ReactNode; key?: Key }[]',
      description: 'Shorthand to render pairs from data.',
    },
    {
      component: 'DescriptionListItem',
      name: 'term',
      type: 'ReactNode',
      required: true,
      description: 'The label (<dt>).',
    },
    {
      component: 'DescriptionListItem',
      name: 'children',
      type: 'ReactNode',
      description: 'The value (<dd>).',
    },
  ],
  accessibility: [
    'Uses native <dl>, <dt> and <dd>, which screen readers announce as term and definition pairs.',
    'Pairs are grouped in <div> elements, which HTML allows inside <dl>.',
    'Long values wrap instead of overflowing.',
  ],
  guidelines: {
    do: ['Use consistent, short terms.', 'Show "—" for empty values rather than omitting the row.'],
    dont: ['Use for comparisons across many items; use Table.'],
  },
  playground: {
    render: (p) => (
      <DescriptionList
        layout={p.layout as 'horizontal'}
        columns={p.columns as 2}
        items={[
          { term: 'Organisation', details: 'Binds Ltd' },
          { term: 'Plan', details: 'Business' },
          { term: 'Seats', details: '46 of 50' },
          { term: 'Renewal', details: '1 Feb 2027' },
        ]}
      />
    ),
    controls: {
      layout: {
        type: 'select',
        options: ['horizontal', 'vertical', 'grid'],
        default: 'horizontal',
      },
      columns: { type: 'number', default: 2, min: 2, max: 4 },
    },
  },
  related: ['table', 'card'],
};

export function Basic() {
  return (
    <DescriptionList>
      <DescriptionListItem term="Contract">MSA-2026-014</DescriptionListItem>
      <DescriptionListItem term="Counterparty">Northwind Ltd</DescriptionListItem>
      <DescriptionListItem term="Status">
        <Badge tone="success" dot>
          Signed
        </Badge>
      </DescriptionListItem>
      <DescriptionListItem term="Effective date">6 November 2026</DescriptionListItem>
      <DescriptionListItem term="Owner">Priya Raman, Legal</DescriptionListItem>
    </DescriptionList>
  );
}

export function Grid() {
  return (
    <DescriptionList
      layout="grid"
      columns={4}
      items={[
        { term: 'Mailboxes', details: '312' },
        { term: 'Templates', details: '24' },
        { term: 'Relay', details: 'smtp.binds.si' },
        { term: 'Last sync', details: '4 minutes ago' },
      ]}
    />
  );
}

export function Vertical() {
  return (
    <div style={{ maxWidth: 280 }}>
      <DescriptionList
        layout="vertical"
        items={[
          { term: 'Billing contact', details: 'finance@binds.si' },
          { term: 'Billing address', details: '1 Canal Street, Manchester M1 3HE' },
          { term: 'VAT number', details: 'GB 123 4567 89' },
        ]}
      />
    </div>
  );
}
