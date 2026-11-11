export default function NotificationsPattern() {
  return (
    <>
      <p>
        Feedback should be as quiet as the situation allows. Choose the lightest component that the
        person will still notice.
      </p>
      <h2 id="choosing">Choosing</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="Choosing a feedback component"
        tabIndex={0}
      >
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Situation</th>
              <th scope="col">Use</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">An action succeeded in the background</th>
              <td>Toast (Snackbar on Android), a few seconds, optional Undo</td>
            </tr>
            <tr>
              <th scope="row">Something about this section needs attention</th>
              <td>Inline alert next to the content it concerns</td>
            </tr>
            <tr>
              <th scope="row">Something affects the whole product</th>
              <td>Banner at the top of the page</td>
            </tr>
            <tr>
              <th scope="row">A decision is required before continuing</th>
              <td>Dialog; for destructive actions, an alert dialog</td>
            </tr>
            <tr>
              <th scope="row">Activity from other people or systems</th>
              <td>Notification list behind a bell, with unread state</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 id="rules">Rules</h2>
      <ul>
        <li>Never put essential information only in a toast: it disappears and can be missed.</li>
        <li>Errors that block a task stay on screen until resolved.</li>
        <li>Status is never conveyed by colour alone: pair it with an icon and text.</li>
        <li>
          Toasts and snackbars are announced politely to assistive technology; errors are announced
          immediately.
        </li>
        <li>
          Push notifications on mobile are a product decision and need the person’s permission;
          Stance styles in-app feedback only.
        </li>
      </ul>
    </>
  );
}
