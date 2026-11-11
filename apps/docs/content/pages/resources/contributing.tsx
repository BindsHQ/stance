import { Code } from '../../../components/code';
import { site } from '../../../lib/site';

export default function Contributing() {
  return (
    <>
      <h2 id="setup">Development setup</h2>
      <Code
        language="bash"
        code={`git clone ${site.github}.git\ncd stance\nnpm install\nnpm run build\nnpm test\nnpm run dev:docs   # http://localhost:3100`}
      />
      <h2 id="new-component">Adding a component</h2>
      <ol>
        <li>
          Check that the need appears in at least one product and isn’t covered by composing
          existing parts.
        </li>
        <li>
          Create <code>packages/react/src/components/&lt;name&gt;/</code> with the component, CSS,
          tests and <code>index.ts</code>.
        </li>
        <li>
          Use only <code>--st-*</code> tokens in CSS, and test keyboard behaviour and axe in all
          three themes.
        </li>
        <li>
          Add <code>apps/docs/content/components/&lt;name&gt;.tsx</code> with examples and the full
          API.
        </li>
        <li>
          Run <code>npx changeset</code> to describe the change for the release notes.
        </li>
      </ol>
      <p>
        Read <a href={`${site.github}/blob/main/CONTRIBUTING.md`}>CONTRIBUTING.md</a> for the full
        guide and code of conduct.
      </p>
    </>
  );
}
