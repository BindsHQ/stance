package si.binds.stance.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonGroup
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceDropdownMenu
import com.bindshq.stance.components.actions.StanceFloatingActionButton
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.actions.StanceMenuItem
import com.bindshq.stance.components.actions.StanceSplitButton
import com.bindshq.stance.components.advanced.StanceFilter
import com.bindshq.stance.components.advanced.StanceFilterBar
import com.bindshq.stance.components.advanced.StancePullToRefresh
import com.bindshq.stance.components.advanced.StanceSearchableList
import com.bindshq.stance.components.advanced.StanceSignatureCanvas
import com.bindshq.stance.components.advanced.StanceSwipeAction
import com.bindshq.stance.components.advanced.StanceSwipeActions
import com.bindshq.stance.components.advanced.rememberStanceDocumentPicker
import com.bindshq.stance.components.advanced.rememberStancePhotoPicker
import com.bindshq.stance.components.advanced.rememberStanceSignatureState
import com.bindshq.stance.components.data.StanceAvatar
import com.bindshq.stance.components.data.StanceAvatarGroup
import com.bindshq.stance.components.data.StanceBadge
import com.bindshq.stance.components.data.StanceCircularProgressIndicator
import com.bindshq.stance.components.data.StanceDataTable
import com.bindshq.stance.components.data.StanceDescriptionList
import com.bindshq.stance.components.data.StanceEmptyState
import com.bindshq.stance.components.data.StanceListItem
import com.bindshq.stance.components.data.StanceProgressIndicator
import com.bindshq.stance.components.data.StanceSkeleton
import com.bindshq.stance.components.data.StanceStatCard
import com.bindshq.stance.components.data.StanceTableColumn
import com.bindshq.stance.components.data.StanceTag
import com.bindshq.stance.components.data.StanceTimeline
import com.bindshq.stance.components.data.StanceTimelineEvent
import com.bindshq.stance.components.feedback.StanceAlertDialog
import com.bindshq.stance.components.feedback.StanceBanner
import com.bindshq.stance.components.feedback.StanceBottomSheet
import com.bindshq.stance.components.feedback.StanceDialog
import com.bindshq.stance.components.feedback.StanceErrorState
import com.bindshq.stance.components.feedback.StanceInlineAlert
import com.bindshq.stance.components.feedback.StanceLoadingOverlay
import com.bindshq.stance.components.feedback.StanceSnackbarHost
import com.bindshq.stance.components.feedback.StanceTooltip
import com.bindshq.stance.components.feedback.showStanceSnackbar
import com.bindshq.stance.components.forms.StanceCheckbox
import com.bindshq.stance.components.forms.StanceDatePicker
import com.bindshq.stance.components.forms.StanceDateRangePicker
import com.bindshq.stance.components.forms.StanceFilterChip
import com.bindshq.stance.components.forms.StanceFormField
import com.bindshq.stance.components.forms.StanceInputChip
import com.bindshq.stance.components.forms.StancePasswordField
import com.bindshq.stance.components.forms.StanceRadioGroup
import com.bindshq.stance.components.forms.StanceRadioOption
import com.bindshq.stance.components.forms.StanceRangeSlider
import com.bindshq.stance.components.forms.StanceSearchBar
import com.bindshq.stance.components.forms.StanceSelect
import com.bindshq.stance.components.forms.StanceSelectOption
import com.bindshq.stance.components.forms.StanceSlider
import com.bindshq.stance.components.forms.StanceSwitch
import com.bindshq.stance.components.forms.StanceTextField
import com.bindshq.stance.components.forms.StanceTimePicker
import com.bindshq.stance.components.navigation.StanceAdaptiveNavigation
import com.bindshq.stance.components.navigation.StanceNavigationBar
import com.bindshq.stance.components.navigation.StanceNavigationDrawer
import com.bindshq.stance.components.navigation.StanceNavigationItem
import com.bindshq.stance.components.navigation.StanceNavigationRail
import com.bindshq.stance.components.navigation.StancePagerIndicator
import com.bindshq.stance.components.navigation.StanceStepper
import com.bindshq.stance.components.navigation.StanceTabs
import com.bindshq.stance.components.navigation.StanceTopAppBar
import com.bindshq.stance.foundation.StanceAdaptiveGrid
import com.bindshq.stance.foundation.StanceCard
import com.bindshq.stance.foundation.StanceCardVariant
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.StanceScaffold
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.interop.StanceButtonView
import com.bindshq.stance.interop.setStanceContent
import com.bindshq.stance.theme.StanceAppearance
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.theme.rememberStanceAppearance
import kotlinx.coroutines.launch

// One compiled example per public component. The showcase renders them and
// platforms/android/scripts/generate-components-json.mjs copies their source into components.json.

private val destinations = listOf(
    StanceNavigationItem("Templates", StanceIcons.FileText),
    StanceNavigationItem("Users", StanceIcons.Users, badge = "3"),
    StanceNavigationItem("Settings", StanceIcons.Settings),
)

@Composable
fun StanceThemeExample() {
    var appearance by rememberStanceAppearance()
    StanceTheme(appearance = appearance) {
        StanceButton("Use dark theme", onClick = { appearance = StanceAppearance.Dark })
    }
}

@Composable
fun StanceSurfaceExample() {
    StanceSurface(elevation = StanceTheme.elevation.md, bordered = true) {
        Text("Raised surface", modifier = Modifier.padding(StanceSpacing.space4))
    }
}

@Composable
fun StanceCardExample() {
    StanceCard(variant = StanceCardVariant.Outline, onClick = {}) {
        Text("Sales team signature", style = StanceTheme.typography.title)
        Text("Deployed to 48 users", style = StanceTheme.typography.bodySmall, color = StanceTheme.colors.fgMuted)
    }
}

@Composable
fun StanceDividerExample() {
    Column {
        Text("Details")
        StanceDivider(modifier = Modifier.padding(vertical = StanceSpacing.space2))
        Text("Rollout")
    }
}

@Composable
fun StanceScaffoldExample() {
    val snackbars = remember { SnackbarHostState() }
    StanceScaffold(
        topBar = { StanceTopAppBar("Templates") },
        snackbarHostState = snackbars,
    ) { padding ->
        Text("Content", modifier = Modifier.padding(padding))
    }
}

@Composable
fun StanceAdaptiveGridExample() {
    StanceAdaptiveGrid(modifier = Modifier.height(StanceSpacing.space24 * 2)) {
        items(listOf("Sales", "Legal", "Finance")) { team ->
            StanceCard { Text(team) }
        }
    }
}

@Composable
fun StanceIconExample() {
    Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
        StanceIcon(StanceIcons.Signature, contentDescription = null)
        StanceIcon(StanceIcons.AlertTriangle, contentDescription = "Warning")
    }
}

@Composable
fun StanceFocusRingExample() {
    StanceSurface(modifier = Modifier.stanceFocusRing(), onClick = {}, bordered = true) {
        Text("Focus me with a keyboard", modifier = Modifier.padding(StanceSpacing.space4))
    }
}

@Composable
fun StanceButtonExample() {
    Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        StanceButton("Save template", onClick = {}, leadingIcon = StanceIcons.Check)
        StanceButton("Preview", onClick = {}, variant = StanceButtonVariant.Outline)
        StanceButton("Delete", onClick = {}, variant = StanceButtonVariant.Danger)
        StanceButton("Deploying", onClick = {}, loading = true)
    }
}

@Composable
fun StanceIconButtonExample() {
    StanceIconButton(StanceIcons.Trash, contentDescription = "Delete template", onClick = {})
}

@Composable
fun StanceFloatingActionButtonExample() {
    StanceFloatingActionButton(StanceIcons.Plus, contentDescription = "New template", onClick = {}, text = "New template")
}

@Composable
fun StanceButtonGroupExample() {
    var selected by remember { mutableIntStateOf(0) }
    StanceButtonGroup(listOf("Day", "Week", "Month"), selected, onSelect = { selected = it })
}

@Composable
fun StanceSplitButtonExample() {
    StanceSplitButton(
        text = "Save",
        onClick = {},
        menuItems = listOf(StanceMenuItem("Save as draft", onClick = {}), StanceMenuItem("Save and deploy", onClick = {})),
        menuDescription = "More save options",
    )
}

@Composable
fun StanceDropdownMenuExample() {
    var expanded by remember { mutableStateOf(false) }
    Box {
        StanceIconButton(StanceIcons.MoreVertical, contentDescription = "Template actions", onClick = { expanded = true })
        StanceDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            items = listOf(
                StanceMenuItem("Duplicate", onClick = {}, icon = StanceIcons.Copy),
                StanceMenuItem("Delete", onClick = {}, icon = StanceIcons.Trash, destructive = true, startsGroup = true),
            ),
        )
    }
}

@Composable
fun StanceFormFieldExample() {
    StanceFormField(label = "Signature", helper = "Draw with your finger or a stylus.", required = true) {
        StanceSignatureCanvas(rememberStanceSignatureState(), label = "Signature")
    }
}

@Composable
fun StanceTextFieldExample() {
    var name by remember { mutableStateOf("Sales team signature") }
    StanceTextField(name, { name = it }, label = "Template name", helper = "Visible to your organisation.", required = true)
}

@Composable
fun StancePasswordFieldExample() {
    var password by remember { mutableStateOf("") }
    StancePasswordField(password, { password = it }, label = "Password")
}

@Composable
fun StanceSearchBarExample() {
    var query by remember { mutableStateOf("") }
    StanceSearchBar(query, { query = it }, placeholder = "Search templates")
}

@Composable
fun StanceCheckboxExample() {
    var checked by remember { mutableStateOf(true) }
    StanceCheckbox("Send me a copy", checked, { checked = it }, description = "A PDF is emailed after signing.")
}

@Composable
fun StanceRadioGroupExample() {
    var role by remember { mutableStateOf("editor") }
    StanceRadioGroup(
        label = "Role",
        options = listOf(StanceRadioOption("viewer", "Viewer"), StanceRadioOption("editor", "Editor", "Can change templates")),
        selected = role,
        onSelect = { role = it },
    )
}

@Composable
fun StanceSwitchExample() {
    var enabled by remember { mutableStateOf(true) }
    StanceSwitch("Apply to new members automatically", enabled, { enabled = it })
}

@Composable
fun StanceSliderExample() {
    var value by remember { mutableFloatStateOf(40f) }
    StanceSlider("Rollout", value, { value = it }, valueRange = 0f..100f, valueText = "${value.toInt()}%")
}

@Composable
fun StanceRangeSliderExample() {
    var range by remember { mutableStateOf(20f..80f) }
    StanceRangeSlider("Team size", range, { range = it }, valueRange = 0f..100f, valueText = "${range.start.toInt()} to ${range.endInclusive.toInt()}")
}

@Composable
fun StanceSelectExample() {
    var role by remember { mutableStateOf<String?>("admin") }
    StanceSelect(
        label = "Role",
        options = listOf(StanceSelectOption("admin", "Administrator"), StanceSelectOption("member", "Member")),
        selected = role,
        onSelect = { role = it },
    )
}

@Composable
fun StanceDatePickerExample() {
    var date by remember { mutableStateOf<Long?>(null) }
    StanceDatePicker("Signing deadline", date, onDateSelected = { date = it })
}

@Composable
fun StanceDateRangePickerExample() {
    var start by remember { mutableStateOf<Long?>(null) }
    var end by remember { mutableStateOf<Long?>(null) }
    StanceDateRangePicker("Deployment window", start, end, onRangeSelected = { s, e -> start = s; end = e })
}

@Composable
fun StanceTimePickerExample() {
    var time by remember { mutableStateOf<Pair<Int, Int>?>(9 to 30) }
    StanceTimePicker("Reminder", time?.first, time?.second, onTimeSelected = { h, m -> time = h to m })
}

@Composable
fun StanceFilterChipExample() {
    var selected by remember { mutableStateOf(true) }
    StanceFilterChip("Signed", selected, onClick = { selected = !selected })
}

@Composable
fun StanceInputChipExample() {
    StanceInputChip("Priya Nair", onRemove = {}, removeDescription = "Remove Priya Nair")
}

@Composable
fun StanceNavigationBarExample() {
    var selected by remember { mutableIntStateOf(0) }
    StanceNavigationBar(destinations, selected, onSelect = { selected = it })
}

@Composable
fun StanceNavigationRailExample() {
    var selected by remember { mutableIntStateOf(0) }
    StanceNavigationRail(destinations, selected, onSelect = { selected = it }, modifier = Modifier.height(StanceSpacing.space24 * 3))
}

@Composable
fun StanceNavigationDrawerExample() {
    var selected by remember { mutableIntStateOf(0) }
    StanceNavigationDrawer(destinations, selected, onSelect = { selected = it }, modifier = Modifier.height(StanceSpacing.space24 * 3)) {
        Text("Content", modifier = Modifier.padding(StanceSpacing.space4))
    }
}

@Composable
fun StanceAdaptiveNavigationExample() {
    var selected by remember { mutableIntStateOf(0) }
    StanceAdaptiveNavigation(
        items = destinations,
        selectedIndex = selected,
        onSelect = { selected = it },
        topBar = { StanceTopAppBar(destinations[selected].label) },
    ) { padding ->
        Text("Content", modifier = Modifier.padding(padding))
    }
}

@Composable
fun StanceTopAppBarExample() {
    StanceTopAppBar("Signature templates", onNavigateUp = {}) {
        StanceIconButton(StanceIcons.Search, contentDescription = "Search", onClick = {})
    }
}

@Composable
fun StanceTabsExample() {
    var selected by remember { mutableIntStateOf(0) }
    StanceTabs(listOf("Details", "Rollout", "History"), selected, onSelect = { selected = it })
}

@Composable
fun StancePagerIndicatorExample() {
    StancePagerIndicator(pageCount = 4, currentPage = 1)
}

@Composable
fun StanceStepperExample() {
    StanceStepper(listOf("Template", "Recipients", "Review", "Deploy"), currentStep = 1)
}

@Composable
fun StanceListItemExample() {
    StanceListItem(
        headline = "Sales team signature",
        supporting = "Deployed to 48 users",
        leading = { StanceAvatar("Sales Team") },
        trailing = { StanceBadge("Live", tone = StanceTone.Success) },
        onClick = {},
    )
}

@Composable
fun StanceBadgeExample() {
    Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        StanceBadge("Live", tone = StanceTone.Success)
        StanceBadge("Pending", tone = StanceTone.Warning)
        StanceBadge("Failed", tone = StanceTone.Danger)
    }
}

@Composable
fun StanceTagExample() {
    StanceTag("Legal", icon = StanceIcons.Tag)
}

@Composable
fun StanceAvatarExample() {
    StanceAvatar("Amara Okafor")
}

@Composable
fun StanceAvatarGroupExample() {
    StanceAvatarGroup(listOf("Amara Okafor", "Lukas Brenner", "Priya Nair", "Hana Sato", "Owen Price"), max = 3)
}

@Composable
fun StanceProgressIndicatorExample() {
    StanceProgressIndicator(0.72f, label = "Rollout")
}

@Composable
fun StanceCircularProgressIndicatorExample() {
    StanceCircularProgressIndicator(contentDescription = "Loading templates")
}

@Composable
fun StanceSkeletonExample() {
    Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        StanceSkeleton(width = StanceSpacing.space24 * 2)
        StanceSkeleton()
    }
}

@Composable
fun StanceEmptyStateExample() {
    StanceEmptyState("No templates yet", description = "Create your first signature template.") {
        StanceButton("Create template", onClick = {})
    }
}

@Composable
fun StanceTimelineExample() {
    StanceTimeline(
        listOf(
            StanceTimelineEvent("Deployed", "Today, 10:42", "35 of 48 mailboxes updated", StanceTone.Success),
            StanceTimelineEvent("Template edited", "Yesterday, 16:05"),
        ),
    )
}

@Composable
fun StanceStatCardExample() {
    StanceStatCard("Signatures deployed", "1,284", change = "12%", changeDescription = "up 12% from last month", positive = true)
}

@Composable
fun StanceDescriptionListExample() {
    StanceDescriptionList(listOf("Owner" to "Priya Nair", "Status" to "Live", "Users" to "48"))
}

@Composable
fun StanceDataTableExample() {
    data class User(val name: String, val team: String, val deployments: Int)
    StanceDataTable(
        columns = listOf(
            StanceTableColumn<User>("Name") { it.name },
            StanceTableColumn("Team") { it.team },
            StanceTableColumn("Deployments", numeric = true) { it.deployments.toString() },
        ),
        rows = listOf(User("Priya Nair", "Sales", 14), User("Hana Sato", "Finance", 9)),
        caption = "Organisation users",
    )
}

@Composable
fun StanceSnackbarHostExample() {
    val snackbars = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    Column {
        StanceButton("Save", onClick = { scope.launch { snackbars.showStanceSnackbar("Template saved", StanceTone.Success, actionLabel = "Undo") } })
        StanceSnackbarHost(snackbars)
    }
}

@Composable
fun StanceDialogExample() {
    var open by remember { mutableStateOf(false) }
    StanceButton("Rename template", onClick = { open = true }, variant = StanceButtonVariant.Outline)
    if (open) {
        StanceDialog(
            title = "Rename template",
            onDismissRequest = { open = false },
            actions = { StanceButton("Save", onClick = { open = false }) },
        ) {
            StanceTextField("Sales team", {}, label = "Template name")
        }
    }
}

@Composable
fun StanceAlertDialogExample() {
    var open by remember { mutableStateOf(false) }
    StanceButton("Delete template", onClick = { open = true }, variant = StanceButtonVariant.Danger)
    if (open) {
        StanceAlertDialog(
            title = "Delete this template?",
            message = "48 users will lose this signature. This cannot be undone.",
            confirmLabel = "Delete template",
            onConfirm = { open = false },
            onDismissRequest = { open = false },
            destructive = true,
        )
    }
}

@Composable
fun StanceBottomSheetExample() {
    var open by remember { mutableStateOf(false) }
    StanceButton("Share template", onClick = { open = true }, variant = StanceButtonVariant.Outline)
    if (open) {
        StanceBottomSheet(onDismissRequest = { open = false }, title = "Share template") {
            StanceListItem("Copy link", leading = { StanceIcon(StanceIcons.Link, null) }, onClick = { open = false })
            StanceListItem("Send by email", leading = { StanceIcon(StanceIcons.Mail, null) }, onClick = { open = false })
        }
    }
}

@Composable
fun StanceTooltipExample() {
    StanceTooltip("Copy signature") {
        StanceIconButton(StanceIcons.Copy, contentDescription = "Copy signature", onClick = {})
    }
}

@Composable
fun StanceInlineAlertExample() {
    StanceInlineAlert("13 mailboxes could not be updated.", tone = StanceTone.Warning, title = "Deployment incomplete")
}

@Composable
fun StanceBannerExample() {
    StanceBanner("Scheduled maintenance on Saturday from 22:00.", tone = StanceTone.Info, onDismiss = {})
}

@Composable
fun StanceLoadingOverlayExample() {
    StanceLoadingOverlay(visible = true, message = "Deploying signature") {
        StanceCard(modifier = Modifier.fillMaxWidth().height(StanceSpacing.space24 * 2)) { Text("Template settings") }
    }
}

@Composable
fun StanceErrorStateExample() {
    StanceErrorState("Templates could not load", description = "Check your connection and try again.", onRetry = {}, modifier = Modifier.height(StanceSpacing.space24 * 3))
}

@Composable
fun StancePullToRefreshExample() {
    var refreshing by remember { mutableStateOf(false) }
    StancePullToRefresh(refreshing, onRefresh = { refreshing = false }) {
        Column { StanceListItem("Sales team signature") }
    }
}

@Composable
fun StanceSwipeActionsExample() {
    StanceSwipeActions(endAction = StanceSwipeAction("Delete", StanceIcons.Trash, StanceTone.Danger) {}) {
        StanceListItem("Sales team signature", supporting = "Swipe to delete")
    }
}

@Composable
fun StanceSearchableListExample() {
    val people = listOf("Amara Okafor", "Lukas Brenner", "Priya Nair")
    StanceSearchableList(
        items = people,
        matches = { person, query -> person.contains(query, ignoreCase = true) },
        placeholder = "Search users",
        modifier = Modifier.height(StanceSpacing.space24 * 3),
    ) { person ->
        StanceListItem(person, leading = { StanceAvatar(person) })
    }
}

@Composable
fun StanceFilterBarExample() {
    var selected by remember { mutableStateOf(setOf("signed")) }
    StanceFilterBar(
        filters = listOf("signed" to "Signed", "pending" to "Pending", "draft" to "Draft").map { (id, label) -> StanceFilter(id, label, id in selected) },
        onToggle = { id -> selected = if (id in selected) selected - id else selected + id },
        onClearAll = { selected = emptySet() },
    )
}

@Composable
fun StanceSignatureCanvasExample() {
    val signature = rememberStanceSignatureState()
    StanceSignatureCanvas(signature, label = "Signature")
}

@Composable
fun StancePhotoPickerExample() {
    val picker = rememberStancePhotoPicker { uris -> println("Picked ${uris.size} image") }
    StanceButton("Choose logo", onClick = { picker.launch() }, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.Image)
}

@Composable
fun StanceDocumentPickerExample() {
    val picker = rememberStanceDocumentPicker(arrayOf("application/pdf")) { uris -> println("Picked ${uris.size} file") }
    StanceButton("Attach PDF", onClick = { picker.launch() }, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.Upload)
}

@Composable
fun StanceButtonViewExample() {
    // In a View-based screen, use StanceButtonView in XML or code.
    AndroidView(factory = { context -> StanceButtonView(context).apply { text = "Save template" } })
}

@Composable
fun StanceComposeViewExample() {
    val context = LocalContext.current
    // Hosts Stance content inside an existing View hierarchy.
    AndroidView(factory = { ComposeView(context).apply { setStanceContent { StanceBadge("Live", tone = StanceTone.Success) } } })
}
