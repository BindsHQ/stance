import SwiftUI

/// One of the two thumbs of a ``StanceRangeSlider``.
public enum StanceRangeThumb: String, CaseIterable, Sendable {
    case lower, upper
}

/// The value rules of a ``StanceRangeSlider``: snapping to the step, staying inside the bounds
/// and keeping the thumbs apart. Exposed so apps and tests can reason about a range the same way.
public enum StanceRangeSliderLogic {
    /// Rounds `value` to the nearest step from the lower bound and clamps it into `bounds`.
    /// A step of zero or less leaves the value continuous.
    public nonisolated static func snap(_ value: Double, in bounds: ClosedRange<Double>, step: Double) -> Double {
        let clamped = min(max(value, bounds.lowerBound), bounds.upperBound)
        guard step > 0 else { return clamped }
        let steps = ((clamped - bounds.lowerBound) / step).rounded()
        return min(max(bounds.lowerBound + steps * step, bounds.lowerBound), bounds.upperBound)
    }

    /// The range after moving one thumb to `value`.
    ///
    /// The moved thumb snaps to the step and stops `minDistance` short of the other thumb,
    /// so the thumbs never cross. The other thumb never moves.
    public nonisolated static func moving(
        _ thumb: StanceRangeThumb,
        to value: Double,
        in current: ClosedRange<Double>,
        bounds: ClosedRange<Double>,
        step: Double,
        minDistance: Double = 0
    ) -> ClosedRange<Double> {
        let snapped = snap(value, in: bounds, step: step)
        let gap = max(0, minDistance)
        switch thumb {
        case .lower:
            let upper = current.upperBound
            return min(snapped, max(upper - gap, bounds.lowerBound)) ... upper
        case .upper:
            let lower = current.lowerBound
            return lower ... max(snapped, min(lower + gap, bounds.upperBound))
        }
    }

    /// The range after one accessibility increment (`direction` 1) or decrement (`direction` -1)
    /// of one thumb. A continuous slider moves by a hundredth of its bounds.
    public nonisolated static func adjusting(
        _ thumb: StanceRangeThumb,
        by direction: Int,
        in current: ClosedRange<Double>,
        bounds: ClosedRange<Double>,
        step: Double,
        minDistance: Double = 0
    ) -> ClosedRange<Double> {
        let increment = step > 0 ? step : (bounds.upperBound - bounds.lowerBound) / 100
        let start = thumb == .lower ? current.lowerBound : current.upperBound
        return moving(thumb, to: start + Double(direction) * increment, in: current, bounds: bounds, step: step, minDistance: minDistance)
    }

    /// Where a value sits along the bounds, from 0 to 1.
    public nonisolated static func fraction(of value: Double, in bounds: ClosedRange<Double>) -> Double {
        let span = bounds.upperBound - bounds.lowerBound
        guard span > 0 else { return 0 }
        return min(max((value - bounds.lowerBound) / span, 0), 1)
    }
}

/// A slider with two thumbs that picks a lower and an upper value, such as a contract value
/// between 1,000 and 5,000.
///
/// iOS has no two thumb slider, so this draws its own track. It follows the system slider:
/// the thumbs mirror in right to left layouts, each thumb is its own adjustable VoiceOver element
/// (swipe up or down to change it), and a selection tick plays as the value steps.
public struct StanceRangeSlider: View {
    private let label: String
    private let bounds: ClosedRange<Double>
    private let step: Double
    private let minDistance: Double
    private let lowerLabel: String?
    private let upperLabel: String?
    private let format: (Double) -> String
    @Binding private var value: ClosedRange<Double>
    @State private var dragging: StanceRangeThumb?
    @ScaledMetric(relativeTo: .body) private var thumbSize: CGFloat = StanceSize.controlXs + StanceSpacing.xs
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var layoutDirection
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameters:
    ///   - label: The visible label and the start of each thumb's accessible name.
    ///   - value: The selected range.
    ///   - bounds: The lowest and highest values the thumbs can reach.
    ///   - step: The distance between values. Zero makes the slider continuous.
    ///   - minimumStepsBetween: How many steps the thumbs stay apart.
    ///   - lowerLabel: The lower thumb's name. Defaults to a localised "Minimum".
    ///   - upperLabel: The upper thumb's name. Defaults to a localised "Maximum".
    ///   - format: Turns a value into the text shown and spoken.
    @_disfavoredOverload
    public init(
        _ label: String,
        value: Binding<ClosedRange<Double>>,
        in bounds: ClosedRange<Double> = 0 ... 100,
        step: Double = 1,
        minimumStepsBetween: Int = 0,
        lowerLabel: String? = nil,
        upperLabel: String? = nil,
        format: @escaping (Double) -> String = { String(Int($0)) }
    ) {
        self.label = label
        _value = value
        self.bounds = bounds
        self.step = step
        minDistance = Double(max(0, minimumStepsBetween)) * max(step, 0)
        self.lowerLabel = lowerLabel
        self.upperLabel = upperLabel
        self.format = format
    }

    private var summary: String {
        stanceString("stance.range.value \(format(value.lowerBound)) \(format(value.upperBound))", locale)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.xs) {
            ViewThatFits(in: .horizontal) {
                HStack {
                    Text(label).stanceText(.label)
                    Spacer()
                    valueText
                }
                VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                    Text(label).stanceText(.label)
                    valueText
                }
            }
            .accessibilityHidden(true)
            track
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
        .sensoryFeedback(.selection, trigger: value) { _, _ in step > 0 && dragging != nil }
    }

    private static let trackSpace = "StanceRangeSliderTrack"

    private var valueText: some View {
        Text(summary)
            .stanceText(.label)
            .foregroundStyle(theme.colors.fgMuted)
            .monospacedDigit()
    }

    private var track: some View {
        GeometryReader { proxy in
            let width = max(proxy.size.width - thumbSize, 1)
            let rtl = layoutDirection == .rightToLeft
            let lowerX = position(value.lowerBound, width: width, rtl: rtl)
            let upperX = position(value.upperBound, width: width, rtl: rtl)
            ZStack(alignment: .topLeading) {
                Capsule()
                    .fill(theme.colors.bgEmphasis)
                    .frame(width: width, height: StanceSpacing.xs)
                    .offset(x: thumbSize / 2, y: (proxy.size.height - StanceSpacing.xs) / 2)
                Capsule()
                    .fill(isEnabled ? theme.colors.accentBg : theme.colors.disabledFg)
                    .frame(width: abs(upperX - lowerX), height: StanceSpacing.xs)
                    .offset(x: min(lowerX, upperX) + thumbSize / 2, y: (proxy.size.height - StanceSpacing.xs) / 2)
                thumb(.lower, x: lowerX, width: width, rtl: rtl, height: proxy.size.height)
                thumb(.upper, x: upperX, width: width, rtl: rtl, height: proxy.size.height)
            }
            .coordinateSpace(.named(Self.trackSpace))
            // Positions are worked out here in left to right space and mirrored by hand.
            .environment(\.layoutDirection, .leftToRight)
        }
        .frame(height: max(StanceSize.touchTarget, thumbSize))
    }

    private func position(_ value: Double, width: CGFloat, rtl: Bool) -> CGFloat {
        let fraction = StanceRangeSliderLogic.fraction(of: value, in: bounds)
        return (rtl ? 1 - fraction : fraction) * width
    }

    private func thumb(_ thumb: StanceRangeThumb, x: CGFloat, width: CGFloat, rtl: Bool, height: CGFloat) -> some View {
        let thumbValue = thumb == .lower ? value.lowerBound : value.upperBound
        let name = thumb == .lower ? (lowerLabel ?? stanceString("stance.range.lower", locale)) : (upperLabel ?? stanceString("stance.range.upper", locale))
        let target = max(StanceSize.touchTarget, thumbSize)
        return Circle()
            .fill(isEnabled ? theme.colors.bgSurface : theme.colors.disabledBg)
            .overlay {
                Circle().strokeBorder(dragging == thumb ? theme.colors.focusRing : theme.colors.borderControl, lineWidth: max(theme.controlBorderWidth, theme.borderWidth))
            }
            .stanceShadow(.sm, cornerRadius: thumbSize / 2)
            .frame(width: thumbSize, height: thumbSize)
            .frame(width: target, height: target)
            .contentShape(Rectangle())
            .offset(x: x + thumbSize / 2 - target / 2, y: (height - target) / 2)
            .gesture(
                DragGesture(minimumDistance: 0, coordinateSpace: .named(Self.trackSpace))
                    .onChanged { drag in
                        dragging = thumb
                        let local = drag.location.x - thumbSize / 2
                        var fraction = Double(min(max(local, 0), width) / width)
                        if rtl { fraction = 1 - fraction }
                        let raw = bounds.lowerBound + fraction * (bounds.upperBound - bounds.lowerBound)
                        value = StanceRangeSliderLogic.moving(thumb, to: raw, in: value, bounds: bounds, step: step, minDistance: minDistance)
                    }
                    .onEnded { _ in dragging = nil }
            )
            .zIndex(dragging == thumb ? 1 : 0)
            .accessibilityElement()
            .accessibilityLabel("\(label), \(name)")
            .accessibilityValue(format(thumbValue))
            .accessibilityAdjustableAction { direction in
                switch direction {
                case .increment: value = StanceRangeSliderLogic.adjusting(thumb, by: 1, in: value, bounds: bounds, step: step, minDistance: minDistance)
                case .decrement: value = StanceRangeSliderLogic.adjusting(thumb, by: -1, in: value, bounds: bounds, step: step, minDistance: minDistance)
                @unknown default: break
                }
            }
    }
}

// MARK: Localised labels

extension StanceRangeSlider {
    /// Creates a range slider whose label is looked up in the app's string tables.
    public init(
        _ labelKey: LocalizedStringResource,
        value: Binding<ClosedRange<Double>>,
        in bounds: ClosedRange<Double> = 0 ... 100,
        step: Double = 1,
        minimumStepsBetween: Int = 0,
        lowerLabel: String? = nil,
        upperLabel: String? = nil,
        format: @escaping (Double) -> String = { String(Int($0)) }
    ) {
        self.init(
            String(localized: labelKey), value: value, in: bounds, step: step, minimumStepsBetween: minimumStepsBetween,
            lowerLabel: lowerLabel, upperLabel: upperLabel, format: format
        )
    }
}
