import SwiftUI

/// Configuration for a native confirmation, with a destructive option.
public struct StanceConfirmation: Identifiable, Sendable {
    public let id = UUID()
    public let title: String
    public let message: String?
    public let confirmTitle: String
    public let cancelTitle: String
    public let isDestructive: Bool

    /// - Parameters:
    ///   - confirmTitle: Defaults to a localised "Confirm".
    ///   - cancelTitle: Defaults to a localised "Cancel".
    public init(title: String, message: String? = nil, confirmTitle: String? = nil, cancelTitle: String? = nil, isDestructive: Bool = false) {
        self.title = title
        self.message = message
        self.confirmTitle = confirmTitle ?? StanceLocalization.string("stance.confirm")
        self.cancelTitle = cancelTitle ?? StanceLocalization.string("stance.cancel")
        self.isDestructive = isDestructive
    }
}

extension View {
    /// Presents the system alert for a confirmation. Use for decisions that interrupt the task.
    public func stanceAlert(_ confirmation: Binding<StanceConfirmation?>, onConfirm: @escaping () -> Void) -> some View {
        alert(
            confirmation.wrappedValue?.title ?? "",
            isPresented: Binding(get: { confirmation.wrappedValue != nil }, set: { if !$0 { confirmation.wrappedValue = nil } }),
            presenting: confirmation.wrappedValue
        ) { item in
            Button(item.confirmTitle, role: item.isDestructive ? .destructive : nil, action: onConfirm)
            Button(item.cancelTitle, role: .cancel) {}
        } message: { item in
            if let message = item.message { Text(message) }
        }
    }

    /// Presents the system confirmation dialog (an action sheet on iPhone, a popover on iPad).
    /// Prefer it for destructive actions started from a button or row.
    public func stanceConfirmationDialog(_ confirmation: Binding<StanceConfirmation?>, onConfirm: @escaping () -> Void) -> some View {
        confirmationDialog(
            confirmation.wrappedValue?.title ?? "",
            isPresented: Binding(get: { confirmation.wrappedValue != nil }, set: { if !$0 { confirmation.wrappedValue = nil } }),
            titleVisibility: .visible,
            presenting: confirmation.wrappedValue
        ) { item in
            Button(item.confirmTitle, role: item.isDestructive ? .destructive : nil, action: onConfirm)
            Button(item.cancelTitle, role: .cancel) {}
        } message: { item in
            if let message = item.message { Text(message) }
        }
    }

    /// Presents a native sheet with a Stance title bar, detents and themed content.
    /// The system sheet material, grabber and dismissal gestures are kept.
    @_disfavoredOverload
    public func stanceSheet<SheetContent: View>(
        _ title: String,
        isPresented: Binding<Bool>,
        detents: Set<PresentationDetent> = [.medium, .large],
        @ViewBuilder content: @escaping () -> SheetContent
    ) -> some View {
        modifier(StanceSheetModifier(title: title, isPresented: isPresented, detents: detents, sheetContent: content))
    }

    /// Presents a native sheet whose title is looked up in the app's string tables.
    public func stanceSheet<SheetContent: View>(
        _ titleKey: LocalizedStringResource,
        isPresented: Binding<Bool>,
        detents: Set<PresentationDetent> = [.medium, .large],
        @ViewBuilder content: @escaping () -> SheetContent
    ) -> some View {
        modifier(StanceSheetModifier(title: String(localized: titleKey), isPresented: isPresented, detents: detents, sheetContent: content))
    }
}

private struct StanceSheetModifier<SheetContent: View>: ViewModifier {
    let title: String
    @Binding var isPresented: Bool
    let detents: Set<PresentationDetent>
    @ViewBuilder let sheetContent: () -> SheetContent
    @Environment(\.stanceTheme) private var theme
    @Environment(\.locale) private var locale
    @Environment(\.layoutDirection) private var layoutDirection

    func body(content: Content) -> some View {
        content.sheet(isPresented: $isPresented) {
            NavigationStack {
                ScrollView {
                    sheetContent().padding(StanceSpacing.lg).frame(maxWidth: .infinity, alignment: .leading)
                }
                .navigationTitle(title)
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                #endif
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(stanceString("stance.close", locale)) { isPresented = false }
                    }
                }
            }
            .presentationDetents(detents)
            .presentationDragIndicator(.visible)
            .environment(\.stanceTheme, theme)
            .environment(\.locale, locale)
            .environment(\.layoutDirection, layoutDirection)
            .tint(theme.colors.accentBg)
            .foregroundStyle(theme.colors.fgDefault)
            .preferredColorScheme(theme.colorScheme)
        }
    }
}
