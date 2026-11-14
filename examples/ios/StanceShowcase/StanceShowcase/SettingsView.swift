import StanceUI
import SwiftUI

struct SettingsView: View {
    @AppStorage(StanceAppearance.storageKey) private var stored = StanceAppearance.system.rawValue
    @Environment(\.stanceTheme) private var theme
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.colorSchemeContrast) private var contrast
    @Environment(\.legibilityWeight) private var legibilityWeight

    var body: some View {
        Page(title: "Settings") {
            StanceSection("Appearance", caption: "Stance has three complete themes. System follows the device, including Increase Contrast.") {
                StanceRadioGroup(
                    "Theme",
                    selection: Binding(get: { StanceAppearance(rawValue: stored) ?? .system }, set: { stored = $0.rawValue }),
                    options: StanceAppearance.allCases.map { .init($0, label: $0.title) }
                )
                .stanceCard()
            }
            StanceSection("Accessibility", caption: "What StanceUI is responding to on this device right now.") {
                StanceDescriptionList([
                    ("Active theme", theme.mode.rawValue),
                    ("Text size", String(describing: typeSize)),
                    ("Increase Contrast", contrast == .increased ? "On" : "Off"),
                    ("Reduce Motion", reduceMotion ? "On" : "Off"),
                    ("Bold Text", legibilityWeight == .bold ? "On" : "Off"),
                ])
                .stanceCard(padding: StanceSpacing.lg)
                StanceInlineAlert(
                    "Try it",
                    message: "Change text size, Increase Contrast or Reduce Motion in the Settings app and return here. Every control keeps a 44pt target and scales with Dynamic Type."
                )
            }
            StanceSection("About") {
                StanceDescriptionList([("Package", "StanceUI"), ("Version", "0.1.0"), ("Licence", "Apache 2.0"), ("Icons", "\(StanceIconName.allCases.count)")])
                    .stanceCard(padding: StanceSpacing.lg)
            }
        }
    }
}
