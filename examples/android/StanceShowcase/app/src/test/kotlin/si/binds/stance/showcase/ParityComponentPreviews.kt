package si.binds.stance.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.performTextInput
import com.bindshq.stance.components.actions.StanceContextMenu
import com.bindshq.stance.components.actions.StanceCopyButton
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.actions.StanceIconButtonVariant
import com.bindshq.stance.components.actions.StanceMenuItem
import com.bindshq.stance.components.actions.StanceThemeSwitcher
import com.bindshq.stance.components.actions.StanceToolbar
import com.bindshq.stance.components.actions.StanceToolbarStyle
import com.bindshq.stance.components.actions.rememberStanceContextMenuState
import com.bindshq.stance.components.actions.stanceContextMenu
import com.bindshq.stance.components.advanced.StanceSortableList
import com.bindshq.stance.components.data.StanceAccordion
import com.bindshq.stance.components.data.StanceAccordionItem
import com.bindshq.stance.components.data.StanceAccordionMode
import com.bindshq.stance.components.data.StanceAccordionVariant
import com.bindshq.stance.components.data.StanceAvatar
import com.bindshq.stance.components.data.StanceChart
import com.bindshq.stance.components.data.StanceChartSeries
import com.bindshq.stance.components.data.StanceChartType
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
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceAppearance
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

private val gap = Arrangement.spacedBy(StanceSpacing.space4)

private val teams = listOf(
    StanceSelectOption("sales", "Sales"),
    StanceSelectOption("legal", "Legal"),
    StanceSelectOption("finance", "Finance"),
    StanceSelectOption("support", "Support"),
)

private const val NOVEMBER_20_2026 = 1_795_132_800_000L

private val sections = listOf(
    StanceAccordionItem("rollout", "Rollout") { Text("Signatures deploy to every mailbox tonight.", style = StanceTheme.typography.bodySmall) },
    StanceAccordionItem("history", "Version history") { Text("Three published versions.", style = StanceTheme.typography.bodySmall) },
    StanceAccordionItem("access", "Access") { Text("Sales and Legal can edit.", style = StanceTheme.typography.bodySmall) },
)

/** Documentation images of the native parity components, keyed by their name in components.json. */
val parityComponentPreviews: Map<String, ComponentPreview> = mapOf(
    "StanceAccordion" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceAccordion(sections, initiallyExpanded = setOf("rollout"))
            StanceAccordion(sections.take(2), mode = StanceAccordionMode.Multiple, initiallyExpanded = setOf("history"), variant = StanceAccordionVariant.Separated)
        }
    },
    "StanceCollapsible" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceCollapsible("Advanced settings", expanded = true, onExpandedChange = {}) {
                Text("Keep signed copies for seven years.", style = StanceTheme.typography.bodySmall)
            }
            StanceCollapsible("Audit trail", expanded = false, onExpandedChange = {}) {}
        }
    },
    "StanceCalendar" to ComponentPreview {
        StanceCalendar(selectedDateMillis = NOVEMBER_20_2026, onDateSelected = {})
    },
    "StanceChart" to ComponentPreview {
        Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space5)) {
            val months = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun")
            StanceChart(
                title = "Signatures sent",
                categories = months,
                series = listOf(
                    StanceChartSeries("Sent", listOf(12f, 30f, 26f, 48f, 41f, 55f)),
                    StanceChartSeries("Opened", listOf(8f, 21f, 20f, 39f, 30f, 44f)),
                ),
                height = StanceSpacing.space32,
            )
            StanceChart(
                title = "Templates by team",
                categories = listOf("Sales", "Legal", "Finance", "Support"),
                series = listOf(StanceChartSeries("Live", listOf(14f, 9f, 6f, 4f)), StanceChartSeries("Draft", listOf(3f, 5f, 2f, 1f))),
                type = StanceChartType.Bar,
                height = StanceSpacing.space32,
            )
        }
    },
    "StanceCheckboxGroup" to ComponentPreview {
        StanceCheckboxGroup(
            label = "Notify me by",
            options = listOf(
                StanceCheckboxOption("email", "Email", "A message for every signature"),
                StanceCheckboxOption("sms", "Text message"),
                StanceCheckboxOption("push", "Push notification", enabled = false),
            ),
            selected = setOf("email"),
            onSelectedChange = {},
            selectAll = true,
            helper = "Choose at least one.",
        )
    },
    "StanceCodeBlock" to ComponentPreview {
        StanceCodeBlock(
            code = "dependencies {\n    implementation(libs.stance.compose)\n    testImplementation(libs.robolectric)\n}",
            title = "build.gradle.kts",
            showLineNumbers = true,
            highlightLines = setOf(2),
        )
    },
    "StanceCopyButton" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceCopyButton(text = "https://sign.binds.si/t/nda", label = "Copy link", showLabel = true)
            StanceCopyButton(text = "npm install @bindshq/stance-react")
        }
    },
    "StanceCombobox" to ComponentPreview(
        PreviewFrame.Overlay,
        height = 420,
        prepare = { rule -> rule.onNode(hasSetTextAction()).performTextInput("s") },
    ) {
        Column(Modifier.padding(StanceSpacing.space6)) {
            StanceCombobox(label = "Team", options = teams, selected = null, onSelect = {}, placeholder = "Type to search")
        }
    },
    "StanceMultiSelect" to ComponentPreview {
        StanceMultiSelect(label = "Teams", options = teams, selected = setOf("sales", "legal", "support"), onSelectedChange = {}, helper = "Members of these teams can use the template.")
    },
    "stanceContextMenu" to ComponentPreview(PreviewFrame.Overlay, height = 300) {
        val menu = rememberStanceContextMenuState()
        // Opens the menu at a fixed point, as a long press there would.
        LaunchedEffect(Unit) { menu.open(Offset(260f, 90f)) }
        Box(Modifier.fillMaxSize().padding(StanceSpacing.space6)) {
            Box(Modifier.stanceContextMenu(menu, label = "Template actions")) {
                StanceListItem("Sales team signature", supporting = "Long press for actions", leading = { StanceAvatar("Sales Team") })
                StanceContextMenu(
                    menu,
                    listOf(
                        StanceMenuItem("Edit", onClick = {}, icon = StanceIcons.Pencil),
                        StanceMenuItem("Duplicate", onClick = {}, icon = StanceIcons.Copy),
                        StanceMenuItem("Delete", onClick = {}, icon = StanceIcons.Trash, destructive = true, startsGroup = true),
                    ),
                )
            }
        }
    },
    "StanceTreeView" to ComponentPreview {
        StanceTreeView(
            nodes = listOf(
                StanceTreeNode(
                    "contracts",
                    "Contracts",
                    listOf(
                        StanceTreeNode("nda", "Mutual NDA.pdf", meta = "2 MB"),
                        StanceTreeNode("msa", "Master services.pdf"),
                        StanceTreeNode("archive", "Archive", listOf(StanceTreeNode("old", "2024.pdf"))),
                    ),
                ),
                StanceTreeNode("templates", "Templates", listOf(StanceTreeNode("sales", "Sales.html"))),
                StanceTreeNode("readme", "Read me.txt"),
            ),
            label = "Files",
            initiallyExpanded = setOf("contracts"),
            selected = "nda",
            onSelect = {},
            modifier = Modifier.height(StanceSpacing.space32 * 2 + StanceSpacing.space8),
        )
    },
    "StanceInlineEdit" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceInlineEdit(value = "Sales team signature", onCommit = {}, label = "template name", textStyle = StanceTheme.typography.title)
            StanceInlineEdit(value = "Legal footer", onCommit = {}, label = "template name", initiallyEditing = true)
        }
    },
    "StanceNotificationItem" to ComponentPreview {
        Column {
            StanceNotificationItem(
                title = "Amara signed the NDA",
                body = "All parties have signed. The final copy is ready.",
                time = "5 min ago",
                unread = true,
                leading = { StanceAvatar("Amara Okafor") },
                onMarkRead = {},
            )
            StanceDivider()
            StanceNotificationItem(
                title = "Template published",
                body = "Sales team signature is live for 48 people.",
                time = "Yesterday",
                leading = { StanceAvatar("Sales Team") },
            )
        }
    },
    "StanceNumberField" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceNumberField(value = 5.0, onValueChange = {}, label = "Seats", min = 1.0, max = 50.0, helper = "Up to 50 people.")
            StanceNumberField(value = 12.5, onValueChange = {}, label = "Discount", step = 0.5, suffix = "%", showStepper = false)
        }
    },
    "StancePagination" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StancePagination(page = 3, pageCount = 12, onPageChange = {})
            StancePagination(page = 6, pageCount = 12, onPageChange = {}, showPageNumbers = true)
        }
    },
    "StancePinField" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StancePinField(value = "1234", onValueChange = {})
            StancePinField(value = "12", onValueChange = {}, length = 4, mask = true, error = "That code has expired.")
        }
    },
    "StancePopover" to ComponentPreview(PreviewFrame.Overlay, height = 300) {
        Box(Modifier.fillMaxSize().padding(StanceSpacing.space6)) {
            Box(Modifier.align(Alignment.TopCenter)) {
                StanceIconButton(StanceIcons.Info, "About sharing", onClick = {}, variant = StanceIconButtonVariant.Outline)
                StancePopover(expanded = true, onDismissRequest = {}, title = "Sharing") {
                    Text("Anyone in your organisation can use this template.", style = StanceTheme.typography.bodySmall)
                }
            }
        }
    },
    "StanceRichText" to ComponentPreview {
        StanceRichText(
            "## Rollout plan\nSignatures deploy **tonight** to every mailbox. Read the [rollout guide](https://www.stanceui.com).\n\n" +
                "1. Publish the template\n2. Assign it to *Sales*\n3. Check `sync` status\n\n> Keep the legal footer unchanged.",
        )
    },
    "StanceSortableList" to ComponentPreview {
        StanceSortableList(
            items = listOf("Draft the agreement", "Legal review", "Send for signature", "Archive"),
            key = { it },
            itemLabel = { it },
            onMove = { _, _ -> },
            showMoveButtons = true,
            modifier = Modifier.height(StanceSpacing.space32 + StanceSpacing.space24 + StanceSpacing.space2),
        ) { step -> Text(step, style = StanceTheme.typography.body) }
    },
    "StanceThemeSwitcher" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceThemeSwitcher(appearance = StanceAppearance.System, onAppearanceChange = {})
            StanceThemeSwitcher(appearance = StanceAppearance.Dark, onAppearanceChange = {}, showLabels = false)
        }
    },
    "StanceToolbar" to ComponentPreview {
        Column(verticalArrangement = gap, horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            StanceToolbar(label = "Text formatting") {
                StanceIconButton(StanceIcons.Type, "Text style", onClick = {})
                StanceIconButton(StanceIcons.Link, "Insert link", onClick = {})
                StanceIconButton(StanceIcons.Image, "Insert image", onClick = {})
                StanceDivider(vertical = true, modifier = Modifier.height(StanceSpacing.space6))
                StanceIconButton(StanceIcons.MoreHorizontal, "More", onClick = {})
            }
            StanceToolbar(label = "Selection", style = StanceToolbarStyle.Inline) {
                StanceIconButton(StanceIcons.Download, "Download", onClick = {})
                StanceIconButton(StanceIcons.Copy, "Duplicate", onClick = {})
                StanceIconButton(StanceIcons.Trash, "Delete", onClick = {})
            }
        }
    },
)
