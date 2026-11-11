import SwiftUI

/// A Stance icon drawn natively from the shared icon geometry.
///
/// Icons are decorative by default and hidden from VoiceOver. Pass `label` when
/// the icon conveys meaning on its own. The size scales with Dynamic Type.
///
/// For glyphs people expect to match the system (share, back, etc.) use SF Symbols
/// with `Image(systemName:)` instead.
public struct StanceIcon: View {
    private let name: StanceIconName
    private let label: String?
    @ScaledMetric private var size: CGFloat

    public init(_ name: StanceIconName, size: CGFloat = StanceSize.iconMd, label: String? = nil) {
        self.name = name
        self.label = label
        _size = ScaledMetric(wrappedValue: size, relativeTo: .body)
    }

    public var body: some View {
        StanceIconShape(name: name)
            .stroke(style: StrokeStyle(lineWidth: 1.75 * size / 24, lineCap: .round, lineJoin: .round))
            .frame(width: size, height: size)
            .accessibilityHidden(label == nil)
            .accessibilityLabel(label ?? "")
            .accessibilityAddTraits(label == nil ? [] : .isImage)
    }
}

/// The icon outline as a `Shape`, scaled from the 24pt grid to the given rect.
public struct StanceIconShape: Shape {
    public let name: StanceIconName

    public init(name: StanceIconName) { self.name = name }

    public func path(in rect: CGRect) -> Path {
        var combined = Path()
        for data in name.pathData { combined.addPath(StancePathParser.path(data)) }
        let scale = min(rect.width, rect.height) / 24
        return combined.applying(CGAffineTransform(scaleX: scale, y: scale).translatedBy(x: rect.minX / scale, y: rect.minY / scale))
    }
}
