import SwiftUI

/// Sizes for ``StanceProgressCircle``.
public enum StanceProgressCircleSize: String, CaseIterable, Sendable {
    case small, medium, large

    var diameter: CGFloat {
        switch self {
        case .small: StanceSize.touchTarget
        case .medium: StanceSize.controlLg + StanceSpacing.lg
        case .large: StanceSize.controlLg * 2
        }
    }

    var lineWidth: CGFloat {
        switch self {
        case .small: StanceSpacing.xs
        case .medium: StanceSpacing.s1_5
        case .large: StanceSpacing.sm
        }
    }

    var textStyle: StanceTextStyle {
        switch self {
        case .small: .caption
        case .medium: .label
        case .large: .subheading
        }
    }
}

/// A ring that fills as progress is made, with the value written in the middle.
///
/// Built on the native `ProgressView`, so VoiceOver reads it as progress. Pass `nil` for work of
/// unknown length and the system spinner is shown instead.
public struct StanceProgressCircle: View {
    private let label: String
    private let value: Double?
    private let size: StanceProgressCircleSize
    private let showsValue: Bool
    private let tone: StanceTone
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - label: The accessible name, for example "Mailboxes updated".
    ///   - value: Progress from 0 to 1, or `nil` when the length is unknown.
    ///   - size: The ring size. Every size is at least 44pt.
    ///   - showsValue: Writes the percentage inside the ring.
    ///   - tone: `.neutral` uses the accent; status tones colour the ring and keep the number.
    @_disfavoredOverload
    public init(_ label: String, value: Double?, size: StanceProgressCircleSize = .medium, showsValue: Bool = true, tone: StanceTone = .neutral) {
        self.label = label
        self.value = value
        self.size = size
        self.showsValue = showsValue
        self.tone = tone
    }

    public var body: some View {
        Group {
            if let value {
                let clamped = min(max(value, 0), 1)
                ProgressView(value: clamped) { Text(label) }
                    .progressViewStyle(StanceCircularProgressStyle(size: size, showsValue: showsValue, tint: tint, locale: locale))
                    .accessibilityLabel(label)
                    .accessibilityValue(Text(clamped, format: .percent.precision(.fractionLength(0)).locale(locale)))
            } else {
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(theme.colors.accentBg)
                    .frame(width: size.diameter, height: size.diameter)
                    .accessibilityLabel(label)
                    .accessibilityValue(stanceString("stance.inProgress", locale))
            }
        }
        .sensoryFeedback(.success, trigger: (value ?? 0) >= 1) { _, complete in complete }
    }

    private var tint: Color {
        tone == .neutral ? theme.colors.accentBg : tone.foreground(theme)
    }
}

/// The circular style behind ``StanceProgressCircle``. Apply it to any determinate `ProgressView`.
public struct StanceCircularProgressStyle: ProgressViewStyle {
    let size: StanceProgressCircleSize
    let showsValue: Bool
    let tint: Color?
    let locale: Locale

    /// - Parameters:
    ///   - size: The ring size.
    ///   - showsValue: Writes the percentage inside the ring.
    public init(size: StanceProgressCircleSize = .medium, showsValue: Bool = true) {
        self.init(size: size, showsValue: showsValue, tint: nil, locale: .current)
    }

    init(size: StanceProgressCircleSize, showsValue: Bool, tint: Color?, locale: Locale) {
        self.size = size
        self.showsValue = showsValue
        self.tint = tint
        self.locale = locale
    }

    public func makeBody(configuration: Configuration) -> some View {
        StanceCircularProgressBody(fraction: configuration.fractionCompleted ?? 0, size: size, showsValue: showsValue, tint: tint, locale: locale)
    }
}

private struct StanceCircularProgressBody: View {
    let fraction: Double
    let size: StanceProgressCircleSize
    let showsValue: Bool
    let tint: Color?
    let locale: Locale
    @Environment(\.stanceTheme) private var theme
    @ScaledMetric private var scale: CGFloat = 1

    var body: some View {
        let diameter = size.diameter * scale
        let line = size.lineWidth * (theme.isHighContrast ? 1.5 : 1)
        ZStack {
            Circle().stroke(theme.colors.bgEmphasis, lineWidth: line)
            if theme.isHighContrast {
                Circle().stroke(theme.colors.borderStrong, lineWidth: theme.borderWidth).padding(-line / 2)
            }
            Circle()
                .trim(from: 0, to: fraction)
                .stroke(tint ?? theme.colors.accentBg, style: StrokeStyle(lineWidth: line, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .stanceAnimation(.normal, value: fraction)
            if showsValue && size != .small {
                Text(fraction, format: .percent.precision(.fractionLength(0)).locale(locale))
                    .stanceText(size.textStyle)
                    .monospacedDigit()
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
                    .padding(line)
                    .contentTransition(.numericText(value: fraction))
                    .stanceAnimation(.fast, value: fraction)
            }
        }
        .frame(width: diameter, height: diameter)
        // The ring fills clockwise from the top in every layout direction, as the system does.
        .environment(\.layoutDirection, .leftToRight)
    }
}

// MARK: Localised labels

extension StanceProgressCircle {
    /// Creates a progress circle whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, value: Double?, size: StanceProgressCircleSize = .medium, showsValue: Bool = true, tone: StanceTone = .neutral) {
        self.init(String(localized: labelKey), value: value, size: size, showsValue: showsValue, tone: tone)
    }
}
