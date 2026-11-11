export default function DocumentsPattern() {
  return (
    <>
      <p>
        Binds products create, preview and sign documents and email signatures. These patterns keep
        that work clear and trustworthy.
      </p>
      <h2 id="preview">Previewing</h2>
      <ul>
        <li>
          Show a faithful preview beside the form that produces it on large screens, and behind a
          Preview action on phones.
        </li>
        <li>
          User-supplied HTML is never rendered directly. Sanitise it or render it in a sandboxed
          frame.
        </li>
        <li>Offer zoom and a plain-text alternative for long documents.</li>
      </ul>
      <h2 id="uploading">Uploading</h2>
      <ul>
        <li>
          State accepted types and size limits before upload, validate on the device, and list each
          file with its own progress and remove action.
        </li>
        <li>
          On mobile, use the system pickers for photos and files rather than a custom browser.
        </li>
      </ul>
      <h2 id="signing">Capturing a signature</h2>
      <ul>
        <li>
          Offer more than one way to sign: draw, type a name, or upload an image. Drawing alone
          excludes people who cannot use a pointer precisely.
        </li>
        <li>Provide Clear and Undo, and confirm before a signature is applied.</li>
        <li>Record intent in text (“By signing, you agree…”) next to the action.</li>
      </ul>
      <h2 id="components">Components</h2>
      <div
        className="docs-table-wrap"
        role="region"
        aria-label="Document components by platform"
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
              <th scope="row">Upload</th>
              <td>FileUpload</td>
              <td>StanceAttachmentPicker</td>
              <td>Attachment picker helpers</td>
            </tr>
            <tr>
              <th scope="row">Preview</th>
              <td>Card, ScrollArea, Dialog</td>
              <td>StanceDocumentPreview (Quick Look)</td>
              <td>System viewer intents</td>
            </tr>
            <tr>
              <th scope="row">Signature</th>
              <td>A canvas pattern with typed and upload alternatives</td>
              <td>StanceSignatureCanvas</td>
              <td>StanceSignatureCanvas</td>
            </tr>
            <tr>
              <th scope="row">Progress</th>
              <td>Stepper, Progress</td>
              <td>StanceStepper</td>
              <td>StanceStepper</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="docs-muted">
        Stance provides the interface parts. Legal validity, audit trails and storage belong to the
        product, not the design system.
      </p>
    </>
  );
}
