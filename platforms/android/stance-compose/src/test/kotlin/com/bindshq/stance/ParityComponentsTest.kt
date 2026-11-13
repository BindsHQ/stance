package com.bindshq.stance

import android.content.ClipboardManager
import android.content.Context
import android.provider.Settings
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.height
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.tokens.StanceTokens
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.longClick
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import com.bindshq.stance.components.actions.StanceContextMenu
import com.bindshq.stance.components.actions.StanceCopyButton
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.actions.StanceMenuItem
import com.bindshq.stance.components.actions.StanceThemeSwitcher
import com.bindshq.stance.components.actions.StanceToolbar
import com.bindshq.stance.components.actions.rememberStanceContextMenuState
import com.bindshq.stance.components.actions.stanceContextMenu
import com.bindshq.stance.components.advanced.StanceSortableList
import com.bindshq.stance.components.advanced.stanceMove
import com.bindshq.stance.components.data.StanceAccordion
import com.bindshq.stance.components.data.StanceAccordionItem
import com.bindshq.stance.components.data.StanceAccordionMode
import com.bindshq.stance.components.data.StanceChart
import com.bindshq.stance.components.data.StanceChartSeries
import com.bindshq.stance.components.data.StanceCodeBlock
import com.bindshq.stance.components.data.StanceCollapsible
import com.bindshq.stance.components.data.StanceRichText
import com.bindshq.stance.components.data.StanceTreeNode
import com.bindshq.stance.components.data.StanceTreeView
import com.bindshq.stance.components.feedback.StanceNotificationItem
import com.bindshq.stance.components.feedback.StancePopover
import com.bindshq.stance.components.forms.StanceCalendar
import com.bindshq.stance.components.forms.StanceCheckboxGroup
import com.bindshq.stance.components.forms.StanceCheckboxOption
import com.bindshq.stance.components.forms.StanceCombobox
import com.bindshq.stance.components.forms.StanceInlineEdit
import com.bindshq.stance.components.forms.StanceMultiSelect
import com.bindshq.stance.components.forms.StanceNumberField
import com.bindshq.stance.components.forms.StancePinField
import com.bindshq.stance.components.forms.StanceSelectOption
import com.bindshq.stance.components.navigation.StancePagination
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceAppearance
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

/** Behaviour and TalkBack semantics of the native parity components. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "w600dp-h1400dp")
class ParityComponentsTest {
    @get:Rule
    val rule = createComposeRule()

    private val state = { text: String -> SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, text) }

    /** Runs the screen reader custom action named [label], as TalkBack would. */
    private fun SemanticsNodeInteraction.performCustomAction(label: String) {
        val action = fetchSemanticsNode().config[SemanticsActions.CustomActions].first { it.label == label }
        rule.runOnIdle { action.action() }
        rule.waitForIdle()
    }

    private val sections = listOf(
        StanceAccordionItem("rollout", "Rollout") { Text("Deploys tonight") },
        StanceAccordionItem("history", "History") { Text("Three versions") },
    )

    @Test
    fun accordionSingleOpensOneSectionAtATime() {
        rule.setStanceContent { StanceAccordion(sections) }
        rule.onNodeWithText("Rollout").assert(isHeading()).assert(state("Collapsed"))
        rule.onNodeWithText("Deploys tonight").assertDoesNotExist()
        rule.onNodeWithText("Rollout").performClick()
        rule.onNodeWithText("Deploys tonight").assertIsDisplayed()
        rule.onNodeWithText("Rollout").assert(state("Expanded"))
        rule.onNodeWithText("History").performClick()
        rule.onNodeWithText("Three versions").assertIsDisplayed()
        rule.onNodeWithText("Deploys tonight").assertDoesNotExist()
    }

    @Test
    fun accordionMultipleKeepsSectionsOpen() {
        rule.setStanceContent { StanceAccordion(sections, mode = StanceAccordionMode.Multiple) }
        rule.onNodeWithText("Rollout").performClick()
        rule.onNodeWithText("History").performSemanticsAction(SemanticsActions.Expand)
        rule.onNodeWithText("Deploys tonight").assertIsDisplayed()
        rule.onNodeWithText("Three versions").assertIsDisplayed()
        rule.onNodeWithText("Rollout").assertMinimumTouchTarget(rule)
    }

    @Test
    fun accordionOpensWithAnimationsOff() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 0f)
        try {
            rule.setStanceContent { StanceAccordion(sections) }
            rule.onNodeWithText("Rollout").performClick()
            rule.waitForIdle()
            rule.onNodeWithText("Deploys tonight").assertIsDisplayed()
        } finally {
            Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
        }
    }

    @Test
    fun controlsGrowWithTwoHundredPercentText() {
        rule.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density, fontScale = 2f)) {
                StanceTheme(tokens = StanceTokens.light) {
                    Column {
                        StanceAccordion(sections)
                        StancePinField("12", {}, length = 4)
                        StanceThemeSwitcher(StanceAppearance.System, {})
                        StancePagination(1, 3, {})
                    }
                }
            }
        }
        rule.onNodeWithText("Rollout").assertIsDisplayed().assertHeightIsAtLeast(48.dp)
        rule.onNodeWithText("High contrast").assertIsDisplayed()
        rule.onNodeWithText("Page 1 of 3").assertIsDisplayed()
        rule.onNodeWithText("2", useUnmergedTree = true).assertIsDisplayed()
    }

    @Test
    fun collapsibleReportsItsState() {
        var open by mutableStateOf(false)
        rule.setStanceContent { StanceCollapsible("Advanced settings", open, { open = it }) { Text("Retention") } }
        rule.onNodeWithText("Advanced settings").performClick()
        assertTrue(open)
        rule.onNodeWithText("Retention").assertIsDisplayed()
    }

    @Test
    fun checkboxGroupSelectAllIsTriState() {
        var selected by mutableStateOf(setOf("email"))
        rule.setStanceContent {
            StanceCheckboxGroup(
                "Notify by",
                listOf(StanceCheckboxOption("email", "Email"), StanceCheckboxOption("sms", "SMS")),
                selected,
                { selected = it },
                selectAll = true,
            )
        }
        val all = rule.onNodeWithText("Select all")
        all.assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, androidx.compose.ui.state.ToggleableState.Indeterminate))
        all.performClick()
        assertEquals(setOf("email", "sms"), selected)
        all.performClick()
        assertEquals(emptySet(), selected)
    }

    private val teams = listOf(StanceSelectOption("sales", "Sales"), StanceSelectOption("legal", "Legal"), StanceSelectOption("finance", "Finance"))

    @Test
    fun comboboxFiltersAsPeopleTypeAndSelects() {
        var chosen by mutableStateOf<String?>(null)
        rule.setStanceContent { StanceCombobox("Team", teams, chosen, { chosen = it }) }
        rule.onNode(hasSetTextAction()).performTextInput("le")
        rule.onNodeWithText("Legal").assertIsDisplayed()
        rule.onNodeWithText("Finance").assertDoesNotExist()
        rule.onNodeWithText("Legal").performClick()
        assertEquals("legal", chosen)
    }

    @Test
    fun comboboxShowsAnEmptyMessage() {
        rule.setStanceContent { StanceCombobox("Team", teams, null, {}) }
        rule.onNode(hasSetTextAction()).performTextInput("zz")
        rule.onNodeWithText("No results").assertIsDisplayed()
    }

    @Test
    fun multiSelectTogglesOptionsAndRemovesChips() {
        var chosen by mutableStateOf(setOf<String>())
        rule.setStanceContent { StanceMultiSelect("Teams", teams, chosen, { chosen = it }) }
        rule.onNodeWithContentDescription("Teams").performClick()
        rule.onNode(hasSetTextAction()).performTextInput("fin")
        rule.onNodeWithText("Sales").assertDoesNotExist()
        rule.onNodeWithText("Finance").performClick()
        assertEquals(setOf("finance"), chosen)
        rule.onNode(SemanticsMatcher("removes Finance") { node ->
            node.config.getOrNull(SemanticsActions.OnClick)?.label == "Remove Finance"
        }).assertExists().performClick()
        assertEquals(emptySet(), chosen)
    }

    @Test
    fun numberFieldStepsWithinBounds() {
        var value by mutableStateOf<Double?>(9.0)
        rule.setStanceContent { StanceNumberField(value, { value = it }, label = "Seats", min = 1.0, max = 10.0) }
        rule.onNodeWithContentDescription("Increase").assertMinimumTouchTarget(rule).performClick()
        assertEquals(10.0, value)
        rule.onNodeWithContentDescription("Increase").assertIsNotEnabled()
        rule.onNodeWithContentDescription("Decrease").assertIsEnabled().performClick()
        assertEquals(9.0, value)
    }

    @Test
    fun numberFieldClampsTypedValues() {
        var value by mutableStateOf<Double?>(null)
        rule.setStanceContent { StanceNumberField(value, { value = it }, label = "Seats", min = 1.0, max = 10.0) }
        rule.onNode(hasSetTextAction()).performTextReplacement("250")
        assertEquals(10.0, value)
        rule.onNode(hasSetTextAction()).performTextReplacement("")
        assertNull(value)
    }

    @Test
    fun pinFieldAcceptsTypingAndPaste() {
        var code by mutableStateOf("")
        var completed: String? = null
        rule.setStanceContent { StancePinField(code, { code = it }, onComplete = { completed = it }) }
        val field = rule.onNodeWithContentDescription("Verification code")
        field.performTextInput("12a")
        assertEquals("12", code)
        field.assert(state("2 of 6 entered"))
        field.performTextReplacement("123-456")
        assertEquals("123456", code)
        assertEquals("123456", completed)
        field.assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.ContentType))
    }

    private val files = listOf(
        StanceTreeNode("docs", "docs", listOf(StanceTreeNode("guide", "guide.md"), StanceTreeNode("api", "api.md"))),
        StanceTreeNode("readme", "README.md"),
    )

    @Test
    fun treeExpandsAndCollapses() {
        var expanded by mutableStateOf(setOf<String>())
        rule.setStanceContent { Box(Modifier.height(400.dp)) { StanceTreeView(files, expanded, { expanded = it }, label = "Files") } }
        rule.onNodeWithText("docs").assert(state("Collapsed")).assertMinimumTouchTarget(rule)
        rule.onNodeWithText("guide.md").assertDoesNotExist()
        rule.onNodeWithText("docs").performClick()
        assertEquals(setOf("docs"), expanded)
        rule.onNodeWithText("guide.md").assertIsDisplayed()
        rule.onNodeWithText("docs").assert(state("Expanded")).performSemanticsAction(SemanticsActions.Collapse)
        assertEquals(emptySet(), expanded)
    }

    @Test
    fun treeSelectsWhenSelectionIsOffered() {
        var selected by mutableStateOf<String?>(null)
        rule.setStanceContent {
            Box(Modifier.height(400.dp)) {
                StanceTreeView(files, initiallyExpanded = setOf("docs"), selected = selected, onSelect = { selected = it.id })
            }
        }
        rule.onNodeWithText("api.md").performClick()
        assertEquals("api", selected)
        rule.onNodeWithText("api.md").assertIsSelected()
    }

    @Test
    fun sortableListMovesWithAccessibilityActions() {
        var items by mutableStateOf(listOf("Draft", "Review", "Sign"))
        rule.setStanceContent {
            Box(Modifier.height(400.dp)) {
                StanceSortableList(items, key = { it }, itemLabel = { it }, onMove = { from, to -> items = items.stanceMove(from, to) }) { Text(it) }
            }
        }
        val draft = rule.onNodeWithText("Draft")
        val actions = draft.fetchSemanticsNode().config[SemanticsActions.CustomActions].map { it.label }
        assertEquals(listOf("Move down"), actions, "the first row cannot move up")
        draft.performCustomAction("Move down")
        assertEquals(listOf("Review", "Draft", "Sign"), items)
        rule.onNodeWithText("Draft").assert(state("Draft, position 2 of 3"))
        assertEquals(listOf("Move up", "Move down"), rule.onNodeWithText("Draft").fetchSemanticsNode().config[SemanticsActions.CustomActions].map { it.label })
        rule.onNodeWithText("Sign").performCustomAction("Move up")
        assertEquals(listOf("Review", "Sign", "Draft"), items)
    }

    @Test
    fun sortableListMoveButtonsAreNamed() {
        var items by mutableStateOf(listOf("Draft", "Review"))
        rule.setStanceContent {
            StanceSortableList(items, { it }, { it }, { from, to -> items = items.stanceMove(from, to) }, showMoveButtons = true) { Text(it) }
        }
        rule.onNodeWithContentDescription("Reorder Draft", useUnmergedTree = true).assertExists()
        rule.onAllNodesWithContentDescription("Move down")[0].performClick()
        assertEquals(listOf("Review", "Draft"), items)
    }

    @Test
    fun paginationStaysInBounds() {
        var page by mutableIntStateOf(1)
        rule.setStanceContent { StancePagination(page, pageCount = 3, onPageChange = { page = it }) }
        rule.onNodeWithContentDescription("Previous page").assertIsNotEnabled()
        rule.onNodeWithText("Page 1 of 3").assertIsDisplayed()
        rule.onNodeWithContentDescription("Next page").performClick()
        rule.onNodeWithContentDescription("Next page").performClick()
        assertEquals(3, page)
        rule.onNodeWithContentDescription("Next page").assertIsNotEnabled()
    }

    @Test
    fun paginationPageButtonsMarkTheCurrentPage() {
        var page by mutableIntStateOf(5)
        rule.setStanceContent { StancePagination(page, pageCount = 10, onPageChange = { page = it }, showPageNumbers = true) }
        rule.onNodeWithContentDescription("Page 5").assertIsSelected()
        rule.onNodeWithContentDescription("Page 10").performClick()
        assertEquals(10, page)
    }

    @Test
    fun richTextMarksHeadingsAndKeepsLinks() {
        rule.setStanceContent { StanceRichText("## Rollout\nRead [the guide](https://www.stanceui.com).\n\n- Sales\n- Legal") }
        rule.onNodeWithText("Rollout").assert(isHeading())
        rule.onNodeWithText("Read the guide.").assertIsDisplayed()
        rule.onNodeWithText("Legal").assertIsDisplayed()
    }

    @Test
    fun chartHasASummaryAndOneStopPerCategory() {
        rule.setStanceContent {
            StanceChart(
                title = "Signatures sent",
                categories = listOf("Jan", "Feb", "Mar"),
                series = listOf(StanceChartSeries("Sent", listOf(12f, 30f, 48f)), StanceChartSeries("Opened", listOf(8f, 20f, null))),
            )
        }
        rule.onNodeWithContentDescription("Line chart: Signatures sent. Lowest 8, highest 48.").assertExists()
        rule.onNodeWithContentDescription("Feb, Sent: 30, Opened: 20").assertExists()
        rule.onNodeWithContentDescription("Mar, Sent: 48").assertExists()
        rule.onNodeWithText("Signatures sent").assert(isHeading())
    }

    @Test
    fun copyButtonWritesToTheClipboardAndConfirms() {
        var result: Boolean? = null
        rule.setStanceContent { StanceCopyButton(text = "npm install @bindshq/stance-react", onCopy = { result = it }) }
        rule.onNodeWithContentDescription("Copy").assertMinimumTouchTarget(rule).performClick()
        rule.waitForIdle()
        assertEquals(true, result)
        rule.onNodeWithContentDescription("Copied").assertExists()
        val clipboard = ApplicationProvider.getApplicationContext<Context>().getSystemService(ClipboardManager::class.java)
        assertEquals("npm install @bindshq/stance-react", clipboard.primaryClip?.getItemAt(0)?.text.toString())
    }

    @Test
    fun codeBlockNamesItselfAndHidesLineNumbers() {
        rule.setStanceContent { StanceCodeBlock("val a = 1\nval b = 2", title = "Main.kt", showLineNumbers = true) }
        rule.onNodeWithContentDescription("Main.kt").assertExists()
        rule.onNodeWithText("2").assertDoesNotExist()
        rule.onNodeWithContentDescription("Copy").assertExists()
    }

    @Test
    fun inlineEditCommitsAndValidates() {
        var name by mutableStateOf("Sales")
        rule.setStanceContent {
            StanceInlineEdit(name, { name = it }, label = "template name", validate = { if (it.isBlank()) "Enter a name" else null })
        }
        rule.onNodeWithContentDescription("Edit template name").assert(state("Sales")).performClick()
        rule.onNode(hasSetTextAction()).performTextReplacement(" ")
        rule.onNodeWithContentDescription("Save").performClick()
        rule.onNodeWithText("Enter a name").assertIsDisplayed()
        rule.onNode(hasSetTextAction()).performTextReplacement("Sales EMEA")
        rule.onNodeWithContentDescription("Save").performClick()
        assertEquals("Sales EMEA", name)
        rule.onNodeWithContentDescription("Edit template name").assertExists()
    }

    @Test
    fun inlineEditCancelRestoresTheValue() {
        var name by mutableStateOf("Sales")
        rule.setStanceContent { StanceInlineEdit(name, { name = it }, label = "template name") }
        rule.onNodeWithContentDescription("Edit template name").performClick()
        rule.onNode(hasSetTextAction()).performTextReplacement("Other")
        rule.onNodeWithContentDescription("Cancel").performClick()
        assertEquals("Sales", name)
        rule.onNodeWithContentDescription("Edit template name").assert(state("Sales"))
    }

    @Test
    fun notificationAnnouncesUnreadAndOffersMarkAsRead() {
        var unread by mutableStateOf(true)
        rule.setStanceContent { StanceNotificationItem("Contract signed", body = "Amara signed the NDA.", time = "5 min ago", unread = unread, onMarkRead = { unread = false }) }
        val item = rule.onNodeWithText("Contract signed", substring = true)
        item.assert(state("Unread"))
        item.performCustomAction("Mark as read")
        assertTrue(!unread)
    }

    @Test
    fun contextMenuOpensOnLongPressAndFromTheAccessibilityAction() {
        rule.setStanceContent {
            val menu = rememberStanceContextMenuState()
            Box(Modifier.stanceContextMenu(menu, label = "Template actions")) {
                Text("Sales template")
                StanceContextMenu(menu, listOf(StanceMenuItem("Duplicate", onClick = {})))
            }
        }
        rule.onNodeWithText("Duplicate").assertDoesNotExist()
        rule.onNodeWithText("Sales template").performTouchInput { longClick() }
        rule.onNodeWithText("Duplicate").assertIsDisplayed()
    }

    @Test
    fun contextMenuHasANamedLongClickAction() {
        rule.setStanceContent {
            val menu = rememberStanceContextMenuState()
            Box(Modifier.stanceContextMenu(menu, label = "Template actions")) {
                Text("Sales template")
                StanceContextMenu(menu, listOf(StanceMenuItem("Duplicate", onClick = {})))
            }
        }
        val node = rule.onNode(SemanticsMatcher("long click named") { it.config.getOrNull(SemanticsActions.OnLongClick)?.label == "Template actions" })
        node.performSemanticsAction(SemanticsActions.OnLongClick)
        rule.onNodeWithText("Duplicate").assertIsDisplayed()
    }

    @Test
    fun popoverShowsItsTitleAsAPane() {
        rule.setStanceContent {
            Box {
                Text("Anchor")
                StancePopover(expanded = true, onDismissRequest = {}, title = "Share template") { Text("Anyone with the link can view.") }
            }
        }
        rule.onNodeWithText("Share template").assert(isHeading())
        rule.onNode(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "Share template")).assertExists()
    }

    @Test
    fun themeSwitcherSelectsAnAppearance() {
        var appearance by mutableStateOf(StanceAppearance.System)
        rule.setStanceContent { StanceThemeSwitcher(appearance, { appearance = it }) }
        rule.onNodeWithText("System").assertIsSelected()
        rule.onNodeWithText("Dark").performClick()
        assertEquals(StanceAppearance.Dark, appearance)
        rule.onNodeWithText("Dark").assertIsSelected()
        rule.onNodeWithText("High contrast").assertMinimumTouchTarget(rule)
    }

    @Test
    fun iconOnlyThemeSwitcherNamesEachSegment() {
        rule.setStanceContent { StanceThemeSwitcher(StanceAppearance.Light, {}, showLabels = false) }
        rule.onNodeWithContentDescription("Light").assertIsSelected()
        rule.onNodeWithContentDescription("High contrast").assertExists()
    }

    @Test
    fun calendarShowsTheSelectedDayAndReportsTaps() {
        var day by mutableStateOf<Long?>(NOVEMBER_20_2026)
        rule.setStanceContent { StanceCalendar(day, { day = it }) }
        rule.onNodeWithText("November 20, 2026", substring = true).assertIsSelected()
        rule.onNodeWithText("November 24, 2026", substring = true).performClick()
        rule.waitForIdle()
        assertEquals(NOVEMBER_20_2026 + 4 * DAY, day)
    }

    @Test
    fun toolbarIsANamedGroup() {
        rule.setStanceContent {
            StanceToolbar(label = "Text formatting") {
                StanceIconButton(StanceIcons.Type, "Bold", onClick = {})
                StanceIconButton(StanceIcons.Link, "Link", onClick = {})
            }
        }
        rule.onNodeWithContentDescription("Text formatting").assertExists()
        rule.onNodeWithContentDescription("Bold").assertMinimumTouchTarget(rule)
    }

    private companion object {
        const val NOVEMBER_20_2026 = 1_795_132_800_000L
        const val DAY = 86_400_000L
    }
}
