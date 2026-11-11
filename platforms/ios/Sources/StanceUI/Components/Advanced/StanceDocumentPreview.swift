#if canImport(UIKit) && canImport(QuickLook)
import QuickLook
import SwiftUI
import UIKit

/// Previews a local document (PDF, image, office file) with the system Quick Look viewer.
public struct StanceDocumentPreview: UIViewControllerRepresentable {
    private let url: URL

    public init(url: URL) { self.url = url }

    public func makeCoordinator() -> Coordinator { Coordinator(url: url) }

    public func makeUIViewController(context: Context) -> UINavigationController {
        let controller = QLPreviewController()
        controller.dataSource = context.coordinator
        return UINavigationController(rootViewController: controller)
    }

    public func updateUIViewController(_ controller: UINavigationController, context: Context) {
        context.coordinator.url = url
        (controller.viewControllers.first as? QLPreviewController)?.reloadData()
    }

    public final class Coordinator: NSObject, QLPreviewControllerDataSource {
        var url: URL

        init(url: URL) { self.url = url }

        public func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }

        public func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
            url as NSURL
        }
    }
}
#endif
