import SwiftUI

/// One slot in a ``StancePagination`` page row: a page number or a gap.
public enum StancePaginationItem: Hashable, Sendable {
    /// A page, numbered from 1.
    case page(Int)
    /// A gap between the first pages and the current group.
    case startEllipsis
    /// A gap between the current group and the last pages.
    case endEllipsis
}

/// Words a ``StancePagination`` uses. Leave a value out to keep the localised default.
public struct StancePaginationLabels: Sendable {
    public var previous: String?
    public var next: String?
    public var summary: (@Sendable (Int, Int) -> String)?

    /// - Parameters:
    ///   - previous: The previous button. Defaults to a localised "Previous".
    ///   - next: The next button. Defaults to a localised "Next".
    ///   - summary: The page summary for a page and page count. Defaults to a localised "Page 2 of 5".
    public init(previous: String? = nil, next: String? = nil, summary: (@Sendable (Int, Int) -> String)? = nil) {
        self.previous = previous
        self.next = next
        self.summary = summary
    }
}

/// Moves through pages of a table or list: previous, next and a page summary.
///
/// In regular width (iPad) a row of page numbers sits between the buttons when it fits. Its length stays the
/// same as the page changes, so buttons never move under the finger. In compact width only the
/// summary is shown. Pages are numbered from 1 and the binding is always kept within range.
public struct StancePagination: View {
    private let pageCount: Int
    private let siblingCount: Int
    private let boundaryCount: Int
    private let labels: StancePaginationLabels
    @Binding private var page: Int
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Environment(\.dynamicTypeSize) private var typeSize

    /// - Parameters:
    ///   - page: The current page, from 1 to `pageCount`.
    ///   - pageCount: The number of pages.
    ///   - siblingCount: Pages shown on each side of the current page in the number row.
    ///   - boundaryCount: Pages always shown at each end of the number row.
    ///   - labels: Replacements for the built in words.
    public init(page: Binding<Int>, pageCount: Int, siblingCount: Int = 1, boundaryCount: Int = 1, labels: StancePaginationLabels = .init()) {
        _page = page
        self.pageCount = max(0, pageCount)
        self.siblingCount = max(0, siblingCount)
        self.boundaryCount = max(0, boundaryCount)
        self.labels = labels
    }

    /// Keeps a page within 1 to `pageCount`. With no pages the result is 1.
    public nonisolated static func clamp(_ page: Int, pageCount: Int) -> Int {
        min(max(page, 1), max(pageCount, 1))
    }

    /// The visible page numbers: boundary pages at each end, siblings around the current page and
    /// gaps between them. The number of slots is the same for every current page.
    public nonisolated static func range(page: Int, pageCount: Int, siblingCount: Int = 1, boundaryCount: Int = 1) -> [StancePaginationItem] {
        guard pageCount > 0 else { return [] }
        func run(_ from: Int, _ to: Int) -> [Int] { from <= to ? Array(from ... to) : [] }
        let totalSlots = boundaryCount * 2 + siblingCount * 2 + 3
        if pageCount <= totalSlots { return run(1, pageCount).map(StancePaginationItem.page) }
        let current = clamp(page, pageCount: pageCount)
        let startPages = run(1, min(boundaryCount, pageCount))
        let endPages = run(max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount)
        let siblingsStart = max(min(current - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1), boundaryCount + 2)
        let siblingsEnd = min(max(current + siblingCount, boundaryCount + siblingCount * 2 + 2), endPages.first.map { $0 - 2 } ?? pageCount - 1)
        var items = startPages.map(StancePaginationItem.page)
        if siblingsStart > boundaryCount + 2 {
            items.append(.startEllipsis)
        } else if boundaryCount + 1 < pageCount - boundaryCount {
            items.append(.page(boundaryCount + 1))
        }
        items += run(siblingsStart, siblingsEnd).map(StancePaginationItem.page)
        if siblingsEnd < pageCount - boundaryCount - 1 {
            items.append(.endEllipsis)
        } else if pageCount - boundaryCount > boundaryCount {
            items.append(.page(pageCount - boundaryCount))
        }
        items += endPages.map(StancePaginationItem.page)
        return items
    }

    private var current: Int { Self.clamp(page, pageCount: pageCount) }

    private var summary: String {
        labels.summary?(current, max(pageCount, 1)) ?? stanceString("stance.page \(current) \(max(pageCount, 1))", locale)
    }

    public var body: some View {
        HStack(spacing: StanceSpacing.sm) {
            Button {
                go(to: current - 1)
            } label: {
                HStack(spacing: StanceSpacing.xs) {
                    StanceIcon(.chevronLeft, size: StanceSize.iconSm)
                    if !typeSize.isAccessibilitySize { Text(labels.previous ?? stanceString("stance.pagination.previous", locale)) }
                }
            }
            .buttonStyle(.stance(.ghost, size: .small))
            .disabled(current <= 1)
            .accessibilityLabel(labels.previous ?? stanceString("stance.pagination.previous", locale))
            Spacer(minLength: 0)
            if sizeClass == .regular && !typeSize.isAccessibilitySize {
                // The number row when it fits, otherwise the summary.
                ViewThatFits(in: .horizontal) {
                    pageRow
                    summaryText
                }
            } else {
                summaryText
            }
            Spacer(minLength: 0)
            Button {
                go(to: current + 1)
            } label: {
                HStack(spacing: StanceSpacing.xs) {
                    if !typeSize.isAccessibilitySize { Text(labels.next ?? stanceString("stance.pagination.next", locale)) }
                    StanceIcon(.chevronRight, size: StanceSize.iconSm)
                }
            }
            .buttonStyle(.stance(.ghost, size: .small))
            .disabled(current >= pageCount)
            .accessibilityLabel(labels.next ?? stanceString("stance.pagination.next", locale))
        }
        .frame(minHeight: StanceSize.touchTarget)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(stanceString("stance.pagination", locale))
        .onAppear { if pageCount > 0 && page != current { page = current } }
    }

    private var summaryText: some View {
        Text(summary)
            .stanceText(.label)
            .foregroundStyle(theme.colors.fgMuted)
            .monospacedDigit()
            .multilineTextAlignment(.center)
            .accessibilityAddTraits(.updatesFrequently)
    }

    private var pageRow: some View {
        HStack(spacing: StanceSpacing.xxs) {
            ForEach(Array(Self.range(page: current, pageCount: pageCount, siblingCount: siblingCount, boundaryCount: boundaryCount).enumerated()), id: \.offset) { _, item in
                switch item {
                case let .page(number):
                    let selected = number == current
                    Button {
                        go(to: number)
                    } label: {
                        Text(number.formatted(.number.locale(locale)))
                            .stanceText(.label)
                            .monospacedDigit()
                            .frame(minWidth: StanceSize.touchTarget, minHeight: StanceSize.touchTarget)
                            .foregroundStyle(selected ? theme.colors.accentFg : theme.colors.fgDefault)
                            .background(selected ? theme.colors.accentBg : .clear, in: RoundedRectangle(cornerRadius: StanceRadius.md, style: .continuous))
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(stanceString("stance.pagination.page \(number)", locale))
                    .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
                case .startEllipsis, .endEllipsis:
                    StanceIcon(.moreHorizontal, size: StanceSize.iconSm)
                        .foregroundStyle(theme.colors.fgMuted)
                        .frame(width: StanceSize.touchTarget, height: StanceSize.touchTarget)
                        .accessibilityHidden(true)
                }
            }
        }
    }

    private func go(to target: Int) {
        let new = Self.clamp(target, pageCount: pageCount)
        guard new != page else { return }
        page = new
        StanceHaptics.selection()
        StanceAnnouncer.announce(labels.summary?(new, max(pageCount, 1)) ?? stanceString("stance.page \(new) \(max(pageCount, 1))", locale))
    }
}
