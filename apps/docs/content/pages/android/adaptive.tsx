import { Code } from '../../../components/code';

export default function AndroidAdaptive() {
  return (
    <>
      <h2 id="adaptive">Adaptive layouts</h2>
      <ul>
        <li>
          <code>StanceScaffold</code> draws edge to edge and passes system bar, cutout and keyboard
          insets to content.
        </li>
        <li>
          <code>StanceAdaptiveNavigation</code> shows a bottom bar on compact widths, a rail on
          medium widths and a permanent drawer on expanded widths. Selection is kept when the window
          changes.
        </li>
        <li>
          <code>StanceAdaptiveGrid</code> fits as many columns as the window allows.
        </li>
        <li>
          <code>rememberStanceWindowWidth()</code> returns compact, medium or expanded, using the
          Android thresholds of 600dp and 840dp.
        </li>
        <li>
          Predictive back works with the standard <code>BackHandler</code> and navigation APIs.
        </li>
      </ul>
      <h2 id="views">View interoperability</h2>
      <p>Adopt Stance one screen region at a time in View-based apps.</p>
      <Code
        language="kotlin"
        code={`// Host any Stance content in a ComposeView.
binding.composeContainer.setStanceContent {
    StanceBadge("Live", tone = StanceTone.Success)
}`}
      />
      <Code
        language="xml"
        code={`<!-- Or use a Stance view in XML. -->
<com.bindshq.stance.interop.StanceButtonView
    android:id="@+id/save"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content" />`}
      />
      <h2 id="accessibility">Accessibility</h2>
      <ul>
        <li>Every component sets roles, states and labels for TalkBack.</li>
        <li>Touch targets are at least 48dp, even when the visual is smaller.</li>
        <li>Text scales with the system font size, tested at 200%.</li>
        <li>Focus is visible for keyboards and D-pads.</li>
        <li>
          Errors and status messages are live regions, and swipe actions are also exposed as
          accessibility actions.
        </li>
      </ul>
    </>
  );
}
