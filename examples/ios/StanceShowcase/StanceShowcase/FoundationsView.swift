import StanceTokens
import StanceUI
import SwiftUI

struct FoundationsView: View {
    @Environment(\.stanceTheme) private var theme

    private var roles: [(String, Color)] {
        let c = theme.colors
        return [
            ("bg-canvas", c.bgCanvas), ("bg-surface", c.bgSurface), ("bg-muted", c.bgMuted), ("bg-emphasis", c.bgEmphasis),
            ("fg-default", c.fgDefault), ("fg-muted", c.fgMuted), ("fg-subtle", c.fgSubtle), ("border-control", c.borderControl),
            ("accent-bg", c.accentBg), ("danger-fg", c.dangerFg), ("success-fg", c.successFg), ("warning-fg", c.warningFg),
        ]
    }

    var body: some View {
        Page(title: "Foundations") {
            StanceSection("Brand", caption: "Binds has two colours. Every neutral is a mix of them.") {
                HStack(spacing: 0) {
                    swatch("Ivory", "#FCF6EB", Color(StanceTokens.Brand.ivory), Color(StanceTokens.Brand.indigo))
                    swatch("Indigo", "#140C2E", Color(StanceTokens.Brand.indigo), Color(StanceTokens.Brand.ivory))
                }
                .clipShape(RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous))
                .overlay { RoundedRectangle(cornerRadius: StanceRadius.xl, style: .continuous).strokeBorder(theme.colors.borderDefault) }
            }
            StanceSection("Semantic colours", caption: "Roles for the \(theme.mode.rawValue) theme.") {
                StanceGrid(minItemWidth: 150) {
                    ForEach(roles, id: \.0) { role in
                        HStack(spacing: StanceSpacing.sm) {
                            RoundedRectangle(cornerRadius: StanceRadius.sm).fill(role.1).frame(width: 28, height: 28)
                                .overlay { RoundedRectangle(cornerRadius: StanceRadius.sm).strokeBorder(theme.colors.borderStrong) }
                            Text(role.0).stanceText(.caption)
                            Spacer(minLength: 0)
                        }
                        .accessibilityElement(children: .combine)
                    }
                }
                .stanceCard()
            }
            StanceSection("Typography", caption: "Every style scales with Dynamic Type.") {
                VStack(alignment: .leading, spacing: StanceSpacing.md) {
                    ForEach(StanceTextStyle.allCases, id: \.self) { style in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(style == .mono ? "npm install stance" : "Contracts, signed in minutes").stanceText(style).lineLimit(2)
                            Text("\(style.rawValue) · \(Int(style.size))pt").stanceText(.caption).foregroundStyle(theme.colors.fgSubtle)
                        }
                    }
                }
                .stanceCard()
            }
            StanceSection("Spacing and radius") {
                VStack(alignment: .leading, spacing: StanceSpacing.sm) {
                    ForEach([("xs", StanceSpacing.xs), ("sm", StanceSpacing.sm), ("md", StanceSpacing.md), ("lg", StanceSpacing.lg), ("xl", StanceSpacing.xl), ("xxl", StanceSpacing.xxl)], id: \.0) { item in
                        HStack {
                            Text("\(item.0) · \(Int(item.1))pt").stanceText(.caption).frame(width: 90, alignment: .leading)
                            Capsule().fill(theme.colors.accentBg).frame(width: item.1 * 4, height: 10)
                        }
                    }
                    HStack(spacing: StanceSpacing.md) {
                        ForEach([StanceRadius.xs, StanceRadius.md, StanceRadius.lg, StanceRadius.xl, StanceRadius.xxl], id: \.self) { r in
                            RoundedRectangle(cornerRadius: r, style: .continuous).strokeBorder(theme.colors.fgDefault, lineWidth: 2).frame(width: 48, height: 48)
                        }
                    }
                    .padding(.top, StanceSpacing.sm)
                    .accessibilityHidden(true)
                }
                .stanceCard()
            }
            StanceSection("Elevation", caption: "High contrast draws depth as an outline.") {
                HStack(spacing: StanceSpacing.lg) {
                    ForEach([("sm", StanceElevation.sm), ("md", .md), ("lg", .lg), ("xl", .xl)], id: \.0) { item in
                        Text(item.0).stanceText(.caption)
                            .frame(maxWidth: .infinity, minHeight: 56)
                            .background(theme.colors.bgSurfaceRaised, in: RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
                            .stanceShadow(item.1)
                    }
                }
                .padding(.vertical, StanceSpacing.sm)
            }
            StanceSection("Icons", caption: "\(StanceIconName.allCases.count) icons, the same geometry as the web.") {
                StanceGrid(minItemWidth: 44, spacing: StanceSpacing.sm) {
                    ForEach(StanceIconName.allCases, id: \.self) { icon in
                        StanceIcon(icon, size: 22, label: icon.rawValue).frame(width: 44, height: 44)
                    }
                }
                .stanceCard()
            }
        }
    }

    private func swatch(_ name: String, _ hex: String, _ fill: Color, _ text: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Spacer()
            Text(name).stanceText(.subheading)
            Text(hex).stanceText(.mono)
        }
        .foregroundStyle(text)
        .padding(StanceSpacing.lg)
        .frame(maxWidth: .infinity, minHeight: 130, alignment: .leading)
        .background(fill)
        .accessibilityElement(children: .combine)
    }
}
