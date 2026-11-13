import SwiftUI

/// Words a ``StanceSortableList`` uses. Leave a value out to keep the localised default.
public struct StanceSortableListLabels: Sendable {
    public var moveUp: String?
    public var moveDown: String?

    /// - Parameters:
    ///   - moveUp: The VoiceOver action that moves an item up. Defaults to a localised "Move up".
    ///   - moveDown: The VoiceOver action that moves an item down. Defaults to a localised "Move down".
    public init(moveUp: String? = nil, moveDown: String? = nil) {
        self.moveUp = moveUp
        self.moveDown = moveDown
    }
}

/// A list people put in their own order: approval steps, signature fields, pinned templates.
///
/// Built on `List` with `onMove`. On iOS the list shows the system reorder handles while editing;
/// pass `showsEditButton` to add the system `EditButton` above it, or drive edit mode yourself.
/// Dragging is not the only way: every row offers Move up and Move down as VoiceOver actions,
/// and each move is announced with the new position.
public struct StanceSortableList<Item: Identifiable, Row: View>: View {
    private let title: String?
    private let showsEditButton: Bool
    private let labels: StanceSortableListLabels
    private let itemLabel: (Item) -> String
    private let row: (Item) -> Row
    @Binding private var items: [Item]
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale

    /// - Parameters:
    ///   - title: An optional heading shown above the list, next to the Edit button.
    ///   - items: The items, in order. Moves update this binding.
    ///   - showsEditButton: Shows the system Edit button that turns reorder handles on and off (iOS).
    ///   - labels: Replacements for the built in words.
    ///   - itemLabel: The name of an item, used in move announcements.
    ///   - row: The row content.
    @_disfavoredOverload
    public init(
        _ title: String? = nil,
        items: Binding<[Item]>,
        showsEditButton: Bool = true,
        labels: StanceSortableListLabels = .init(),
        itemLabel: @escaping (Item) -> String,
        @ViewBuilder row: @escaping (Item) -> Row
    ) {
        self.title = title
        _items = items
        self.showsEditButton = showsEditButton
        self.labels = labels
        self.itemLabel = itemLabel
        self.row = row
    }

    /// Moves the item at `index` by `offset` places, clamped to the ends of the list.
    /// Returns the new index, or `nil` when the item could not move.
    @discardableResult
    public nonisolated static func move(_ items: inout [Item], from index: Int, by offset: Int) -> Int? {
        guard items.indices.contains(index) else { return nil }
        let target = min(max(index + offset, 0), items.count - 1)
        guard target != index else { return nil }
        let item = items.remove(at: index)
        items.insert(item, at: target)
        return target
    }

    /// Applies a `List` move: the same arithmetic as `Array.move(fromOffsets:toOffset:)`.
    public nonisolated static func move(_ items: inout [Item], fromOffsets source: IndexSet, toOffset destination: Int) {
        items.move(fromOffsets: source, toOffset: destination)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: StanceSpacing.sm) {
            if title != nil || showsEditButton {
                HStack {
                    if let title { Text(title).stanceText(.label).accessibilityAddTraits(.isHeader) }
                    Spacer(minLength: 0)
                    #if os(iOS)
                    if showsEditButton {
                        EditButton().stanceText(.label).tint(theme.colors.fgLink).frame(minHeight: StanceSize.touchTarget)
                    }
                    #endif
                }
            }
            List {
                ForEach(items) { item in
                    row(item)
                        .frame(minHeight: StanceSize.touchTarget)
                        .stanceListRow()
                        .accessibilityElement(children: .combine)
                        .accessibilityValue(position(of: item))
                        .accessibilityAction(named: Text(labels.moveUp ?? stanceString("stance.sortable.moveUp", locale))) { move(item, by: -1) }
                        .accessibilityAction(named: Text(labels.moveDown ?? stanceString("stance.sortable.moveDown", locale))) { move(item, by: 1) }
                }
                .onMove { source, destination in
                    Self.move(&items, fromOffsets: source, toOffset: destination)
                    StanceHaptics.selection()
                }
            }
            .stanceListStyle()
        }
    }

    private func position(of item: Item) -> String {
        let index = (items.firstIndex { $0.id == item.id } ?? 0) + 1
        return stanceString("stance.sortable.position \(index) \(items.count)", locale)
    }

    private func move(_ item: Item, by offset: Int) {
        guard let index = items.firstIndex(where: { $0.id == item.id }), let target = Self.move(&items, from: index, by: offset) else { return }
        StanceHaptics.selection()
        StanceAnnouncer.announce(stanceString("stance.sortable.moved \(itemLabel(item)) \(target + 1) \(items.count)", locale))
    }
}

// MARK: Localised labels

extension StanceSortableList {
    /// Creates a sortable list whose title is looked up in the app's string tables.
    public init(
        _ titleKey: LocalizedStringResource,
        items: Binding<[Item]>,
        showsEditButton: Bool = true,
        labels: StanceSortableListLabels = .init(),
        itemLabel: @escaping (Item) -> String,
        @ViewBuilder row: @escaping (Item) -> Row
    ) {
        self.init(String(localized: titleKey), items: items, showsEditButton: showsEditButton, labels: labels, itemLabel: itemLabel, row: row)
    }
}
