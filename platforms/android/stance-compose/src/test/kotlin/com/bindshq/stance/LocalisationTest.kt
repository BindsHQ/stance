package com.bindshq.stance

import android.content.Context
import android.content.res.Configuration
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ApplicationProvider
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.advanced.StanceFilter
import com.bindshq.stance.components.advanced.StanceFilterBar
import com.bindshq.stance.components.advanced.StanceSearchableList
import com.bindshq.stance.components.data.StanceAvatarGroup
import com.bindshq.stance.components.feedback.StanceBanner
import com.bindshq.stance.components.feedback.StanceErrorState
import com.bindshq.stance.components.forms.StanceSearchBar
import com.bindshq.stance.components.navigation.StancePagerIndicator
import com.bindshq.stance.components.navigation.StanceStepper
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.util.Locale
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

/** Built-in strings come from resources, follow the device language and can be overridden. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "ar-ldrtl-w600dp-h1400dp")
class LocalisationTest {
    @get:Rule
    val rule = createComposeRule()

    private val context: Context get() = ApplicationProvider.getApplicationContext()

    private fun localised(language: String): Context {
        val configuration = Configuration(context.resources.configuration).apply { setLocale(Locale.forLanguageTag(language)) }
        return context.createConfigurationContext(configuration)
    }

    @Test
    fun dismissButtonIsNamedInArabic() {
        var dismissed = false
        rule.setStanceContent { StanceBanner("انتهت صلاحية الخطة", onDismiss = { dismissed = true }) }
        rule.onNodeWithContentDescription("إغلاق").assertHasClickAction().performClick()
        assertTrue(dismissed)
    }

    @Test
    fun aParameterOverridesTheResource() {
        rule.setStanceContent { StanceBanner("رسالة", onDismiss = {}, dismissDescription = "إخفاء الإشعار") }
        rule.onNodeWithContentDescription("إخفاء الإشعار").assertIsDisplayed()
        rule.onNodeWithContentDescription("إغلاق").assertDoesNotExist()
    }

    @Test
    fun searchAndRetryDefaultsAreArabic() {
        rule.setStanceContent {
            androidx.compose.foundation.layout.Column {
                StanceSearchBar(query = "عقد", onQueryChange = {})
                StanceErrorState(title = "تعذر التحميل", onRetry = {})
            }
        }
        rule.onNodeWithContentDescription("بحث").assertIsDisplayed()
        rule.onNodeWithContentDescription("مسح البحث").assertHasClickAction()
        rule.onNodeWithText("إعادة المحاولة").assertHasClickAction()
    }

    @Test
    fun clearAllLabelIsArabic() {
        rule.setStanceContent {
            StanceFilterBar(filters = listOf(StanceFilter("live", "نشط", selected = true)), onToggle = {}, onClearAll = {})
        }
        rule.onNodeWithText("مسح الكل").assertHasClickAction()
    }

    @Test
    fun resultCountUsesArabicPluralForms() {
        rule.setStanceContent {
            StanceSearchableList(items = listOf("أ", "ب"), matches = { item, query -> item.contains(query) }) {}
        }
        // Two items take the dual form, which has no number in it.
        rule.onNodeWithText("نتيجتان").assertIsDisplayed()
    }

    @Test
    fun arabicPluralsCoverEveryCategory() {
        val resources = localised("ar").resources
        val forms = listOf(0, 1, 2, 3, 11, 100).map { resources.getQuantityString(R.plurals.stance_results, it, it) }
        assertEquals("لا نتائج", forms[0])
        assertEquals("نتيجة واحدة", forms[1])
        assertEquals("نتيجتان", forms[2])
        assertTrue(forms[3].endsWith("نتائج"), forms[3])
        assertTrue(forms[4].endsWith("نتيجة"), forms[4])
        assertTrue(forms[5].endsWith("نتيجة"), forms[5])
        assertEquals(6, forms.toSet().size, "each quantity renders its own text")
    }

    @Test
    fun stepperSpeaksArabicPositionAndState() {
        rule.setStanceContent { StanceStepper(steps = listOf("المستند", "المستلمون", "المراجعة"), currentStep = 1) }
        val current = SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "الحالية")
        val described = SemanticsMatcher("names the step in Arabic") { node ->
            node.config.getOrNull(SemanticsProperties.ContentDescription).orEmpty().any { it.startsWith("الخطوة") && it.endsWith("المستلمون") }
        }
        rule.onNode(current).assert(described)
    }

    @Test
    fun pagerAndAvatarSummariesAreArabic() {
        rule.setStanceContent {
            androidx.compose.foundation.layout.Column {
                StancePagerIndicator(pageCount = 4, currentPage = 1)
                StanceAvatarGroup(names = listOf("أمارا", "لوكاس", "بريا"), max = 2)
            }
        }
        rule.onNode(SemanticsMatcher("page position in Arabic") { node ->
            node.config.getOrNull(SemanticsProperties.ContentDescription).orEmpty().any { it.startsWith("الصفحة") }
        }).assertExists()
        // Two shown, one more: the singular form names the extra person in words.
        rule.onNodeWithContentDescription("أمارا، لوكاس وشخص آخر").assertExists()
    }

    @Test
    @Config(sdk = [35], qualifiers = "es-w600dp-h1400dp")
    fun spanishStringsResolve() {
        rule.setStanceContent { StanceButton("Guardar", onClick = {}, loading = true) }
        rule.onNodeWithText("Guardar").assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Cargando"))
        assertEquals("1 resultado", context.resources.getQuantityString(R.plurals.stance_results, 1, 1))
        assertEquals("5 resultados", context.resources.getQuantityString(R.plurals.stance_results, 5, 5))
    }

    @Test
    fun everyStringIsTranslated() {
        val english = localised("en").resources
        val names = R.string::class.java.fields.map { it.name }.filter { it in PHASE_ONE_STRINGS }
        assertEquals(PHASE_ONE_STRINGS.size, names.size, "a string was renamed or removed")
        for (language in listOf("ar", "es")) {
            val translated = localised(language).resources
            for (name in names) {
                if (name in SAME_IN_EVERY_LANGUAGE) continue
                val id = R.string::class.java.getField(name).getInt(null)
                assertNotEquals(english.getString(id), translated.getString(id), "$name is not translated to $language")
            }
        }
    }

    private companion object {
        val PHASE_ONE_STRINGS = setOf(
            "stance_loading", "stance_cancel", "stance_ok", "stance_dismiss", "stance_try_again", "stance_required",
            "stance_select", "stance_select_date", "stance_select_dates", "stance_select_time", "stance_date_range",
            "stance_range_value", "stance_percent", "stance_show_password", "stance_hide_password", "stance_search",
            "stance_clear_search", "stance_navigate_up", "stance_page_of", "stance_step_of", "stance_step_complete",
            "stance_step_current", "stance_step_upcoming", "stance_step_error", "stance_no_results",
            "stance_nothing_matches", "stance_clear_all", "stance_sign_here", "stance_undo", "stance_clear",
            "stance_signed", "stance_empty", "stance_list_separator", "stance_table_cell",
        )

        /** Punctuation only, or a word spelled the same in one of the languages. */
        val SAME_IN_EVERY_LANGUAGE = setOf("stance_table_cell", "stance_list_separator", "stance_step_error")
    }
}
