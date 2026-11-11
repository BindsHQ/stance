import { RichText } from '@bindshq/stance-react';
import type { ComponentDoc } from '../../lib/docs-types';

export const doc: ComponentDoc = {
  slug: 'rich-text',
  name: 'RichText',
  category: 'typography',
  summary: 'Typographic rhythm for long-form content: legal pages, help articles, MDX.',
  description:
    'Wrap rendered long-form content in RichText to style headings, paragraphs, lists, quotes, tables and code with consistent rhythm. It only styles its descendants. It never parses or injects HTML, so sanitise and convert any untrusted HTML before rendering it.',
  imports: ['RichText'],
  status: 'stable',
  examples: [
    { name: 'Basic', title: 'Article', layout: 'start' },
    { name: 'Small', title: 'Compact', layout: 'start' },
  ],
  props: [
    {
      component: 'RichText',
      name: 'as',
      type: 'keyof JSX.IntrinsicElements',
      default: "'div'",
      description: 'Element; use article for standalone documents.',
    },
    {
      component: 'RichText',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Base body size.',
    },
    {
      component: 'RichText',
      name: 'measure',
      type: 'boolean',
      default: 'true',
      description: 'Limit line length to about 70 characters.',
    },
  ],
  accessibility: [
    'Preserves your semantic structure; keep a logical heading order.',
    'Links inside are underlined and have visible focus.',
  ],
  guidelines: {
    do: ['Use for legal, help and marketing articles.'],
    dont: ['Pass unsanitised HTML from users into the page.'],
  },
  related: ['heading', 'text'],
};

export function Basic() {
  return (
    <RichText as="article">
      <h2>How signature deployment works</h2>
      <p>
        When you publish a template, Binds generates a personalised signature for every user in your
        organisation and deploys it through your <a href="#exchange">Exchange connection</a>.
      </p>
      <ul>
        <li>Personal details come from your directory.</li>
        <li>Changes reach every mailbox within five minutes.</li>
      </ul>
      <blockquote>Consistent signatures reinforce the brand in every email you send.</blockquote>
      <h3>Requirements</h3>
      <p>
        An administrator must grant consent once. Use <code>Connect Microsoft 365</code> in
        Integrations.
      </p>
    </RichText>
  );
}

export function Small() {
  return (
    <RichText size="sm">
      <h3>Data retention</h3>
      <p>We keep signature history for 12 months, then delete it automatically.</p>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Retention</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Templates</td>
            <td>Until deleted</td>
          </tr>
          <tr>
            <td>Audit log</td>
            <td>12 months</td>
          </tr>
        </tbody>
      </table>
    </RichText>
  );
}
