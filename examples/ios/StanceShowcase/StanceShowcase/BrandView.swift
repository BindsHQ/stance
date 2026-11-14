import StanceTokens
import StanceUI
import SwiftUI

/// Brand theming: pick a light and a dark colour (and an accent if you like) and every component
/// follows, in light, dark and high contrast.
struct BrandView: View {
    @State private var light = Color(StanceTokens.Brand.ivory)
    @State private var dark = Color(StanceTokens.Brand.indigo)
    @State private var useAccent = false
    @State private var accent = Color(StanceRGBA(hex: 0xFF5A36))
    @Environment(\.stanceTheme) private var theme

    private var brand: StanceBrand {
        StanceBrand(name: "Yours", light: light, dark: dark, accent: useAccent ? accent : nil)
    }

    var body: some View {
        let brand = brand
        let report = brand.contrastReport()
        Page(title: "Brand") {
            VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                Text("Make Stance yours").stanceText(.heading)
                Text("Pick your colours and every component follows, in light, dark and high contrast.")
                    .stanceText(.bodySmall)
                    .foregroundStyle(theme.colors.fgMuted)
            }
            StanceSection("Colours") {
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    ColorPicker(selection: $light, supportsOpacity: false) { label("Light", brand.lightHex) }
                    ColorPicker(selection: $dark, supportsOpacity: false) { label("Dark", brand.darkHex) }
                    Toggle("Accent", isOn: $useAccent.animation()).toggleStyle(.stance)
                    if useAccent {
                        ColorPicker("Accent colour", selection: $accent, supportsOpacity: false)
                    }
                    StanceButton("Use the Binds palette", variant: .outline) {
                        light = Color(StanceTokens.Brand.ivory)
                        dark = Color(StanceTokens.Brand.indigo)
                        useAccent = false
                    }
                }
                .stanceCard()
            }
            StanceSection("Live preview") {
                VStack(spacing: StanceSpacing.md) {
                    ForEach(StanceTheme.Mode.allCases, id: \.self) { mode in
                        BrandSample(mode: mode).stanceScopedTheme(mode)
                    }
                }
                .stanceBrand(brand)
            }
            StanceSection("Contrast") {
                if report.isEmpty {
                    StanceInlineAlert("Every contrast check passes", tone: .success)
                } else {
                    StanceInlineAlert(
                        "\(report.count) pairs to look at",
                        message: report.prefix(6).map(\.description).joined(separator: "\n"),
                        tone: .warning
                    )
                }
            }
        }
    }

    private func label(_ title: String, _ hex: String) -> some View {
        HStack {
            Text(title)
            Spacer()
            Text(hex).stanceText(.mono).foregroundStyle(theme.colors.fgMuted)
        }
    }
}

/// A few components in one mode, on that mode's canvas.
private struct BrandSample: View {
    let mode: StanceTheme.Mode
    @State private var on = true
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.md) {
            HStack {
                Text(title).stanceText(.label)
                Spacer()
                StanceBadge("Live", tone: .success)
            }
            StanceButtonGroup {
                StanceButton("Deploy", leadingIcon: .send) {}
                StanceButton("Preview", variant: .outline) {}
            }
            Toggle("Auto-deploy", isOn: $on).toggleStyle(.stance)
            StanceCheckbox("Apply to new members", isOn: $on)
            StanceProgressView("Mailboxes updated", value: 0.72)
            Text("Read the release notes").foregroundStyle(theme.colors.fgLink).underline()
        }
        .padding(StanceSpacing.lg)
        .background(theme.colors.bgCanvas, in: RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous).strokeBorder(theme.colors.borderDefault) }
    }

    private var title: String {
        switch mode {
        case .light: "Light"
        case .dark: "Dark"
        case .highContrast: "High contrast"
        }
    }
}
