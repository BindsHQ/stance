import { Code } from '../../../components/code';

export default function IosUIKit() {
  return (
    <>
      <p>
        StanceUI is SwiftUI first and works in UIKit apps, so existing screens can adopt Stance step
        by step.
      </p>
      <h2 id="colours-fonts">Colours and fonts</h2>
      <Code
        language="swift"
        code={`view.backgroundColor = StanceUIKit.color(\\.bgCanvas)   // follows dark mode and Increase Contrast
label.font = StanceUIKit.font(.heading)                // scaled for Dynamic Type
label.adjustsFontForContentSizeCategory = true`}
      />
      <h2 id="hosting">Hosting StanceUI in UIKit</h2>
      <Code
        language="swift"
        code={`let controller = StanceUIKit.hostingController { TemplateSettings() }
navigationController?.pushViewController(controller, animated: true)`}
      />
      <h2 id="wrapping">Using UIKit views in StanceUI</h2>
      <p>
        Wrap the view with <code>UIViewRepresentable</code> as usual, and read colours through{' '}
        <code>StanceUIKit.color</code> so it follows the theme. <code>StanceDocumentPreview</code>{' '}
        is an example: it hosts the Quick Look controller.
      </p>
      <h2 id="accessibility">Accessibility</h2>
      <ul>
        <li>Controls have at least a 44 by 44 point touch target.</li>
        <li>VoiceOver labels, values and traits are set on every component.</li>
        <li>Layouts reflow at the largest Dynamic Type sizes.</li>
        <li>
          The showcase app runs Apple’s accessibility audit in light, dark and high contrast as part
          of its tests.
        </li>
      </ul>
    </>
  );
}
