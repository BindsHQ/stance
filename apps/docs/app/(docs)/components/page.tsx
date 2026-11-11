import type { Metadata } from 'next';
import { ComponentIndex } from '../../../components/component-index';
import { JsonLd } from '../../../components/json-ld';
import { components } from '../../../lib/routes';
import { absolute, breadcrumbLd, pageMetadata } from '../../../lib/seo';

export const metadata: Metadata = pageMetadata('/components');

export default function Page() {
  return (
    <>
      <JsonLd
        graph={[
          breadcrumbLd('/components'),
          {
            '@type': 'CollectionPage',
            '@id': `${absolute('/components')}#page`,
            name: 'Stance components',
            url: absolute('/components'),
            isPartOf: { '@id': `${absolute('/')}#website` },
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: components.length,
              itemListElement: components.map((c, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: c.name,
                description: c.summary,
                url: absolute(`/components/${c.slug}`),
              })),
            },
          },
        ]}
      />
      <ComponentIndex />
    </>
  );
}
