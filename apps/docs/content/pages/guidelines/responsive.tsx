export default function Responsive() {
  return (
    <>
      <h2 id="mobile-first">Mobile first</h2>
      <p>Start at 320px and add layout as space allows. Stance components already adapt:</p>
      <ul>
        <li>
          Dialogs dock to the bottom of the screen below 640px. Drawers and sheets never exceed the
          viewport.
        </li>
        <li>Toasts become full width on phones.</li>
        <li>Horizontal form fields stack labels above controls on small screens.</li>
        <li>Tables scroll inside a focusable, labelled region instead of breaking the page.</li>
        <li>Breadcrumbs collapse middle items; filter bars wrap.</li>
      </ul>
      <h2 id="touch">Touch</h2>
      <ul>
        <li>Interactive targets are at least 24×24px, and 40px for primary controls.</li>
        <li>
          Never hide essential actions behind hover. Tooltips are supplementary and do not open on
          touch.
        </li>
        <li>Sheets support drag-to-dismiss as well as an explicit close button.</li>
      </ul>
      <h2 id="zoom">Zoom and reflow</h2>
      <p>
        Layouts must reflow at 400% zoom (WCAG 1.4.10) and stay readable with 200% text spacing
        (1.4.12). Use rem-based tokens, never fixed pixel heights on text containers.
      </p>
    </>
  );
}
