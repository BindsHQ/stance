export default function Interaction() {
  return (
    <>
      <h2 id="states">Interactive states</h2>
      <p>
        Every interactive element has distinct rest, hover, active, focus-visible, disabled and,
        where relevant, selected, invalid and loading states. Hover uses a translucent ink layer, so
        it works on any surface.
      </p>
      <h2 id="overlays">Overlays</h2>
      <ul>
        <li>
          <strong>Dialog</strong> for focused tasks that block the page. Escape and the close button
          always dismiss it.
        </li>
        <li>
          <strong>AlertDialog</strong> for destructive confirmations. Outside clicks never dismiss
          it, and focus starts on the safe action.
        </li>
        <li>
          <strong>Popover</strong> for non-blocking detail or small forms anchored to a trigger.
        </li>
        <li>
          <strong>Menu</strong> for lists of actions; <strong>Select</strong> for choosing a value.
          They are not interchangeable.
        </li>
        <li>
          <strong>Drawer</strong> for secondary workflows that keep page context visible.
        </li>
      </ul>
      <h2 id="feedback">Feedback</h2>
      <ul>
        <li>
          Respond to every action within 100ms. Show a loading state on the control that started a
          slow action.
        </li>
        <li>
          Use <strong>Toast</strong> for confirmations of completed background actions,{' '}
          <strong>Alert</strong> for inline status, and <strong>Banner</strong> for page-wide
          announcements.
        </li>
        <li>Errors say what happened and how to fix it, next to where it happened.</li>
      </ul>
      <h2 id="destructive">Destructive actions</h2>
      <p>
        Prefer undo over confirmation for reversible actions. For irreversible ones, confirm with an
        AlertDialog that names the object and the consequence, with a danger-toned action labelled
        with the verb (“Delete template”).
      </p>
    </>
  );
}
