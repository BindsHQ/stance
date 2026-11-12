import Foundation
import SwiftUI

/// Localisation for the strings StanceUI ships with, such as "Dismiss", "Loading" and "Send".
///
/// The string tables live in the package bundle (`Bundle.module`): English is the base, with
/// Arabic and Spanish translations. Components resolve their built in strings for the locale in
/// the SwiftUI environment, so `.environment(\.locale, Locale(identifier: "ar"))` works in
/// previews and tests. Every built in string can also be replaced through the component's own
/// parameters.
public enum StanceLocalization {
    /// The bundle that holds the StanceUI string tables.
    public static var bundle: Bundle { .module }

    /// The language codes StanceUI has translations for, in alphabetical order.
    public static var languages: [String] {
        Bundle.module.localizations.filter { $0 != "Base" }.sorted()
    }

    /// Resolves a built in string for a locale.
    ///
    /// The lookup uses `String(localized:bundle:locale:)` on the package bundle. A locale with no
    /// translation falls back to English.
    public static func string(_ key: String.LocalizationValue, locale: Locale = .current) -> String {
        String(localized: key, bundle: bundle(for: locale), locale: locale)
    }

    /// The localisation StanceUI uses for a locale: the best match among `languages`, or English.
    public static func language(for locale: Locale) -> String {
        let available = languages
        let preferred = Bundle.preferredLocalizations(from: available, forPreferences: [locale.identifier(.bcp47)]).first
        guard let preferred, let code = locale.language.languageCode?.identifier,
              Locale(identifier: preferred).language.languageCode?.identifier == code
        else { return "en" }
        return preferred
    }

    /// The part of the package bundle that holds one language, cached per locale identifier.
    static func bundle(for locale: Locale) -> Bundle {
        cache.bundle(for: locale.identifier) {
            let language = language(for: locale)
            guard let path = Bundle.module.path(forResource: language, ofType: "lproj"), let bundle = Bundle(path: path) else {
                return .module
            }
            return bundle
        }
    }

    private static let cache = BundleCache()

    private final class BundleCache: @unchecked Sendable {
        private let lock = NSLock()
        private var bundles: [String: Bundle] = [:]

        func bundle(for identifier: String, make: () -> Bundle) -> Bundle {
            lock.lock()
            defer { lock.unlock() }
            if let bundle = bundles[identifier] { return bundle }
            let bundle = make()
            bundles[identifier] = bundle
            return bundle
        }
    }
}

/// Shorthand used by components for a built in string in the environment locale.
func stanceString(_ key: String.LocalizationValue, _ locale: Locale) -> String {
    StanceLocalization.string(key, locale: locale)
}

extension Locale {
    /// Whether the locale's language is written right to left.
    var stanceIsRightToLeft: Bool {
        language.characterDirection == .rightToLeft
    }
}
