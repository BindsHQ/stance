import SwiftUI

extension View {
    /// Guarantees the minimum 44×44pt interactive target without changing the visual size.
    public func stanceTouchTarget() -> some View {
        frame(minWidth: StanceSize.touchTarget, minHeight: StanceSize.touchTarget).contentShape(Rectangle())
    }

    /// Draws the Stance focus ring when the view has keyboard focus (hardware keyboards, Full Keyboard Access).
    public func stanceFocusRing(_ focused: Bool, cornerRadius: CGFloat = StanceRadius.md) -> some View {
        modifier(StanceFocusRingModifier(focused: focused, cornerRadius: cornerRadius))
    }
}

struct StanceFocusRingModifier: ViewModifier {
    let focused: Bool
    let cornerRadius: CGFloat
    @Environment(\.stanceTheme) private var theme

    func body(content: Content) -> some View {
        content.overlay {
            if focused {
                RoundedRectangle(cornerRadius: cornerRadius + theme.tokens.focusOffset, style: .continuous)
                    .strokeBorder(theme.colors.focusRing, lineWidth: theme.focusWidth)
                    .padding(-(theme.tokens.focusOffset + theme.focusWidth))
                    .allowsHitTesting(false)
            }
        }
    }
}

/// Posts a VoiceOver announcement (for results that appear without moving focus).
@MainActor
public enum StanceAnnouncer {
    public static func announce(_ message: String, urgent: Bool = false) {
        var text = AttributedString(message)
        text.accessibilitySpeechAnnouncementPriority = urgent ? .high : .default
        AccessibilityNotification.Announcement(text).post()
    }
}

/// WCAG relative luminance and contrast, used by tests and available to apps that theme custom content.
public enum StanceContrast {
    public static func luminance(red: Double, green: Double, blue: Double) -> Double {
        func channel(_ c: Double) -> Double { c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4) }
        return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
    }

    public static func ratio(_ a: (Double, Double, Double), _ b: (Double, Double, Double)) -> Double {
        let la = luminance(red: a.0, green: a.1, blue: a.2), lb = luminance(red: b.0, green: b.1, blue: b.2)
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }
}
