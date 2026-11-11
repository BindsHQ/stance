import SwiftUI
import UniformTypeIdentifiers
#if canImport(PhotosUI)
import PhotosUI
#endif

/// A filter option in a ``StanceFilterBar``.
public struct StanceFilter<ID: Hashable>: Identifiable {
    public let id: ID
    public let title: String

    public init(id: ID, title: String) {
        self.id = id
        self.title = title
    }
}

/// A horizontally scrolling row of selectable filter chips.
public struct StanceFilterBar<ID: Hashable>: View {
    private let filters: [StanceFilter<ID>]
    @Binding private var selection: Set<ID>
    @Environment(\.stanceTheme) private var theme

    public init(filters: [StanceFilter<ID>], selection: Binding<Set<ID>>) {
        self.filters = filters
        _selection = selection
    }

    public var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: StanceSpacing.sm) {
                ForEach(filters) { filter in
                    let selected = selection.contains(filter.id)
                    Button {
                        if selected { selection.remove(filter.id) } else { selection.insert(filter.id) }
                        StanceHaptics.selection()
                    } label: {
                        HStack(spacing: StanceSpacing.xs) {
                            if selected { StanceIcon(.check, size: StanceSize.iconSm - 2) }
                            Text(filter.title).stanceText(.label)
                        }
                        .padding(.horizontal, StanceSpacing.md)
                        .frame(minHeight: StanceSize.controlSm + StanceSpacing.xs)
                        .foregroundStyle(selected ? theme.colors.interactiveSelectedFg : theme.colors.fgDefault)
                        .background(selected ? theme.colors.interactiveSelected : .clear, in: Capsule())
                        .overlay { Capsule().strokeBorder(selected ? theme.colors.borderStrong : theme.colors.borderControl, lineWidth: theme.controlBorderWidth) }
                        .frame(minHeight: StanceSize.touchTarget)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
                }
                if !selection.isEmpty {
                    Button("Clear all") { selection.removeAll() }.buttonStyle(.stance(.link, size: .small))
                }
            }
            .padding(.horizontal, StanceSpacing.lg)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Filters")
    }
}

/// A list with native search. Results update as the user types and the count is announced.
public struct StanceSearchableList<Item: Identifiable, Row: View>: View {
    private let items: [Item]
    private let prompt: String
    private let matches: (Item, String) -> Bool
    private let row: (Item) -> Row
    @State private var query = ""
    @Environment(\.stanceTheme) private var theme

    public init(_ items: [Item], prompt: String = "Search", matches: @escaping (Item, String) -> Bool, @ViewBuilder row: @escaping (Item) -> Row) {
        self.items = items
        self.prompt = prompt
        self.matches = matches
        self.row = row
    }

    /// The filtering rule, exposed for tests.
    public nonisolated static func filter(_ items: [Item], query: String, matches: (Item, String) -> Bool) -> [Item] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? items : items.filter { matches($0, trimmed) }
    }

    public var body: some View {
        let results = Self.filter(items, query: query, matches: matches)
        List {
            if results.isEmpty {
                StanceEmptyState(icon: .search, title: "No results", message: "Nothing matches “\(query)”. Try a different search.")
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            } else {
                ForEach(results) { row($0).stanceListRow() }
            }
        }
        .stanceListStyle()
        .searchable(text: $query, prompt: prompt)
        .onChange(of: results.count) { _, count in
            if !query.isEmpty { StanceAnnouncer.announce(count == 1 ? "1 result" : "\(count) results") }
        }
    }
}

/// A month calendar: the native graphical `DatePicker` in Stance colours on a card.
public struct StanceCalendar: View {
    private let label: String
    private let range: ClosedRange<Date>?
    @Binding private var date: Date
    @Environment(\.stanceTheme) private var theme

    public init(_ label: String, selection: Binding<Date>, in range: ClosedRange<Date>? = nil) {
        self.label = label
        _date = selection
        self.range = range
    }

    public var body: some View {
        Group {
            if let range {
                DatePicker(label, selection: $date, in: range, displayedComponents: .date)
            } else {
                DatePicker(label, selection: $date, displayedComponents: .date)
            }
        }
        .datePickerStyle(.graphical)
        .tint(theme.colors.accentBg)
        .stanceCard(padding: StanceSpacing.md)
    }
}

// MARK: Signature

/// A captured signature: strokes in the canvas coordinate space.
public struct StanceSignature: Equatable, Sendable {
    public var strokes: [[CGPoint]] = []

    public init(strokes: [[CGPoint]] = []) { self.strokes = strokes }

    public var isEmpty: Bool { strokes.allSatisfy { $0.isEmpty } }

    public mutating func undo() { if !strokes.isEmpty { strokes.removeLast() } }
    public mutating func clear() { strokes.removeAll() }

    /// The signature as a path, smoothed with quadratic curves between midpoints.
    public var path: Path {
        var path = Path()
        for stroke in strokes {
            guard let first = stroke.first else { continue }
            path.move(to: first)
            if stroke.count == 1 {
                path.addLine(to: CGPoint(x: first.x + 0.5, y: first.y + 0.5))
                continue
            }
            for index in 1 ..< stroke.count {
                let previous = stroke[index - 1], point = stroke[index]
                path.addQuadCurve(to: CGPoint(x: (previous.x + point.x) / 2, y: (previous.y + point.y) / 2), control: previous)
            }
            if let last = stroke.last { path.addLine(to: last) }
        }
        return path
    }
}

/// A canvas for drawing a signature with a finger or Apple Pencil, with undo and clear.
///
/// Drawing is not possible for everyone. Offer an alternative next to it
/// (for example a typed name), which `alternative` renders below the canvas.
public struct StanceSignatureCanvas<Alternative: View>: View {
    private let label: String
    private let alternative: Alternative
    @Binding private var signature: StanceSignature
    @State private var active: [CGPoint] = []
    @Environment(\.stanceTheme) private var theme

    public init(_ label: String = "Signature", signature: Binding<StanceSignature>, @ViewBuilder alternative: () -> Alternative = { EmptyView() }) {
        self.label = label
        _signature = signature
        self.alternative = alternative()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            Text(label).stanceText(.label).accessibilityHidden(true)
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous).fill(theme.colors.bgSurface)
                Rectangle().fill(theme.colors.borderStrong).frame(height: 1).padding(.horizontal, StanceSpacing.xl).padding(.bottom, StanceSpacing.xxl)
                if signature.isEmpty && active.isEmpty {
                    Text("Sign here").stanceText(.bodySmall).foregroundStyle(theme.colors.fgSubtle).padding(.bottom, StanceSpacing.xxl + StanceSpacing.sm)
                }
                Canvas { context, _ in
                    var drawing = signature
                    if !active.isEmpty { drawing.strokes.append(active) }
                    context.stroke(drawing.path, with: .color(theme.colors.fgDefault), style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
                }
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { active.append($0.location) }
                        .onEnded { _ in
                            signature.strokes.append(active)
                            active = []
                        }
                )
            }
            .frame(height: 180)
            .overlay { RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous).strokeBorder(theme.colors.borderControl, lineWidth: theme.controlBorderWidth) }
            .clipShape(RoundedRectangle(cornerRadius: StanceRadius.lg, style: .continuous))
            .accessibilityElement()
            .accessibilityLabel(label)
            .accessibilityValue(signature.isEmpty ? "Empty" : "Signed")
            .accessibilityHint("Draw your signature with a finger or Apple Pencil")
            .accessibilityAddTraits(.allowsDirectInteraction)
            HStack(spacing: StanceSpacing.sm) {
                Button("Undo") { signature.undo() }.buttonStyle(.stance(.ghost, size: .small)).disabled(signature.isEmpty)
                Button("Clear") { signature.clear() }.buttonStyle(.stance(.ghost, size: .small)).disabled(signature.isEmpty)
            }
            alternative
        }
    }
}

// MARK: Attachments

/// A picked attachment.
public enum StanceAttachment: Sendable {
    case file(URL)
    case imageData(Data)
}

/// Buttons that open the system photo picker and the system file importer.
/// Nothing is requested up front: the system pickers need no library permission.
public struct StanceAttachmentPicker: View {
    private let allowedTypes: [UTType]
    private let onPick: (StanceAttachment) -> Void
    @State private var importing = false
    #if canImport(PhotosUI)
    @State private var photo: PhotosPickerItem?
    #endif

    public init(allowedTypes: [UTType] = [.pdf, .image], onPick: @escaping (StanceAttachment) -> Void) {
        self.allowedTypes = allowedTypes
        self.onPick = onPick
    }

    public var body: some View {
        StanceButtonGroup {
            Button {
                importing = true
            } label: {
                Label { Text("Choose file") } icon: { StanceIcon(.file, size: StanceSize.iconSm + 2) }
            }
            .buttonStyle(.stance(.outline))
            #if canImport(PhotosUI)
            PhotosPicker(selection: $photo, matching: .images) {
                Label { Text("Photo library") } icon: { StanceIcon(.image, size: StanceSize.iconSm + 2) }
            }
            .buttonStyle(.stance(.outline))
            .onChange(of: photo) { _, item in
                guard let item else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self) { onPick(.imageData(data)) }
                }
            }
            #endif
        }
        .fileImporter(isPresented: $importing, allowedContentTypes: allowedTypes) { result in
            if case let .success(url) = result { onPick(.file(url)) }
        }
    }
}
