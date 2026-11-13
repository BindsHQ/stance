package si.binds.stance.showcase

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
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
import com.bindshq.stance.components.data.StanceChart
import com.bindshq.stance.components.data.StanceChartSeries
import com.bindshq.stance.components.data.StanceCodeBlock
import com.bindshq.stance.components.data.StanceCollapsible
import com.bindshq.stance.components.data.StanceListItem
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
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.rememberStanceAppearance

// Compiled examples of the native parity components. The showcase renders them and
// platforms/android/scripts/generate-components-json.mjs copies their source into components.json.

private val teams = listOf(
    StanceSelectOption("sales", "Sales"),
    StanceSelectOption("legal", "Legal"),
    StanceSelectOption("finance", "Finance"),
    StanceSelectOption("support", "Support"),
)

@Composable
fun StanceAccordionExample() {
    StanceAccordion(
        items = listOf(
            StanceAccordionItem("rollout", "Rollout") { Text("Signatures deploy to every mailbox tonight.") },
            StanceAccordionItem("history", "Version history") { Text("Three published versions.") },
        ),
        initiallyExpanded = setOf("rollout"),
    )
}

@Composable
fun StanceCollapsibleExample() {
    var open by remember { mutableStateOf(false) }
    StanceCollapsible("Advanced settings", open, { open = it }) {
        Text("Keep signed copies for seven years.")
    }
}

@Composable
fun StanceCalendarExample() {
    var day by remember { mutableStateOf<Long?>(null) }
    StanceCalendar(selectedDateMillis = day, onDateSelected = { day = it })
}

@Composable
fun StanceChartExample() {
    StanceChart(
        title = "Signatures sent",
        categories = listOf("Jan", "Feb", "Mar", "Apr"),
        series = listOf(
            StanceChartSeries("Sent", listOf(12f, 30f, 26f, 48f)),
            StanceChartSeries("Opened", listOf(8f, 21f, 20f, 39f)),
        ),
    )
}

@Composable
fun StanceCheckboxGroupExample() {
    var channels by remember { mutableStateOf(setOf("email")) }
    StanceCheckboxGroup(
        label = "Notify me by",
        options = listOf(StanceCheckboxOption("email", "Email"), StanceCheckboxOption("sms", "Text message")),
        selected = channels,
        onSelectedChange = { channels = it },
        selectAll = true,
    )
}

@Composable
fun StanceCodeBlockExample() {
    StanceCodeBlock(
        code = "dependencies {\n    implementation(libs.stance.compose)\n}",
        title = "build.gradle.kts",
        showLineNumbers = true,
    )
}

@Composable
fun StanceCopyButtonExample() {
    StanceCopyButton(text = "https://sign.binds.si/t/nda", label = "Copy link", showLabel = true)
}

@Composable
fun StanceComboboxExample() {
    var team by remember { mutableStateOf<String?>(null) }
    StanceCombobox(label = "Team", options = teams, selected = team, onSelect = { team = it }, placeholder = "Type to search")
}

@Composable
fun StanceMultiSelectExample() {
    var chosen by remember { mutableStateOf(setOf("sales", "legal")) }
    StanceMultiSelect(label = "Teams", options = teams, selected = chosen, onSelectedChange = { chosen = it })
}

@Composable
fun StanceContextMenuExample() {
    val menu = rememberStanceContextMenuState()
    Box(Modifier.stanceContextMenu(menu, label = "Template actions")) {
        StanceListItem("Sales team signature", supporting = "Long press for actions")
        StanceContextMenu(
            menu,
            listOf(
                StanceMenuItem("Duplicate", onClick = {}, icon = StanceIcons.Copy),
                StanceMenuItem("Delete", onClick = {}, icon = StanceIcons.Trash, destructive = true),
            ),
        )
    }
}

@Composable
fun StanceTreeViewExample() {
    StanceTreeView(
        nodes = listOf(
            StanceTreeNode("contracts", "Contracts", listOf(StanceTreeNode("nda", "Mutual NDA.pdf"), StanceTreeNode("msa", "MSA.pdf"))),
            StanceTreeNode("readme", "Read me.txt"),
        ),
        label = "Files",
        initiallyExpanded = setOf("contracts"),
        modifier = Modifier.height(StanceSpacing.space32 + StanceSpacing.space16),
    )
}

@Composable
fun StanceInlineEditExample() {
    var name by remember { mutableStateOf("Sales team signature") }
    StanceInlineEdit(value = name, onCommit = { name = it }, label = "template name")
}

@Composable
fun StanceNotificationItemExample() {
    var unread by remember { mutableStateOf(true) }
    StanceNotificationItem(
        title = "Amara signed the NDA",
        body = "All parties have signed. The final copy is ready.",
        time = "5 min ago",
        unread = unread,
        onMarkRead = { unread = false },
    )
}

@Composable
fun StanceNumberFieldExample() {
    var seats by remember { mutableStateOf<Double?>(5.0) }
    StanceNumberField(value = seats, onValueChange = { seats = it }, label = "Seats", min = 1.0, max = 50.0)
}

@Composable
fun StancePaginationExample() {
    var page by remember { mutableIntStateOf(1) }
    StancePagination(page = page, pageCount = 12, onPageChange = { page = it })
}

@Composable
fun StancePinFieldExample() {
    var code by remember { mutableStateOf("") }
    StancePinField(value = code, onValueChange = { code = it }, onComplete = { /* verify the code */ })
}

@Composable
fun StancePopoverExample() {
    var open by remember { mutableStateOf(false) }
    Box {
        StanceIconButton(StanceIcons.Info, contentDescription = "About sharing", onClick = { open = true })
        StancePopover(expanded = open, onDismissRequest = { open = false }, title = "Sharing") {
            Text("Anyone in your organisation can use this template.")
        }
    }
}

@Composable
fun StanceRichTextExample() {
    StanceRichText("## Rollout\nSignatures deploy **tonight**. Read the [guide](https://www.stanceui.com).\n\n- Sales\n- Legal")
}

@Composable
fun StanceSortableListExample() {
    var steps by remember { mutableStateOf(listOf("Draft", "Review", "Sign")) }
    StanceSortableList(
        items = steps,
        key = { it },
        itemLabel = { it },
        onMove = { from, to -> steps = steps.stanceMove(from, to) },
        modifier = Modifier.height(StanceSpacing.space32 + StanceSpacing.space16),
    ) { step -> Text(step) }
}

@Composable
fun StanceThemeSwitcherExample() {
    var appearance by rememberStanceAppearance()
    StanceThemeSwitcher(appearance = appearance, onAppearanceChange = { appearance = it })
}

@Composable
fun StanceToolbarExample() {
    StanceToolbar(label = "Text formatting") {
        StanceIconButton(StanceIcons.Type, contentDescription = "Text style", onClick = {})
        StanceIconButton(StanceIcons.Link, contentDescription = "Insert link", onClick = {})
        StanceIconButton(StanceIcons.Image, contentDescription = "Insert image", onClick = {})
    }
}

/** The native parity components for the showcase catalogue, by category. */
val parityCatalogue: List<Pair<String, List<Pair<String, @Composable () -> Unit>>>> = listOf(
    "Actions" to listOf(
        "StanceCopyButton" to { StanceCopyButtonExample() },
        "stanceContextMenu" to { StanceContextMenuExample() },
        "StanceToolbar" to { StanceToolbarExample() },
        "StanceThemeSwitcher" to { StanceThemeSwitcherExample() },
    ),
    "Forms" to listOf(
        "StanceCombobox" to { StanceComboboxExample() },
        "StanceMultiSelect" to { StanceMultiSelectExample() },
        "StanceCheckboxGroup" to { StanceCheckboxGroupExample() },
        "StanceNumberField" to { StanceNumberFieldExample() },
        "StancePinField" to { StancePinFieldExample() },
        "StanceInlineEdit" to { StanceInlineEditExample() },
        "StanceCalendar" to { StanceCalendarExample() },
    ),
    "Navigation" to listOf(
        "StancePagination" to { StancePaginationExample() },
    ),
    "Data display" to listOf(
        "StanceAccordion" to { StanceAccordionExample() },
        "StanceCollapsible" to { StanceCollapsibleExample() },
        "StanceTreeView" to { StanceTreeViewExample() },
        "StanceChart" to { StanceChartExample() },
        "StanceCodeBlock" to { StanceCodeBlockExample() },
        "StanceRichText" to { StanceRichTextExample() },
    ),
    "Feedback and overlays" to listOf(
        "StanceNotificationItem" to { StanceNotificationItemExample() },
        "StancePopover" to { StancePopoverExample() },
    ),
    "Advanced" to listOf(
        "StanceSortableList" to { StanceSortableListExample() },
    ),
)
