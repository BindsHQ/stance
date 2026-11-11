import StanceUI
import SwiftUI

/// Demonstrates StanceUI. It contains no business logic and makes no network requests.
@main
struct StanceShowcaseApp: App {
    var body: some Scene {
        WindowGroup {
            StanceThemeProvider {
                switch LaunchMode.current {
                case .app: RootView().stanceToastHost()
                case .previewGallery: PreviewGalleryView()
                case let .previewScreen(slug): (PreviewCatalog.screen(slug)?.view ?? AnyView(Text("Unknown preview"))).stanceToastHost()
                }
            }
        }
    }
}

/// How the app starts. Preview modes exist only to render documentation images.
enum LaunchMode {
    case app
    /// `-preview-gallery`: one inline component preview at a time.
    case previewGallery
    /// `-preview <slug>`: one full-screen preview, such as a sheet or alert in context.
    case previewScreen(String)

    static var current: LaunchMode {
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-preview-gallery") { return .previewGallery }
        if let i = args.firstIndex(of: "-preview"), i + 1 < args.count { return .previewScreen(args[i + 1]) }
        return .app
    }
}

enum Screen: String, CaseIterable, Hashable {
    case foundations, components, sample, settings

    /// `-screen <name>` selects the first screen (used for screenshots and UI tests).
    static var initial: Screen {
        let args = ProcessInfo.processInfo.arguments
        if let i = args.firstIndex(of: "-screen"), i + 1 < args.count, let s = Screen(rawValue: args[i + 1]) { return s }
        return .components
    }
}

struct RootView: View {
    @State private var screen = Screen.initial

    var body: some View {
        StanceAdaptiveNavigation("Stance", selection: $screen, destinations: [
            .init(id: Screen.components, title: "Components", systemImage: "square.grid.2x2"),
            .init(id: Screen.foundations, title: "Foundations", systemImage: "paintpalette"),
            .init(id: Screen.sample, title: "Sample", systemImage: "signature"),
            .init(id: Screen.settings, title: "Settings", systemImage: "gearshape"),
        ]) { screen in
            switch screen {
            case .foundations: FoundationsView()
            case .components: ComponentsView()
            case .sample: SampleView()
            case .settings: SettingsView()
            }
        }
    }
}

/// A scrolling page on the Stance canvas.
struct Page<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content
    @Environment(\.stanceTheme) private var theme

    var body: some View {
        ScrollView {
            StanceContainer {
                VStack(alignment: .leading, spacing: StanceSpacing.xxl) { content }
                    .padding(.vertical, StanceSpacing.lg)
            }
        }
        .background(theme.colors.bgCanvas.ignoresSafeArea())
        .navigationTitle(title)
    }
}
