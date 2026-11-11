export default function Principles() {
  const items = [
    [
      'Brand-true',
      'Two colours, used with discipline. Ivory and indigo carry the Binds identity; hierarchy comes from tints, type and space, never from new accent colours.',
    ],
    [
      'Accessible by default',
      'Contrast, focus, keyboard and screen-reader support are part of every component’s definition of done. AA is the floor, not the goal.',
    ],
    [
      'Precise',
      'Every value comes from a scale. Spacing sits on a 4px grid, type on a 1.2 ratio, controls share heights. Precision reads as quality.',
    ],
    [
      'Editorial restraint',
      'Generous whitespace, strong type, clean borders. No gradients, glows or ornament competing with content.',
    ],
    [
      'Own the stack',
      'No runtime dependencies. Owning focus, positioning and data primitives keeps Stance fast, auditable and stable for years.',
    ],
    [
      'Distinct products, shared foundations',
      'Stance standardises how things behave and look at the component level and leaves product layouts to product teams.',
    ],
  ];
  return (
    <ol className="principles">
      {items.map(([title, body], i) => (
        <li key={title}>
          <span className="principles__index" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h2>{title}</h2>
          <p>{body}</p>
        </li>
      ))}
    </ol>
  );
}
