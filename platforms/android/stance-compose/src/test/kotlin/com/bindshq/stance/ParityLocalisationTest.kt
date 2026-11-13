package com.bindshq.stance

import android.content.Context
import android.content.res.Configuration
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import com.bindshq.stance.components.actions.StanceThemeSwitcher
import com.bindshq.stance.components.data.StanceAccordion
import com.bindshq.stance.components.data.StanceAccordionItem
import com.bindshq.stance.components.data.StanceChart
import com.bindshq.stance.components.data.StanceChartSeries
import com.bindshq.stance.components.data.StanceTreeNode
import com.bindshq.stance.components.data.StanceTreeView
import com.bindshq.stance.components.forms.StancePinField
import com.bindshq.stance.components.navigation.StancePagination
import com.bindshq.stance.theme.StanceAppearance
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

/** The native parity components in Arabic: translated strings, plurals and right to left layout. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "ar-ldrtl-w600dp-h1400dp")
class ParityLocalisationTest {
    @get:Rule
    val rule = createComposeRule()

    private val context: Context get() = ApplicationProvider.getApplicationContext()

    /** Robolectric does not mirror layouts from the locale, so the direction is set here. */
    private fun setRtlContent(content: @Composable () -> Unit) {
        rule.setStanceContent { CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl, content = content) }
    }

    private fun localised(language: String): Context {
        val configuration = Configuration(context.resources.configuration).apply { setLocale(Locale.forLanguageTag(language)) }
        return context.createConfigurationContext(configuration)
    }

    @Test
    fun everyNewStringIsTranslatedIntoArabicAndSpanish() {
        val english = localised("en").resources
        val names = R.string::class.java.fields.map { it.name }.filter { it in PARITY_STRINGS }
        assertEquals(PARITY_STRINGS.size, names.size, "a string was renamed or removed")
        for (language in listOf("ar", "es")) {
            val translated = localised(language).resources
            for (name in names) {
                if (language == "es" && name in SAME_IN_SPANISH) continue
                val id = R.string::class.java.getField(name).getInt(null)
                assertNotEquals(english.getString(id), translated.getString(id), "$name is not translated into $language")
            }
        }
    }

    @Test
    fun selectedCountUsesArabicPluralForms() {
        val arabic = localised("ar").resources
        val forms = listOf(0, 1, 2, 3, 11, 100).map { arabic.getQuantityString(R.plurals.stance_selected_count, it, it) }
        assertEquals("عنصران محددان", forms[2])
        assertEquals(6, forms.toSet().size, "each Arabic quantity reads differently: $forms")
        assertEquals("1 seleccionado", localised("es").resources.getQuantityString(R.plurals.stance_selected_count, 1, 1))
    }

    @Test
    fun paginationIsArabicAndMirrored() {
        setRtlContent { StancePagination(page = 2, pageCount = 5, onPageChange = {}) }
        rule.onNodeWithText("الصفحة ٢ من ٥").assertIsDisplayed()
        val previous = rule.onNodeWithContentDescription("الصفحة السابقة").getBoundsInRoot()
        val next = rule.onNodeWithContentDescription("الصفحة التالية").getBoundsInRoot()
        assertTrue(previous.left >= next.right, "previous sits on the right in a right to left layout")
    }

    @Test
    fun themeSwitcherIsArabic() {
        setRtlContent { StanceThemeSwitcher(StanceAppearance.Dark, {}) }
        rule.onNodeWithText("داكن").assertIsSelected()
        rule.onNodeWithContentDescription("المظهر").assertExists()
        val system = rule.onNodeWithText("النظام").getBoundsInRoot()
        val contrast = rule.onNodeWithText("تباين عالٍ").getBoundsInRoot()
        assertTrue(system.left >= contrast.right, "the first option sits on the right")
    }

    @Test
    fun pinFieldStaysLeftToRight() {
        setRtlContent { StancePinField("12", {}) }
        rule.onNodeWithContentDescription("رمز التحقق").assertExists()
        val first = rule.onNodeWithText("1", useUnmergedTree = true).getBoundsInRoot()
        val second = rule.onNodeWithText("2", useUnmergedTree = true).getBoundsInRoot()
        assertTrue(first.right <= second.left, "codes read left to right in every language")
    }

    @Test
    fun accordionStateIsArabic() {
        setRtlContent { StanceAccordion(listOf(StanceAccordionItem("a", "الشروط") { Text("نص") })) }
        rule.onNodeWithText("الشروط").assertExists()
        rule.onNode(androidx.compose.ui.test.SemanticsMatcher.expectValue(androidx.compose.ui.semantics.SemanticsProperties.StateDescription, "مطوي")).assertExists()
    }

    @Test
    fun treeExpandActionIsArabic() {
        setRtlContent {
            Box(Modifier.height(300.dp)) {
                StanceTreeView(listOf(StanceTreeNode("docs", "المستندات", listOf(StanceTreeNode("a", "أ")))), label = "الملفات")
            }
        }
        val node = rule.onNodeWithText("المستندات").fetchSemanticsNode()
        assertEquals("توسيع", node.config[androidx.compose.ui.semantics.SemanticsActions.Expand].label)
    }

    @Test
    fun chartSummaryIsArabicAndPointsMirror() {
        setRtlContent {
            StanceChart(
                title = "التوقيعات",
                categories = listOf("يناير", "فبراير"),
                series = listOf(StanceChartSeries("مرسلة", listOf(10f, 20f))),
                type = com.bindshq.stance.components.data.StanceChartType.Bar,
                valueText = { it.toInt().toString() },
            )
        }
        rule.onNodeWithContentDescription("مخطط شريطي: التوقيعات. الأدنى 10، الأعلى 20.").assertExists()
        val january = rule.onNodeWithContentDescription("يناير، مرسلة: 10").getBoundsInRoot()
        val february = rule.onNodeWithContentDescription("فبراير، مرسلة: 20").getBoundsInRoot()
        assertTrue(january.left >= february.right, "the first category is on the right")
    }

    private companion object {
        val PARITY_STRINGS = setOf(
            "stance_expanded", "stance_collapsed", "stance_expand", "stance_collapse", "stance_select_all",
            "stance_code_sample", "stance_copy", "stance_copied", "stance_remove_item",
            "stance_edit_named", "stance_save", "stance_unread", "stance_mark_as_read", "stance_increase",
            "stance_decrease", "stance_previous_page", "stance_next_page", "stance_page_number",
            "stance_verification_code", "stance_move_up", "stance_move_down",
            "stance_reorder", "stance_moved", "stance_theme", "stance_theme_system", "stance_theme_light",
            "stance_theme_dark", "stance_theme_high_contrast", "stance_chart_line", "stance_chart_bar",
            "stance_chart_area", "stance_chart_summary", "stance_chart_point",
        )

        /** A pattern of placeholders and punctuation that Spanish writes the same way. */
        val SAME_IN_SPANISH = setOf("stance_chart_point")
    }
}
