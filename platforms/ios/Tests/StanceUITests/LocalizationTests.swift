import Foundation
import SwiftUI
import Testing
@testable import StanceUI

private let english = Locale(identifier: "en")
private let arabic = Locale(identifier: "ar")
private let spanish = Locale(identifier: "es")

@Suite("Localisation")
struct LocalizationTests {
    /// The keys of one language's string table, read from the package bundle.
    private func keys(_ language: String, table: String = "Localizable", type: String = "strings") throws -> Set<String> {
        let path = try #require(StanceLocalization.bundle.path(forResource: table, ofType: type, inDirectory: nil, forLocalization: language))
        let dictionary = try #require(NSDictionary(contentsOfFile: path) as? [String: Any])
        return Set(dictionary.keys)
    }

    @Test("English is the base, with Arabic and Spanish translations")
    func languages() {
        #expect(StanceLocalization.languages == ["ar", "en", "es"])
    }

    @Test("Every language has the same keys", arguments: ["ar", "es"])
    func parity(language: String) throws {
        #expect(try keys(language) == keys("en"))
        #expect(try keys(language, type: "stringsdict") == keys("en", type: "stringsdict"))
        #expect(try keys("en").count > 140)
    }

    @Test("No translation is left empty or equal to its key", arguments: ["en", "ar", "es"])
    func complete(language: String) throws {
        let path = try #require(StanceLocalization.bundle.path(forResource: "Localizable", ofType: "strings", inDirectory: nil, forLocalization: language))
        let table = try #require(NSDictionary(contentsOfFile: path) as? [String: String])
        for (key, value) in table {
            #expect(!value.isEmpty && value != key, "\(language): \(key)")
        }
    }

    @Test("Built in strings resolve in English")
    func englishLookups() {
        #expect(StanceLocalization.string("stance.dismiss", locale: english) == "Dismiss")
        #expect(StanceLocalization.string("stance.loading", locale: english) == "Loading")
        #expect(StanceLocalization.string("stance.filters.clear", locale: english) == "Clear all")
        #expect(StanceLocalization.string("stance.ai.send", locale: english) == "Send")
        #expect(StanceLocalization.string("stance.remove \("Sales")", locale: english) == "Remove Sales")
        #expect(StanceLocalization.string("stance.page \(2) \(5)", locale: english) == "Page 2 of 5")
    }

    @Test("Built in strings resolve in Arabic")
    func arabicLookups() {
        #expect(StanceLocalization.string("stance.dismiss", locale: arabic) == "تجاهل")
        #expect(StanceLocalization.string("stance.cancel", locale: arabic) == "إلغاء")
        #expect(StanceLocalization.string("stance.search", locale: arabic) == "بحث")
        #expect(StanceLocalization.string("stance.ai.send", locale: arabic) == "إرسال")
        // Foundation isolates the inserted text so mixed direction strings read correctly.
        #expect(StanceLocalization.string("stance.remove \("Sales")", locale: arabic).hasPrefix("إزالة "))
        #expect(StanceLocalization.string("stance.remove \("Sales")", locale: arabic).contains("Sales"))
    }

    @Test("Built in strings resolve in Spanish")
    func spanishLookups() {
        #expect(StanceLocalization.string("stance.close", locale: spanish) == "Cerrar")
        #expect(StanceLocalization.string("stance.retry", locale: spanish) == "Reintentar")
    }

    @Test("Regional locales use their language, and unknown languages fall back to English")
    func fallback() {
        #expect(StanceLocalization.language(for: Locale(identifier: "ar_SA")) == "ar")
        #expect(StanceLocalization.language(for: Locale(identifier: "es_MX")) == "es")
        #expect(StanceLocalization.language(for: Locale(identifier: "en_IN")) == "en")
        #expect(StanceLocalization.language(for: Locale(identifier: "ja_JP")) == "en")
        #expect(StanceLocalization.string("stance.dismiss", locale: Locale(identifier: "ja_JP")) == "Dismiss")
    }

    @Test("Plurals follow each language's rules")
    func plurals() {
        #expect(StanceLocalization.string("stance.results.count \(1)", locale: english) == "1 result")
        #expect(StanceLocalization.string("stance.results.count \(12)", locale: english) == "12 results")
        #expect(StanceLocalization.string("stance.results.count \(1)", locale: spanish) == "1 resultado")
        #expect(StanceLocalization.string("stance.results.count \(4)", locale: spanish) == "4 resultados")
        // Arabic has six plural forms: one, two, few (3 to 10) and many (11 to 99) differ.
        #expect(StanceLocalization.string("stance.results.count \(1)", locale: arabic) == "نتيجة واحدة")
        #expect(StanceLocalization.string("stance.results.count \(2)", locale: arabic) == "نتيجتان")
        #expect(StanceLocalization.string("stance.results.count \(3)", locale: arabic).hasSuffix("نتائج"))
        #expect(StanceLocalization.string("stance.results.count \(11)", locale: arabic).hasSuffix("نتيجة"))
    }

    @Test("Components describe themselves in the requested language")
    func componentLogic() {
        let state = StanceFieldState(error: "Required", isRequired: true)
        #expect(state.accessibilitySuffix(helper: nil, locale: english) == "required, Error: Required")
        #expect(state.accessibilitySuffix(helper: nil, locale: arabic).hasPrefix("مطلوب, خطأ: "))
        #expect(StanceAppearance.highContrast.title(locale: english) == "High contrast")
        #expect(StanceAppearance.dark.title(locale: arabic) == "داكن")
        #expect(StanceAppearance.light.title(locale: spanish) == "Claro")
    }

    @Test("A string literal title is looked up in the app's tables and falls back to itself")
    @MainActor
    func literals() {
        #expect(String(localized: LocalizedStringResource("Deploy signature")) == "Deploy signature")
        #expect(String(localized: LocalizedStringResource("100% done")) == "100% done")
        // Both spellings compile: a literal is a localisation key, a String value is used as is.
        let title = "Deploy"
        _ = StanceButton("Deploy") {}
        _ = StanceButton(title) {}
        _ = StanceButton(LocalizedStringResource("Deploy")) {}
        _ = StanceLoadingState()
        _ = StanceSearchField(text: .constant(""))
        _ = StanceCard { Text(title) }
    }
}

@Suite("Right to left")
struct RightToLeftTests {
    @Test("Arabic is right to left; English and Spanish are not")
    func direction() {
        #expect(arabic.stanceIsRightToLeft)
        #expect(Locale(identifier: "he").stanceIsRightToLeft)
        #expect(!english.stanceIsRightToLeft)
        #expect(!spanish.stanceIsRightToLeft)
    }

    @Test("Only icons that point along the reading direction mirror")
    func mirroring() {
        let directional: Set<StanceIconName> = [.chevronLeft, .chevronRight, .chevronsLeft, .chevronsRight, .arrowLeft, .arrowRight, .panelLeft, .list, .logOut]
        for icon in StanceIconName.allCases {
            #expect(icon.isDirectional == directional.contains(icon), "\(icon.rawValue)")
        }
        // Ticks, vertical arrows, clocks and objects keep their shape.
        #expect(!StanceIconName.check.isDirectional)
        #expect(!StanceIconName.arrowUp.isDirectional)
        #expect(!StanceIconName.clock.isDirectional)
        #expect(!StanceIconName.signature.isDirectional)
    }
}
