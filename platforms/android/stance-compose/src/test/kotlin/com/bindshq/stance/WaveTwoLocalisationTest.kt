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
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import com.bindshq.stance.components.ai.StanceAgentStatus
import com.bindshq.stance.components.ai.StanceAgentStatusPill
import com.bindshq.stance.components.ai.StanceAgentTask
import com.bindshq.stance.components.ai.StanceApprovalPrompt
import com.bindshq.stance.components.ai.StanceCanvasSplitView
import com.bindshq.stance.components.ai.StanceDiffFile
import com.bindshq.stance.components.ai.StanceDiffHunk
import com.bindshq.stance.components.ai.StanceDiffLine
import com.bindshq.stance.components.ai.StanceDiffLineKind
import com.bindshq.stance.components.ai.StanceDiffReview
import com.bindshq.stance.components.ai.StanceDiffView
import com.bindshq.stance.components.ai.StanceLogEntry
import com.bindshq.stance.components.ai.StanceLogLevel
import com.bindshq.stance.components.ai.StanceRiskLevel
import com.bindshq.stance.components.ai.StanceRunLog
import com.bindshq.stance.components.ai.StanceStepStatus
import com.bindshq.stance.components.ai.StanceStepTimeline
import com.bindshq.stance.components.ai.StanceSuggestion
import com.bindshq.stance.components.ai.StanceSuggestionChips
import com.bindshq.stance.components.ai.StanceTaskQueue
import com.bindshq.stance.components.ai.StanceTimelineStep
import com.bindshq.stance.components.ai.StanceToolCallCard
import com.bindshq.stance.components.forms.StanceCombobox
import com.bindshq.stance.components.forms.StanceSelectOption
import com.bindshq.stance.foundation.StanceWindowWidth
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.util.Locale
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/** The closed gaps and the wave two AI components in Arabic: translated strings, plurals and right to left layout. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "ar-ldrtl-w600dp-h1400dp")
class WaveTwoLocalisationTest {
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

    private val width get() = rule.onRoot().getBoundsInRoot().right

    @Test
    fun countdownAndPinProgressUseEveryArabicPluralForm() {
        val arabic = localised("ar").resources
        val countdown = listOf(0, 1, 2, 3, 11, 100).map { arabic.getQuantityString(R.plurals.stance_ai_approval_countdown, it, it) }
        assertEquals(6, countdown.toSet().size, "zero, one, two, few, many and other differ: $countdown")
        val progress = listOf(0, 1, 2, 3, 11, 100).map { arabic.getQuantityString(R.plurals.stance_pin_progress, it, it, 6) }
        assertEquals(6, progress.toSet().size, "zero, one, two, few, many and other differ: $progress")
        val spanish = localised("es").resources
        assertEquals("1 de 6 introducido", spanish.getQuantityString(R.plurals.stance_pin_progress, 1, 1, 6))
        assertEquals("2 de 6 introducidos", spanish.getQuantityString(R.plurals.stance_pin_progress, 2, 2, 6))
        assertEquals("Se deniega solo en 1 segundo", spanish.getQuantityString(R.plurals.stance_ai_approval_countdown, 1, 1))
        assertEquals("2 of 6 entered", localised("en").resources.getQuantityString(R.plurals.stance_pin_progress, 2, 2, 6))
    }

    @Test
    fun newSharedStringsAreTranslated() {
        val english = localised("en").resources
        for (language in listOf("ar", "es")) {
            val translated = localised(language).resources
            for (id in listOf(R.string.stance_use_value, R.string.stance_sorted_ascending, R.string.stance_sorted_descending, R.string.stance_checked, R.string.stance_not_checked)) {
                assertTrue(english.getString(id, "x") != translated.getString(id, "x"), "${english.getResourceEntryName(id)} is not translated into $language")
            }
        }
    }

    @Test
    fun approvalPromptIsArabicAndKeepsDenyFirst() {
        setRtlContent { StanceApprovalPrompt("إرسال 48 رسالة", onAllow = {}, onDeny = {}, onAllowAlways = {}, risk = StanceRiskLevel.High) }
        rule.onNodeWithText("خطر مرتفع", useUnmergedTree = true).assertExists()
        val deny = rule.onNodeWithText("رفض").assertMinimumTouchTarget(rule).getBoundsInRoot()
        val allow = rule.onNodeWithText("سماح").getBoundsInRoot()
        rule.onNodeWithText("السماح دائمًا").assertIsDisplayed()
        assertTrue(deny.left > allow.right - 1.dp, "deny comes first, at the right, in right to left: ${deny.left} and ${allow.right}")
    }

    @Test
    fun agentStatusAndToolCallAreNamedInArabic() {
        setRtlContent {
            androidx.compose.foundation.layout.Column {
                StanceAgentStatusPill(StanceAgentStatus.Waiting)
                StanceToolCallCard("البحث في الويب", StanceStepStatus.Complete, input = "{}")
                StanceSuggestionChips(listOf(StanceSuggestion("a", "جدولة التغيير")), {})
            }
        }
        rule.onNodeWithContentDescription("بانتظارك").assertExists()
        rule.onNodeWithContentDescription("البحث في الويب، مكتمل").assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "مطوي"))
        rule.onNodeWithContentDescription("اقتراحات").assertExists()
    }

    @Test
    fun taskActionsNameTheirTaskInArabic() {
        setRtlContent { StanceTaskQueue(listOf(StanceAgentTask("1", "تصدير التقرير", StanceStepStatus.Running)), onCancel = {}, onPause = {}) }
        val cancel = rule.onNodeWithContentDescription("إلغاء تصدير التقرير").assertMinimumTouchTarget(rule).getBoundsInRoot()
        rule.onNodeWithContentDescription("إيقاف تصدير التقرير مؤقتًا").assertExists()
        val title = rule.onNodeWithText("تصدير التقرير").getBoundsInRoot()
        assertTrue(cancel.right < title.left + 1.dp, "actions sit at the left in right to left")
    }

    @Test
    fun stepTimelineMirrorsItsRail() {
        setRtlContent {
            StanceStepTimeline(listOf(StanceTimelineStep("a", "قراءة الملخص", StanceStepStatus.Complete), StanceTimelineStep("b", "كتابة المسودة", StanceStepStatus.Running)))
        }
        rule.onNodeWithContentDescription("الخطوات").assertExists()
        // The spoken position uses the stepper wording, in Arabic.
        val step = rule.onNode(SemanticsMatcher("names the running step") { node ->
            node.config.getOrNull(SemanticsProperties.ContentDescription)?.any { "كتابة المسودة" in it && "قيد التنفيذ" in it } == true
        }).assertExists().getBoundsInRoot()
        assertTrue(step.right < width - 16.dp, "the rail is at the right edge, so the step starts left of it: ${step.right} of $width")
        assertTrue(step.left < 1.dp)
    }

    @Test
    fun diffStaysLeftToRightInRightToLeft() {
        val files = listOf(
            StanceDiffFile(
                "f", "src/Greeting.kt",
                listOf(StanceDiffHunk("h", listOf(StanceDiffLine(StanceDiffLineKind.Add, "println(\"hello\")", null, 2)), header = "@@ 1,3 @@")),
            ),
        )
        setRtlContent { StanceDiffReview(files, emptyMap(), {}, view = StanceDiffView.Unified) }
        val header = rule.onNodeWithText("@@ 1,3 @@", useUnmergedTree = true).getBoundsInRoot()
        assertTrue(header.left < 40.dp, "code reads left to right in every language: ${header.left}")
        // The words around the code are Arabic, and the spoken prefix is too.
        rule.onNodeWithContentDescription("مضاف: println(\"hello\")").assertExists()
        val accept = rule.onNodeWithText("قبول").getBoundsInRoot()
        val reject = rule.onNodeWithText("رفض").getBoundsInRoot()
        assertTrue(accept.left > reject.right - 1.dp, "the buttons follow the reading direction")
        rule.onNodeWithText("قبول الكل").assertIsDisplayed()
    }

    @Test
    fun runLogStaysLeftToRightInRightToLeft() {
        val entries = listOf(StanceLogEntry("1", StanceLogLevel.Error, "Timed out", "10:41:09"))
        setRtlContent { StanceRunLog(entries, onLevelsChange = {}) }
        val line = rule.onNodeWithText("Timed out", substring = true).getBoundsInRoot()
        assertTrue(line.left < 40.dp, "log lines read left to right: ${line.left}")
        val title = rule.onNodeWithText("سجل التشغيل").getBoundsInRoot()
        assertTrue(title.right > width - 40.dp, "the header follows the reading direction: ${title.right} of $width")
        // The level is a word, in Arabic.
        rule.onNodeWithText("10:41:09 خطأ Timed out").assertExists()
        rule.onNodeWithText("تحذير").assertIsDisplayed()
    }

    @Test
    @Config(sdk = [35], qualifiers = "ar-ldrtl-w1200dp-h800dp")
    fun canvasPanesSwapSidesInRightToLeft() {
        setRtlContent {
            Box(Modifier.height(400.dp)) {
                StanceCanvasSplitView({ Text("المحادثة هنا") }, { Text("المستند هنا") }, windowWidth = StanceWindowWidth.Expanded)
            }
        }
        val conversation = rule.onNodeWithText("المحادثة هنا").getBoundsInRoot()
        val canvas = rule.onNodeWithText("المستند هنا").getBoundsInRoot()
        assertTrue(conversation.left > canvas.right, "the conversation is at the right")
        rule.onNodeWithContentDescription("تغيير حجم اللوحتين").assertMinimumTouchTarget(rule)
        rule.onNode(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "مساحة العمل")).assertExists()
    }

    @Test
    fun comboboxOffersTheTypedTextInArabic() {
        var custom: String? = null
        rule.setStanceContent {
            StanceCombobox("الفريق", listOf(StanceSelectOption("sales", "المبيعات")), null, {}, allowCustomValue = true, onCustomValue = { custom = it })
        }
        rule.onNode(hasSetTextAction()).performTextInput("الشركاء")
        rule.onNodeWithText("استخدام «الشركاء»").assertIsDisplayed()
        assertEquals(null, custom)
    }
}

