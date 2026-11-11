package com.bindshq.stance

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.bindshq.stance.components.forms.StanceCheckbox
import com.bindshq.stance.components.forms.StanceDatePicker
import com.bindshq.stance.components.forms.StanceFilterChip
import com.bindshq.stance.components.forms.StanceFormField
import com.bindshq.stance.components.forms.StanceInputChip
import com.bindshq.stance.components.forms.StancePasswordField
import com.bindshq.stance.components.forms.StanceRadioGroup
import com.bindshq.stance.components.forms.StanceRadioOption
import com.bindshq.stance.components.forms.StanceSearchBar
import com.bindshq.stance.components.forms.StanceSelect
import com.bindshq.stance.components.forms.StanceSelectOption
import com.bindshq.stance.components.forms.StanceSlider
import com.bindshq.stance.components.forms.StanceSwitch
import com.bindshq.stance.components.forms.StanceTextField
import com.bindshq.stance.components.forms.StanceTimePicker
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "w600dp-h1400dp")
class FormsTest {
    @get:Rule
    val rule = createComposeRule()

    private fun role(role: Role) = SemanticsMatcher.expectValue(SemanticsProperties.Role, role)

    @Test
    fun textFieldIsNamedByItsLabelAndAcceptsInput() {
        rule.setStanceContent {
            var value by remember { mutableStateOf("") }
            StanceTextField(value, { value = it }, label = "Template name", helper = "Visible to your organisation.")
        }
        rule.onNodeWithText("Visible to your organisation.").assertIsDisplayed()
        rule.onNode(hasSetTextAction()).assert(SemanticsMatcher.expectValue(SemanticsProperties.ContentDescription, listOf("Template name")))
        rule.onNode(hasSetTextAction()).performTextInput("Sales team")
        rule.onNode(hasSetTextAction()).assertTextContains("Sales team")
    }

    @Test
    fun textFieldErrorIsExposedAndReplacesHelper() {
        rule.setStanceContent {
            StanceTextField("", {}, label = "Work email", helper = "We never share it.", error = "Enter a valid email", required = true)
        }
        rule.onNodeWithText("Enter a valid email").assertIsDisplayed()
        rule.onNodeWithText("We never share it.").assertDoesNotExist()
        rule.onNode(hasSetTextAction()).assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Error))
        rule.onNodeWithContentDescription("required").assertExists()
    }

    @Test
    fun disabledTextFieldIsNotEditable() {
        rule.setStanceContent { StanceTextField("Locked", {}, label = "Organisation", enabled = false) }
        rule.onNodeWithContentDescription("Organisation").assertIsNotEnabled()
    }

    @Test
    fun passwordFieldTogglesVisibility() {
        rule.setStanceContent {
            var value by remember { mutableStateOf("hunter2") }
            StancePasswordField(value, { value = it }, label = "Password")
        }
        rule.onNode(hasSetTextAction()).assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Password))
        rule.onNodeWithContentDescription("Show password").performClick()
        rule.onNodeWithContentDescription("Hide password").assertIsDisplayed().performClick()
        rule.onNodeWithContentDescription("Show password").assertIsDisplayed()
    }

    @Test
    fun searchBarClearsItsQuery() {
        var query = "contract"
        rule.setStanceContent {
            var value by remember { mutableStateOf(query) }
            StanceSearchBar(value, { value = it; query = it }, placeholder = "Search templates")
        }
        rule.onNodeWithContentDescription("Clear search").performClick()
        assertEquals("", query)
        rule.onNodeWithContentDescription("Clear search").assertDoesNotExist()
    }

    @Test
    fun checkboxRowTogglesAsOneTarget() {
        rule.setStanceContent {
            var checked by remember { mutableStateOf(false) }
            StanceCheckbox("Send me a copy", checked, { checked = it }, description = "A PDF is emailed after signing.")
        }
        rule.onNodeWithText("Send me a copy").assert(role(Role.Checkbox)).assertIsOff().assertMinimumTouchTarget(rule).performClick()
        rule.onNodeWithText("Send me a copy").assertIsOn()
    }

    @Test
    fun checkboxSupportsIndeterminate() {
        rule.setStanceContent { StanceCheckbox("All recipients", ToggleableState.Indeterminate, onClick = {}) }
        rule.onNodeWithText("All recipients")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.Indeterminate))
    }

    @Test
    fun radioGroupSelectsOneOption() {
        var selected = "viewer"
        rule.setStanceContent {
            var value by remember { mutableStateOf(selected) }
            StanceRadioGroup(
                label = "Role",
                options = listOf(
                    StanceRadioOption("viewer", "Viewer"),
                    StanceRadioOption("editor", "Editor", description = "Can change templates"),
                    StanceRadioOption("owner", "Owner", enabled = false),
                ),
                selected = value,
                onSelect = { value = it; selected = it },
            )
        }
        rule.onNodeWithText("Viewer").assert(role(Role.RadioButton)).assertIsSelected()
        rule.onNodeWithText("Editor").assertMinimumTouchTarget(rule).performClick()
        assertEquals("editor", selected)
        rule.onNodeWithText("Owner").assertIsNotEnabled()
    }

    @Test
    fun switchRowIsASwitchAndToggles() {
        var checked = false
        rule.setStanceContent {
            var value by remember { mutableStateOf(checked) }
            StanceSwitch("Apply to new members", value, { value = it; checked = it })
        }
        rule.onNodeWithText("Apply to new members").assert(role(Role.Switch)).assertIsOff().assertMinimumTouchTarget(rule).performClick()
        assertTrue(checked)
        rule.onNodeWithText("Apply to new members").assertIsOn()
    }

    @Test
    fun sliderAnnouncesItsLabelAndValue() {
        rule.setStanceContent { StanceSlider("Rollout", 40f, {}, valueRange = 0f..100f, valueText = "40%") }
        rule.onNodeWithContentDescription("Rollout")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "40%"))
            .assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.ProgressBarRangeInfo))
    }

    @Test
    fun filterChipReportsSelection() {
        var selected = false
        rule.setStanceContent {
            var value by remember { mutableStateOf(selected) }
            StanceFilterChip("Signed", value, onClick = { value = !value; selected = value })
        }
        rule.onNodeWithText("Signed").performClick()
        assertTrue(selected)
        rule.onNodeWithText("Signed").assertIsSelected()
    }

    @Test
    fun inputChipRemoves() {
        var removed = 0
        rule.setStanceContent { StanceInputChip("Priya Nair", onRemove = { removed++ }, removeDescription = "Remove Priya Nair") }
        rule.onNodeWithText("Priya Nair").performClick()
        assertEquals(1, removed)
    }

    @Test
    fun selectShowsTheSelectedLabelAndOpensOptions() {
        var selected: String? = "admin"
        rule.setStanceContent {
            var value by remember { mutableStateOf(selected) }
            StanceSelect(
                label = "Role",
                options = listOf(StanceSelectOption("admin", "Administrator"), StanceSelectOption("member", "Member")),
                selected = value,
                onSelect = { value = it; selected = it },
            )
        }
        rule.onNodeWithText("Administrator").assertIsDisplayed().performClick()
        rule.onNodeWithText("Member").performClick()
        assertEquals("member", selected)
    }

    @Test
    fun datePickerFieldShowsTheFormattedDateAndOpensTheDialog() {
        rule.setStanceContent {
            Column {
                StanceDatePicker("Signing deadline", selectedDateMillis = 1_795_219_200_000, onDateSelected = {}, locale = java.util.Locale.UK)
            }
        }
        val field = rule.onNodeWithContentDescription("Signing deadline")
        val text = field.fetchSemanticsNode().config.getOrNull(SemanticsProperties.EditableText)?.text
        assertTrue(text != null && text.contains("2026"), "formatted date was $text")
        field.performClick()
        rule.onNodeWithText("OK").assertIsDisplayed()
    }

    @Test
    fun timePickerFieldFormatsTwentyFourHourTime() {
        rule.setStanceContent { StanceTimePicker("Reminder", hour = 9, minute = 5, onTimeSelected = { _, _ -> }) }
        rule.onNodeWithContentDescription("Reminder").assertTextContains("09:05")
    }

    @Test
    fun formFieldAnnouncesErrorsAsALiveRegion() {
        rule.setStanceContent { StanceFormField(label = "Signature", error = "Draw or type your signature") {} }
        rule.onNodeWithText("Draw or type your signature").assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion))
    }
}
