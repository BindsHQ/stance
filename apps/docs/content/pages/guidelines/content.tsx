export default function Content() {
  return (
    <>
      <h2 id="voice">Voice</h2>
      <p>
        Clear, calm and specific. Binds products handle contracts, signatures and organisations; the
        tone is that of a trusted professional, never cute.
      </p>
      <h2 id="rules">Rules</h2>
      <ul>
        <li>
          <strong>Sentence case</strong> everywhere: “Create template”, not “Create Template”.
        </li>
        <li>
          <strong>Lead with the verb</strong> on buttons: “Deploy signature”, “Invite member”.
        </li>
        <li>
          <strong>Name the object</strong> in confirmations: “Delete ‘Sales team’ template?”
        </li>
        <li>
          <strong>Errors explain and resolve</strong>: “That email is already in your organisation.
          Use a different address or edit the existing user.”
        </li>
        <li>
          <strong>Empty states invite action</strong>: say what will appear here and how to create
          the first item.
        </li>
        <li>
          Use British English spelling across Binds products (organisation, colour, licence as a
          noun).
        </li>
      </ul>
      <h2 id="numbers">Numbers, dates and times</h2>
      <ul>
        <li>
          Format with <code>Intl</code> using the user’s locale. Show relative times (“3 min ago”)
          with the absolute time on hover or in a tooltip.
        </li>
        <li>Use tabular figures in tables and stat cards so values align.</li>
      </ul>
    </>
  );
}
