import { Code } from '../../../components/code';

export default function IosInstallation() {
  return (
    <>
      <p>
        StanceUI is the native SwiftUI library for iOS and iPadOS. It uses the same tokens as the
        web and Android libraries, and the system’s own navigation, sheets, alerts, pickers and
        gestures.
      </p>
      <ul>
        <li>iOS 17 and iPadOS 17 or later. Swift 6 language mode.</li>
        <li>No third-party dependencies.</li>
        <li>Version 0.1.0, in development and not yet tagged for release.</li>
      </ul>
      <h2 id="install">Add the package</h2>
      <p>
        In Xcode choose File, Add Package Dependencies, or add it to <code>Package.swift</code>:
      </p>
      <Code
        language="swift"
        code={`dependencies: [
    .package(url: "https://github.com/BindsHQ/stance.git", from: "0.1.0")
],
targets: [
    .target(name: "MyApp", dependencies: [.product(name: "StanceUI", package: "stance")])
]`}
      />
      <div className="docs-table-wrap" role="region" aria-label="Products" tabIndex={0}>
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Contents</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <code>StanceUI</code>
              </th>
              <td>Components, theme, icons, accessibility helpers and UIKit interop.</td>
            </tr>
            <tr>
              <th scope="row">
                <code>StanceTokens</code>
              </th>
              <td>Generated token constants only, with no UI framework imports.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 id="setup">Set up</h2>
      <p>
        Wrap the app once. The stored theme is read before the first frame, so the wrong theme never
        flashes.
      </p>
      <Code
        language="swift"
        code={`import StanceUI
import SwiftUI

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            StanceThemeProvider {
                RootView().stanceToastHost()
            }
        }
    }
}`}
      />
      <h2 id="first-screen">Build a screen</h2>
      <Code
        language="swift"
        code={`struct TemplateSettings: View {
    @State private var name = "Sales team signature"
    @State private var autoApply = true
    @Environment(\\.stanceTheme) private var theme

    var body: some View {
        StanceCard("Details") {
            StanceTextField("Template name", text: $name, isRequired: true)
            Toggle("Apply to new members", isOn: $autoApply).toggleStyle(.stance)
            StanceButton("Deploy", leadingIcon: .send) {}
        }
        .padding(StanceSpacing.lg)
        .background(theme.colors.bgCanvas)
    }
}`}
      />
      <h2 id="native-first">Native first</h2>
      <p>
        StanceUI styles system controls with tokens and does not reimplement them. Custom controls
        exist only where iOS has none, such as checkbox, badge, toast and signature canvas. On iOS
        26, system bars and sheets keep their Liquid Glass materials.
      </p>
    </>
  );
}
