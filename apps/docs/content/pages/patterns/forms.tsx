export default function FormsPattern() {
  return (
    <>
      <p>
        Forms are where Binds users do most of their work: creating templates, inviting people,
        configuring integrations. A good form is short, labelled, forgiving and clear about what
        went wrong.
      </p>
      <h2 id="structure">Structure</h2>
      <ul>
        <li>
          One column. Group related fields under a heading, and keep the primary action at the end.
        </li>
        <li>Every field has a visible label. Placeholders are examples, never labels.</li>
        <li>Mark required fields, or mark the optional ones when most are required.</li>
        <li>
          Use the control that fits the answer: a switch for an immediate on/off setting, a checkbox
          for agreement, radio buttons for two to four options, a select for more.
        </li>
      </ul>
      <h2 id="validation">Validation</h2>
      <ul>
        <li>
          Validate when a field loses focus and again on submit. Do not validate while the user is
          still typing their first attempt.
        </li>
        <li>
          Keep the submit button enabled. On submit, show every error next to its field and move
          focus to the first one.
        </li>
        <li>
          Errors say what is wrong and how to fix it. They are linked to the field so screen readers
          announce them.
        </li>
        <li>Never clear what the user typed.</li>
      </ul>
      <h2 id="components">Components</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="Form components by platform"
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
              <th scope="row">Field wrapper</th>
              <td>FormField</td>
              <td>StanceFormField, StanceSection</td>
              <td>StanceFormField</td>
            </tr>
            <tr>
              <th scope="row">Text</th>
              <td>Input, Textarea</td>
              <td>StanceTextField, StanceTextEditor</td>
              <td>StanceTextField</td>
            </tr>
            <tr>
              <th scope="row">Choice</th>
              <td>Select, RadioGroup, Checkbox, Switch</td>
              <td>StancePicker, StanceRadioGroup, StanceCheckbox, Toggle with StanceToggleStyle</td>
              <td>StanceSelect, StanceRadioGroup, StanceCheckbox, StanceSwitch</td>
            </tr>
            <tr>
              <th scope="row">Dates</th>
              <td>DatePicker, TimePicker</td>
              <td>System DatePicker in Stance field chrome</td>
              <td>Material pickers in Stance field chrome</td>
            </tr>
            <tr>
              <th scope="row">Submit feedback</th>
              <td>Button loading, Toast</td>
              <td>StanceButton loading, StanceToastCenter</td>
              <td>StanceButton loading, StanceSnackbarHost</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 id="mobile">On phones</h2>
      <ul>
        <li>
          Set the keyboard type and autofill hints for each field (email, one-time code, name).
        </li>
        <li>
          Keep the primary action reachable above the keyboard, and let the keyboard’s return key
          move to the next field.
        </li>
        <li>Long forms become steps. Show progress with a stepper and save between steps.</li>
      </ul>
    </>
  );
}
