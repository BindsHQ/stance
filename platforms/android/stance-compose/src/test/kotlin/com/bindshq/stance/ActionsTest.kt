package com.bindshq.stance

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonGroup
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceDropdownMenu
import com.bindshq.stance.components.actions.StanceFloatingActionButton
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.actions.StanceMenuItem
import com.bindshq.stance.components.actions.StanceSplitButton
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.tokens.StanceThemeTokens
import com.bindshq.stance.tokens.StanceTokens
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.test.Test
import kotlin.test.assertEquals

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "w600dp-h1400dp")
class ActionsTest {
    @get:Rule
    val rule = createComposeRule()

    private val isButton = SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button)

    @Test
    fun buttonHasButtonRoleAndFiresOnClick() {
        var clicks = 0
        rule.setStanceContent { StanceButton("Save template", onClick = { clicks++ }) }
        rule.onNodeWithText("Save template").assertIsDisplayed().assert(isButton).assertHasClickAction().performClick()
        assertEquals(1, clicks)
    }

    @Test
    fun disabledButtonIsAnnouncedDisabledAndDoesNotFire() {
        var clicks = 0
        rule.setStanceContent { StanceButton("Save", onClick = { clicks++ }, enabled = false) }
        rule.onNodeWithText("Save").assertIsNotEnabled().performClick()
        assertEquals(0, clicks)
    }

    @Test
    fun loadingButtonIgnoresTapsAndAnnouncesLoading() {
        var clicks = 0
        rule.setStanceContent { StanceButton("Deploy", onClick = { clicks++ }, loading = true) }
        rule.onNodeWithText("Deploy")
            .assertIsEnabled()
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Loading"))
            .performClick()
        assertEquals(0, clicks)
    }

    private fun assertAllVariantsHaveTouchTargets(theme: StanceThemeTokens) {
        rule.setStanceContent(theme) {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                for (variant in StanceButtonVariant.entries) {
                    for (size in StanceButtonSize.entries) {
                        StanceButton("${variant.name} ${size.name}", onClick = {}, variant = variant, size = size)
                    }
                }
            }
        }
        for (variant in StanceButtonVariant.entries) {
            for (size in StanceButtonSize.entries) {
                rule.onNodeWithText("${variant.name} ${size.name}").assert(isButton).assertMinimumTouchTarget(rule)
            }
        }
    }

    @Test fun everyVariantAndSizeKeepsA48dpTouchTargetInLight() = assertAllVariantsHaveTouchTargets(StanceTokens.light)

    @Test fun everyVariantAndSizeKeepsA48dpTouchTargetInDark() = assertAllVariantsHaveTouchTargets(StanceTokens.dark)

    @Test fun everyVariantAndSizeKeepsA48dpTouchTargetInHighContrast() = assertAllVariantsHaveTouchTargets(StanceTokens.highContrast)

    @Test
    fun iconButtonIsNamedByItsContentDescription() {
        var clicks = 0
        rule.setStanceContent { StanceIconButton(StanceIcons.Trash, "Delete template", onClick = { clicks++ }) }
        rule.onNodeWithContentDescription("Delete template").assert(isButton).assertMinimumTouchTarget(rule).performClick()
        assertEquals(1, clicks)
    }

    @Test
    fun floatingActionButtonIsNamedWhenIconOnly() {
        rule.setStanceContent { StanceFloatingActionButton(StanceIcons.Plus, "New template", onClick = {}) }
        rule.onNodeWithContentDescription("New template").assertHasClickAction()
    }

    @Test
    fun extendedFloatingActionButtonShowsItsLabel() {
        var clicks = 0
        rule.setStanceContent { StanceFloatingActionButton(StanceIcons.Plus, "New template", onClick = { clicks++ }, text = "New template") }
        rule.onNodeWithText("New template").assertIsDisplayed().performClick()
        assertEquals(1, clicks)
    }

    @Test
    fun buttonGroupMarksTheSelectedSegment() {
        var selected = 0
        rule.setStanceContent { StanceButtonGroup(listOf("Day", "Week", "Month"), selected, onSelect = { selected = it }) }
        rule.onNodeWithText("Day").assertIsSelected()
        rule.onNodeWithText("Month").performClick()
        assertEquals(2, selected)
    }

    @Test
    fun dropdownMenuRunsTheItemAndDismisses() {
        var ran = ""
        var dismissed = 0
        rule.setStanceContent {
            StanceDropdownMenu(
                expanded = true,
                onDismissRequest = { dismissed++ },
                items = listOf(
                    StanceMenuItem("Duplicate", onClick = { ran = "duplicate" }),
                    StanceMenuItem("Delete", onClick = { ran = "delete" }, destructive = true, startsGroup = true),
                    StanceMenuItem("Archive", onClick = { ran = "archive" }, enabled = false),
                ),
            )
        }
        rule.onNodeWithText("Archive").assertIsNotEnabled()
        rule.onNodeWithText("Delete").performClick()
        assertEquals("delete", ran)
        assertEquals(1, dismissed)
    }

    @Test
    fun splitButtonExposesBothActions() {
        var primary = 0
        rule.setStanceContent {
            StanceSplitButton("Save", onClick = { primary++ }, menuItems = listOf(StanceMenuItem("Save as draft", {})), menuDescription = "More save options")
        }
        rule.onNodeWithText("Save").performClick()
        assertEquals(1, primary)
        rule.onNodeWithContentDescription("More save options").performClick()
        rule.onNodeWithText("Save as draft").assertIsDisplayed()
    }
}
