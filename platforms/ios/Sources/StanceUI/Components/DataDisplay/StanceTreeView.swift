import SwiftUI

/// One node in a ``StanceTreeView``: a leaf, or a branch with children.
public struct StanceTreeNode<ID: Hashable & Sendable>: Identifiable, Sendable {
    public let id: ID
    public let title: String
    public let subtitle: String?
    public let icon: StanceIconName?
    /// `nil` for a leaf. An empty array is a branch with nothing in it yet.
    public let children: [StanceTreeNode]?

    /// - Parameters:
    ///   - id: A stable identifier, unique in the tree.
    ///   - title: The visible name.
    ///   - subtitle: Optional secondary text.
    ///   - icon: Optional leading icon. Branches without one show a folder.
    ///   - children: Child nodes, or `nil` for a leaf.
    public init(id: ID, title: String, subtitle: String? = nil, icon: StanceIconName? = nil, children: [StanceTreeNode]? = nil) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.children = children
    }

    /// Whether the node can be expanded.
    public var isBranch: Bool { children != nil }
}

/// A visible row of a tree, with its depth from the root.
public struct StanceTreeRow<ID: Hashable & Sendable>: Identifiable, Sendable {
    public let node: StanceTreeNode<ID>
    /// 0 for top level nodes.
    public let depth: Int
    /// Position among its siblings, from 1.
    public let position: Int
    /// Number of siblings including itself.
    public let siblingCount: Int
    public var id: ID { node.id }
}

/// Expand state logic for ``StanceTreeView``, usable without a view.
public enum StanceTreeState {
    /// Rows that are visible: top level nodes, plus the children of every expanded branch.
    public static func visibleRows<ID>(_ nodes: [StanceTreeNode<ID>], expanded: Set<ID>, depth: Int = 0) -> [StanceTreeRow<ID>] {
        var rows: [StanceTreeRow<ID>] = []
        for (index, node) in nodes.enumerated() {
            rows.append(StanceTreeRow(node: node, depth: depth, position: index + 1, siblingCount: nodes.count))
            if let children = node.children, expanded.contains(node.id) {
                rows += visibleRows(children, expanded: expanded, depth: depth + 1)
            }
        }
        return rows
    }

    /// The identifiers of every branch, for expanding the whole tree.
    public static func allBranches<ID>(_ nodes: [StanceTreeNode<ID>]) -> Set<ID> {
        var ids = Set<ID>()
        for node in nodes {
            if let children = node.children {
                ids.insert(node.id)
                ids.formUnion(allBranches(children))
            }
        }
        return ids
    }

    /// Expands a collapsed branch or collapses an expanded one. Leaves are ignored.
    public static func toggle<ID>(_ node: StanceTreeNode<ID>, in expanded: inout Set<ID>) {
        guard node.isBranch else { return }
        if expanded.contains(node.id) { expanded.remove(node.id) } else { expanded.insert(node.id) }
    }

    /// The identifiers of the branches that lead to `target`, so it can be revealed.
    public static func ancestors<ID>(of target: ID, in nodes: [StanceTreeNode<ID>]) -> [ID]? {
        for node in nodes {
            if node.id == target { return [] }
            if let children = node.children, let path = ancestors(of: target, in: children) { return [node.id] + path }
        }
        return nil
    }
}

/// A nested list people browse and pick from: folders, teams or categories.
///
/// Built on `List`, with the expanded branches held in a binding you own, so the tree can be
/// restored, expanded from code or revealed to a selected item. Each row tells VoiceOver its
/// level, position and whether it is expanded, and offers expand and collapse as actions.
public struct StanceTreeView<ID: Hashable & Sendable>: View {
    private let nodes: [StanceTreeNode<ID>]
    private let title: String?
    @Binding private var expanded: Set<ID>
    @Binding private var selection: ID?
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.layoutDirection) private var layoutDirection
    @ScaledMetric(relativeTo: .body) private var indent: CGFloat = StanceSpacing.xl

    /// - Parameters:
    ///   - title: An optional accessible name for the tree.
    ///   - nodes: Top level nodes.
    ///   - expanded: The identifiers of expanded branches.
    ///   - selection: The selected node, if any. Any node can be selected; branches also expand from their chevron.
    @_disfavoredOverload
    public init(_ title: String? = nil, nodes: [StanceTreeNode<ID>], expanded: Binding<Set<ID>>, selection: Binding<ID?> = .constant(nil)) {
        self.title = title
        self.nodes = nodes
        _expanded = expanded
        _selection = selection
    }

    public var body: some View {
        List {
            ForEach(StanceTreeState.visibleRows(nodes, expanded: expanded)) { row in
                rowView(row)
                    .listRowInsets(EdgeInsets(top: 0, leading: StanceSpacing.sm + indent * CGFloat(row.depth), bottom: 0, trailing: StanceSpacing.md))
                    .listRowBackground(selection == row.id ? theme.colors.interactiveSelected : theme.colors.bgSurface)
                    .listRowSeparatorTint(theme.colors.separator)
            }
        }
        .stanceListStyle()
        .accessibilityLabel(title ?? "")
    }

    private func rowView(_ row: StanceTreeRow<ID>) -> some View {
        let node = row.node
        let isOpen = expanded.contains(node.id)
        let isSelected = selection == node.id
        return HStack(spacing: StanceSpacing.xs) {
            if node.isBranch {
                Button {
                    toggle(node)
                } label: {
                    StanceIcon(.chevronRight, size: StanceSize.iconSm)
                        .rotationEffect(.degrees(isOpen ? (layoutDirection == .rightToLeft ? -90 : 90) : 0))
                        .foregroundStyle(theme.colors.fgMuted)
                        .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityHidden(true)
            } else {
                Color.clear.frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget).accessibilityHidden(true)
            }
            Button {
                selection = node.id
                StanceHaptics.selection()
            } label: {
                HStack(spacing: StanceSpacing.sm) {
                    StanceIcon(node.icon ?? (node.isBranch ? (isOpen ? .folderOpen : .folder) : .file), size: StanceSize.iconMd)
                        .foregroundStyle(theme.colors.fgMuted)
                    VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                        Text(node.title).stanceText(isSelected ? .label : .body)
                        if let subtitle = node.subtitle {
                            Text(subtitle).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                        }
                    }
                    .multilineTextAlignment(.leading)
                    Spacer(minLength: 0)
                }
                .foregroundStyle(isSelected ? theme.colors.interactiveSelectedFg : theme.colors.fgDefault)
                .frame(minHeight: StanceSize.touchTarget)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        }
        .stanceAnimation(.fast, value: isOpen)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel([node.title, node.subtitle].compactMap { $0 }.joined(separator: ", "))
        .accessibilityValue(value(for: row, isOpen: isOpen))
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
        .accessibilityAction { selection = node.id }
        .accessibilityAction(named: Text(stanceString(isOpen ? "stance.tree.collapse" : "stance.tree.expand", locale))) {
            if node.isBranch { toggle(node) }
        }
    }

    private func value(for row: StanceTreeRow<ID>, isOpen: Bool) -> String {
        var parts = [stanceString("stance.tree.position \(row.depth + 1) \(row.position) \(row.siblingCount)", locale)]
        if row.node.isBranch { parts.append(stanceString(isOpen ? "stance.expanded" : "stance.collapsed", locale)) }
        return parts.joined(separator: ", ")
    }

    private func toggle(_ node: StanceTreeNode<ID>) {
        withAnimation(StanceMotion.normal.animation(reduceMotion: reduceMotion)) {
            StanceTreeState.toggle(node, in: &expanded)
        }
    }
}

// MARK: Localised labels

extension StanceTreeView {
    /// Creates a tree whose accessible name is looked up in the app's string tables.
    public init(_ titleKey: LocalizedStringResource, nodes: [StanceTreeNode<ID>], expanded: Binding<Set<ID>>, selection: Binding<ID?> = .constant(nil)) {
        self.init(String(localized: titleKey), nodes: nodes, expanded: expanded, selection: selection)
    }
}
