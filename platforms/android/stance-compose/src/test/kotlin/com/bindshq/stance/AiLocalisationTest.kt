package com.bindshq.stance

import android.content.Context
import android.content.res.Configuration
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import com.bindshq.stance.components.ai.StanceBranchSwitcher
import com.bindshq.stance.components.ai.StanceMessage
import com.bindshq.stance.components.ai.StanceMessageRole
import com.bindshq.stance.components.ai.StancePromptComposer
import com.bindshq.stance.components.ai.StanceReasoningDisclosure
import com.bindshq.stance.components.ai.StanceReasoningStatus
import com.bindshq.stance.components.ai.StanceThinkingIndicator
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

/** The AI components in Arabic: translated strings, plurals and right to left layout. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "ar-ldrtl-w600dp-h1400dp")
class AiLocalisationTest {
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
    fun everyAiStringIsTranslatedIntoArabicAndSpanish() {
        val english = localised("en").resources
        val names = R.string::class.java.fields.map { it.name }.filter { it.startsWith("stance_ai_") }
        assertTrue(names.size >= 80, "found ${names.size} AI strings")
        // Format patterns are the same in every language by design.
        val shared = setOf("stance_ai_labelled_value")
        for (language in listOf("ar", "es")) {
            val translated = localised(language).resources
            for (name in names - shared) {
                val id = R.string::class.java.getField(name).getInt(null)
                assertNotEquals(english.getString(id), translated.getString(id), "$name is not translated into $language")
            }
        }
    }

    @Test
    fun arabicPluralsUseTheirOwnForms() {
        val arabic = localised("ar").resources
        val forms = listOf(1, 2, 3, 11, 100).map { arabic.getQuantityString(R.plurals.stance_ai_thought_for, it, it) }
        assertEquals(5, forms.toSet().size, "one, two, few, many and other differ: $forms")
        assertEquals("Pensó durante 1 segundo", localised("es").resources.getQuantityString(R.plurals.stance_ai_thought_for, 1, 1))
    }

    @Test
    fun composerAndStatusAreNamedInArabic() {
        rule.setStanceContent {
            androidx.compose.foundation.layout.Column {
                StancePromptComposer("مرحبا", {}, onSubmit = {})
                StanceThinkingIndicator()
                StanceReasoningDisclosure(StanceReasoningStatus.Done, expanded = false, onExpandedChange = {}, durationSeconds = 2) {}
            }
        }
        rule.onNodeWithContentDescription("إرسال").assertIsDisplayed()
        rule.onNodeWithContentDescription("الرسالة").assertIsDisplayed()
        rule.onNodeWithContentDescription("جارٍ التفكير").assertIsDisplayed()
        rule.onNodeWithText("فكّر لثانيتين").assertIsDisplayed()
    }

    @Test
    fun composerSendButtonSitsAtTheLeftInRightToLeft() {
        setRtlContent { StancePromptComposer("مرحبا", {}, onSubmit = {}) }
        val send = rule.onNodeWithContentDescription("إرسال").getBoundsInRoot()
        val field = rule.onNodeWithContentDescription("الرسالة").getBoundsInRoot()
        assertTrue(send.right <= field.left + 1.dp, "send (${send.right}) is left of the field (${field.left})")
    }

    @Test
    fun branchSwitcherMirrorsInRightToLeft() {
        setRtlContent { StanceBranchSwitcher(3, 1, {}) }
        val previous = rule.onNodeWithContentDescription("النسخة السابقة").getBoundsInRoot()
        val next = rule.onNodeWithContentDescription("النسخة التالية").getBoundsInRoot()
        assertTrue(previous.left > next.right - 1.dp, "previous (${previous.left}) is right of next (${next.right})")
        // Digits follow the locale, so only the word is matched.
        rule.onNodeWithText("من", substring = true).assertIsDisplayed()
    }

    @Test
    fun messagesSwapSidesInRightToLeft() {
        setRtlContent {
            androidx.compose.foundation.layout.Column(Modifier.fillMaxWidth()) {
                StanceMessage(StanceMessageRole.User) { Text("سؤال") }
                StanceMessage(StanceMessageRole.Assistant) { Text("جواب") }
            }
        }
        val width = rule.onRoot().getBoundsInRoot().right
        val user = rule.onNodeWithText("سؤال").getBoundsInRoot()
        val assistant = rule.onNodeWithText("المساعد").getBoundsInRoot()
        assertTrue(user.left < 8.dp, "the user bubble starts at the left edge: ${user.left}")
        assertTrue(assistant.right > width - 8.dp, "the assistant header ends at the right edge: ${assistant.right} of $width")
    }
}
