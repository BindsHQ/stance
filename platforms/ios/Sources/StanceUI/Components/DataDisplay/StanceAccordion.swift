import SwiftUI

/// One collapsible section in a ``StanceAccordion``.
public struct StanceAccordionSection<ID: Hashable>: Identifiable {
    public let id: ID
    public let title: String
    public let subtitle: String?
    public let isDisabled: Bool

    /// - Parameters:
    ///   - id: Identifies the section in the accordion's expanded set.
    ///   - title: The visible heading and accessible name.
    ///   - subtitle: An optional secondary line under the title.
    ///   - isDisabled: Disabled sections cannot be opened or closed.
    @_disfavoredOverload
    public init(id: ID, title: String, subtitle: String? = nil, isDisabled: Bool = false) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.isDisabled = isDisabled
    }

    /// Creates a section whose title is looked up in the app's string tables.
    public init(id: ID, title titleKey: LocalizedStringResource, subtitle: String? = nil, isDisabled: Bool = false) {
        self.init(id: id, title: String(localized: titleKey), subtitle: subtitle, isDisabled: isDisabled)
    }
}

/// How the sections of a ``StanceAccordion`` are drawn.
public enum StanceAccordionVariant: Sendable {
    /// Sections share one card, separated by hairlines.
    case grouped
    /// Each section is its own card.
    case separated
}

/// Whether one or several sections of a ``StanceAccordion`` can be open at once.
public enum StanceAccordionMode: Sendable {
    /// Opening a section closes the others.
    case single
    /// Any number of sections can be open.
    case multiple
}

/// The expand and collapse rules, exposed for tests and for apps that drive an accordion.
public enum StanceAccordionLogic {
    /// The expanded set after a section is toggled.
    ///
    /// - Parameters:
    ///   - id: The section that was activated.
    ///   - expanded: The currently open sections.
    ///   - mode: In `.single` mode opening a section closes the others.
    ///   - collapsible: In `.single` mode, whether the open section can be closed, leaving none open.
    public static func toggling<ID: Hashable>(_ id: ID, in expanded: Set<ID>, mode: StanceAccordionMode, collapsible: Bool = true) -> Set<ID> {
        let isOpen = expanded.contains(id)
        switch mode {
        case .multiple:
            var next = expanded
            if isOpen { next.remove(id) } else { next.insert(id) }
            return next
        case .single:
            if isOpen { return collapsible ? [] : [id] }
            return [id]
        }
    }
}

/// A vertical stack of collapsible sections built on the native `DisclosureGroup`.
///
/// Each section is a `DisclosureGroup` in ``StanceDisclosureGroupStyle``, so VoiceOver hears its
/// title, whether it is expanded and a button trait. In `.single` mode opening one section closes
/// the others, as the web accordion does.
///
/// ```swift
/// StanceAccordion(sections, expanded: $open, mode: .single) { section in
///     Text(answers[section.id] ?? "")
/// }
/// ```
public struct StanceAccordion<ID: Hashable, Content: View>: View {
    private let sections: [StanceAccordionSection<ID>]
    private let mode: StanceAccordionMode
    private let collapsible: Bool
    private let variant: StanceAccordionVariant
    private let content: (StanceAccordionSection<ID>) -> Content
    @Binding private var expanded: Set<ID>
    @Environment(\.stanceTheme) private var theme

    /// - Parameters:
    ///   - sections: The sections, in order.
    ///   - expanded: The identifiers of the open sections.
    ///   - mode: `.single` keeps at most one section open; `.multiple` lets any number open.
    ///   - collapsible: In `.single` mode, whether the open section can be closed again.
    ///   - variant: One shared card or a card per section.
    ///   - content: The body of each section, shown when it is open.
    public init(
        _ sections: [StanceAccordionSection<ID>],
        expanded: Binding<Set<ID>>,
        mode: StanceAccordionMode = .multiple,
        collapsible: Bool = true,
        variant: StanceAccordionVariant = .grouped,
        @ViewBuilder content: @escaping (StanceAccordionSection<ID>) -> Content
    ) {
        self.sections = sections
        _expanded = expanded
        self.mode = mode
        self.collapsible = collapsible
        self.variant = variant
        self.content = content
    }

    public var body: some View {
        switch variant {
        case .grouped:
            VStack(spacing: 0) {
                ForEach(Array(sections.enumerated()), id: \.element.id) { index, section in
                    row(section).padding(.horizontal, StanceSpacing.lg)
                    if index < sections.count - 1 { StanceDivider() }
                }
            }
            .stanceSurface(.surface, cornerRadius: StanceRadius.xl)
        case .separated:
            VStack(spacing: StanceSpacing.sm) {
                ForEach(sections) { section in
                    row(section)
                        .padding(.horizontal, StanceSpacing.lg)
                        .stanceSurface(.surface, cornerRadius: StanceRadius.xl)
                }
            }
        }
    }

    private func row(_ section: StanceAccordionSection<ID>) -> some View {
        DisclosureGroup(isExpanded: binding(for: section.id)) {
            content(section)
                .frame(maxWidth: .infinity, alignment: .leading)
        } label: {
            VStack(alignment: .leading, spacing: StanceSpacing.xxs) {
                Text(section.title)
                if let subtitle = section.subtitle {
                    Text(subtitle).stanceText(.caption).foregroundStyle(theme.colors.fgMuted)
                }
            }
            .padding(.vertical, StanceSpacing.sm)
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)
        }
        .disclosureGroupStyle(.stance)
        .disabled(section.isDisabled)
        .foregroundStyle(section.isDisabled ? theme.colors.disabledFg : theme.colors.fgDefault)
    }

    private func binding(for id: ID) -> Binding<Bool> {
        Binding(
            get: { expanded.contains(id) },
            set: { open in
                guard open != expanded.contains(id) else { return }
                expanded = StanceAccordionLogic.toggling(id, in: expanded, mode: mode, collapsible: collapsible)
            }
        )
    }
}
