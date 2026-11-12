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
    @Environment(\.locale) private var locale

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
                    Button(stanceString("stance.filters.clear", locale)) { selection.removeAll() }.buttonStyle(.stance(.link, size: .small))
                }
            }
            .padding(.horizontal, StanceSpacing.lg)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(stanceString("stance.filters", locale))
    }
}

/// A list with native search. Results update as the user types and the count is announced.
public struct StanceSearchableList<Item: Identifiable, Row: View>: View {
    private let items: [Item]
    private let prompt: String?
    private let matches: (Item, String) -> Bool
    private let row: (Item) -> Row
    @State private var query = ""
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameter prompt: The search field placeholder. Defaults to a localised "Search".
    public init(_ items: [Item], prompt: String? = nil, matches: @escaping (Item, String) -> Bool, @ViewBuilder row: @escaping (Item) -> Row) {
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
                StanceEmptyState(icon: .search, title: stanceString("stance.results.none", locale), message: stanceString("stance.results.noneMessage \(query)", locale))
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            } else {
                ForEach(results) { row($0).stanceListRow() }
            }
        }
        .stanceListStyle()
        .searchable(text: $query, prompt: prompt ?? stanceString("stance.search", locale))
        .onChange(of: results.count) { _, count in
            if !query.isEmpty { StanceAnnouncer.announce(stanceString("stance.results.count \(count)", locale)) }
        }
    }
}

/// A month calendar: the native graphical `DatePicker` in Stance colours on a card.
public struct StanceCalendar: View {
    private let label: String
    private let range: ClosedRange<Date>?
    @Binding private var date: Date
    @Environment(\.stanceTheme) private var theme

    @_disfavoredOverload
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
    private let customLabel: String?
    private let alternative: Alternative
    @Binding private var signature: StanceSignature
    @State private var active: [CGPoint] = []
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    private var label: String { customLabel ?? stanceString("stance.signature", locale) }

    /// - Parameter label: The visible label and accessible name. Defaults to a localised "Signature".
    @_disfavoredOverload
    public init(_ label: String? = nil, signature: Binding<StanceSignature>, @ViewBuilder alternative: () -> Alternative = { EmptyView() }) {
        customLabel = label
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
                    Text(stanceString("stance.signature.placeholder", locale)).stanceText(.bodySmall).foregroundStyle(theme.colors.fgSubtle).padding(.bottom, StanceSpacing.xxl + StanceSpacing.sm)
                }
                Canvas { context, _ in
                    var drawing = signature
                    if !active.isEmpty { drawing.strokes.append(active) }
                    context.stroke(drawing.path, with: .color(theme.colors.fgDefault), style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
                }
                // A signature is drawn as written. Strokes keep their coordinates in right to left layouts.
                .environment(\.layoutDirection, .leftToRight)
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
            .accessibilityValue(stanceString(signature.isEmpty ? "stance.signature.empty" : "stance.signature.signed", locale))
            .accessibilityHint(stanceString("stance.signature.hint", locale))
            .accessibilityAddTraits(.allowsDirectInteraction)
            HStack(spacing: StanceSpacing.sm) {
                Button(stanceString("stance.undo", locale)) { signature.undo() }.buttonStyle(.stance(.ghost, size: .small)).disabled(signature.isEmpty)
                Button(stanceString("stance.clear", locale)) { signature.clear() }.buttonStyle(.stance(.ghost, size: .small)).disabled(signature.isEmpty)
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

/// A title with a Stance icon. Its initialiser is not isolated, so it can be built inside the
/// photo picker's label closure.
private struct StancePickerLabel: View {
    let title: String
    let icon: StanceIconName

    nonisolated init(title: String, icon: StanceIconName) {
        self.title = title
        self.icon = icon
    }

    var body: some View {
        Label { Text(title) } icon: { StanceIcon(icon, size: StanceSize.iconSm + 2) }
    }
}

/// Buttons that open the system photo picker and the system file importer.
/// Nothing is requested up front: the system pickers need no library permission.
public struct StanceAttachmentPicker: View {
    private let allowedTypes: [UTType]
    private let onPick: (StanceAttachment) -> Void
    @State private var importing = false
    @Environment(\.locale) private var locale
    #if canImport(PhotosUI)
    @State private var photo: PhotosPickerItem?
    #endif

    public init(allowedTypes: [UTType] = [.pdf, .image], onPick: @escaping (StanceAttachment) -> Void) {
        self.allowedTypes = allowedTypes
        self.onPick = onPick
    }

    public var body: some View {
        // Resolved here, on the main actor: the photo picker's label closure is not isolated.
        let photoTitle = stanceString("stance.attachment.photoLibrary", locale)
        StanceButtonGroup {
            Button {
                importing = true
            } label: {
                StancePickerLabel(title: stanceString("stance.attachment.chooseFile", locale), icon: .file)
            }
            .buttonStyle(.stance(.outline))
            #if canImport(PhotosUI)
            PhotosPicker(selection: $photo, matching: .images) {
                StancePickerLabel(title: photoTitle, icon: .image)
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

// MARK: Localised labels

extension StanceCalendar {
    /// Creates a calendar whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, selection: Binding<Date>, in range: ClosedRange<Date>? = nil) {
        self.init(String(localized: labelKey), selection: selection, in: range)
    }
}

extension StanceSignatureCanvas {
    /// Creates a signature canvas whose label is looked up in the app's string tables.
    public init(_ labelKey: LocalizedStringResource, signature: Binding<StanceSignature>, @ViewBuilder alternative: () -> Alternative = { EmptyView() }) {
        self.init(String(localized: labelKey), signature: signature, alternative: alternative)
    }
}
