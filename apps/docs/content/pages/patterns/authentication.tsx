export default function AuthenticationPattern() {
  return (
    <>
      <p>
        Sign-in and sign-up screens are small, focused and calm. They are often the first screen a
        person sees, so they must work with password managers, screen readers and one hand.
      </p>
      <h2 id="layout">Layout</h2>
      <ul>
        <li>
          A single centred column, no more than 400px wide on large screens, with the product logo
          above the heading.
        </li>
        <li>
          One primary action per screen. Secondary routes (create account, forgot password) are
          links.
        </li>
        <li>
          Keep the product’s own identity: Stance provides the fields and buttons, not the page
          design.
        </li>
      </ul>
      <h2 id="fields">Fields</h2>
      <ul>
        <li>
          Use the correct input types and autocomplete values so password managers and autofill
          work: <code>username</code>, <code>current-password</code>, <code>new-password</code>,{' '}
          <code>one-time-code</code>.
        </li>
        <li>Let people show the password. Never block paste.</li>
        <li>Show password rules before the person types, not only after an error.</li>
        <li>Do not rely on puzzles or memory tests to prove the person is human (WCAG 3.3.8).</li>
      </ul>
      <h2 id="errors">Errors</h2>
      <p>
        For security, a failed sign-in says “Email or password is incorrect” without revealing which
        one. Show it in an inline alert above the form and keep the email filled in.
      </p>
      <h2 id="components">Components</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="Authentication components by platform"
        tabIndex={0}
      >
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Web</th>
              <th scope="col">iOS and iPadOS</th>
              <th scope="col">Android</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Credentials</th>
              <td>Input, PasswordInput, PinInput for one-time codes</td>
              <td>StanceTextField, StanceSecureField</td>
              <td>StanceTextField, StancePasswordField</td>
            </tr>
            <tr>
              <th scope="row">Submit</th>
              <td>Button with loading</td>
              <td>StanceButton</td>
              <td>StanceButton</td>
            </tr>
            <tr>
              <th scope="row">Error summary</th>
              <td>Alert</td>
              <td>StanceInlineAlert</td>
              <td>StanceInlineAlert</td>
            </tr>
            <tr>
              <th scope="row">Platform sign-in</th>
              <td>—</td>
              <td>Passkeys and Sign in with Apple use system UI</td>
              <td>Credential Manager uses system UI</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
