import { Code } from '../../../components/code';

export default function Composition() {
  return (
    <>
      <p>Stance favours small parts that compose over large components with many props.</p>
      <h2 id="compound">Compound components</h2>
      <p>
        Complex components are families of parts: <code>Dialog</code>, <code>DialogTrigger</code>,{' '}
        <code>DialogContent</code>, <code>DialogTitle</code>… The parent holds state and the parts
        render markup. You can reorder, omit or wrap parts without new props.
      </p>
      <Code
        code={`<Tabs defaultValue="templates">
  <TabsList aria-label="Signature workspace">
    <TabsTrigger value="templates">Templates</TabsTrigger>
    <TabsTrigger value="users">Organisation users</TabsTrigger>
  </TabsList>
  <TabsContent value="templates">…</TabsContent>
  <TabsContent value="users">…</TabsContent>
</Tabs>`}
      />
      <h2 id="as-child">asChild</h2>
      <p>
        Triggers and actions accept <code>asChild</code> to render your element, such as a router
        link, with Stance behaviour and styling merged onto it. Props, handlers, refs and class
        names merge.
      </p>
      <Code
        code={`<Button asChild variant="outline">\n  <Link href="/dashboard/templates">View templates</Link>\n</Button>`}
      />
      <h2 id="controlled">Controlled and uncontrolled</h2>
      <p>
        Stateful components work both ways. Pass <code>defaultValue</code>/<code>defaultOpen</code>{' '}
        and let Stance manage state, or pass <code>value</code>/<code>open</code> with an{' '}
        <code>on…Change</code> handler to own it.
      </p>
      <h2 id="extending">Extending</h2>
      <ul>
        <li>
          Every component forwards its ref and spreads native attributes onto its root element.
        </li>
        <li>
          <code>className</code> merges with Stance classes. Style with tokens:{' '}
          <code>var(--st-…)</code>.
        </li>
        <li>
          Variants and state are <code>data-*</code> attributes, so they are stable selectors for
          product-specific CSS.
        </li>
        <li>
          Build product patterns by composing Stance parts inside your app; promote them to Stance
          when a second product needs them.
        </li>
      </ul>
    </>
  );
}
