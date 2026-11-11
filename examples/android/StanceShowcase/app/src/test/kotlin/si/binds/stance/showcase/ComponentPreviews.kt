package si.binds.stance.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.viewinterop.AndroidView
import com.bindshq.stance.interop.StanceButtonView
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.longClick
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performTouchInput
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonGroup
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.actions.StanceDropdownMenu
import com.bindshq.stance.components.actions.StanceFloatingActionButton
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.actions.StanceIconButtonVariant
import com.bindshq.stance.components.actions.StanceMenuItem
import com.bindshq.stance.components.actions.StanceSplitButton
import com.bindshq.stance.components.advanced.StanceFilter
import com.bindshq.stance.components.advanced.StanceFilterBar
import com.bindshq.stance.components.advanced.StancePullToRefresh
import com.bindshq.stance.components.advanced.StanceSearchableList
import com.bindshq.stance.components.advanced.StanceSignatureCanvas
import com.bindshq.stance.components.advanced.StanceSwipeAction
import com.bindshq.stance.components.advanced.StanceSwipeActions
import com.bindshq.stance.components.advanced.rememberStanceSignatureState
import com.bindshq.stance.components.data.StanceAvatar
import com.bindshq.stance.components.data.StanceAvatarGroup
import com.bindshq.stance.components.data.StanceAvatarSize
import com.bindshq.stance.components.data.StanceBadge
import com.bindshq.stance.components.data.StanceBadgeVariant
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
import com.bindshq.stance.components.navigation.StanceTopAppBarStyle
import com.bindshq.stance.foundation.StanceAdaptiveGrid
import com.bindshq.stance.foundation.StanceCard
import com.bindshq.stance.foundation.StanceCardVariant
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.StanceScaffold
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** How a preview is framed. */
enum class PreviewFrame {
    /** Padded 360dp column that is as tall as its content. */
    Inline,

    /** A 408 by 560dp screen, for dialogs, menus and sheets shown open. */
    Overlay,

    /** A phone screen, 411 by 891dp, for components that own the whole screen. */
    Phone,

    /** A wide screen, 840 by 560dp, for components that only appear on large windows. */
    Wide,
}

/**
 * The composition used for a component's documentation image.
 *
 * @param prepare Runs after composition, for states that need input (for example a long press).
 * @param height Screen height for overlay frames, sized to the open component.
 */
class ComponentPreview(
    val frame: PreviewFrame = PreviewFrame.Inline,
    val prepare: ((ComposeContentTestRule) -> Unit)? = null,
    /** Height of an [PreviewFrame.Overlay] screen in dp. */
    val height: Int = 560,
    val content: @Composable () -> Unit,
)

private val gap = Arrangement.spacedBy(StanceSpacing.space3)
private val rowGap = Arrangement.spacedBy(StanceSpacing.space2)

private val destinations = listOf(
    StanceNavigationItem("Templates", StanceIcons.FileText),
    StanceNavigationItem("Users", StanceIcons.Users, badge = "3"),
    StanceNavigationItem("Settings", StanceIcons.Settings),
)

private const val NOVEMBER_20_2026 = 1_795_219_200_000L
private const val NOVEMBER_27_2026 = 1_795_824_000_000L

@Composable
private fun TemplateRows() {
    Column {
        StanceListItem("Sales team signature", supporting = "48 users", leading = { StanceAvatar("Sales Team") }, trailing = { StanceBadge("Live", tone = StanceTone.Success) })
        StanceDivider()
        StanceListItem("Legal disclaimer", supporting = "12 users", leading = { StanceAvatar("Legal Disclaimer") }, trailing = { StanceBadge("Pending", tone = StanceTone.Warning) })
        StanceDivider()
        StanceListItem("Support team", supporting = "Draft", leading = { StanceAvatar("Support Team") }, trailing = { StanceBadge("Draft") })
    }
}

@Composable
private fun Caption(text: String) {
    Text(text, style = StanceTheme.typography.caption, color = StanceTheme.colors.fgMuted)
}

private object KeyboardInputMode : InputModeManager {
    override val inputMode: InputMode = InputMode.Keyboard

    override fun requestInputMode(inputMode: InputMode): Boolean = inputMode == InputMode.Keyboard
}

@Composable
private fun FocusRingPreview(focus: FocusRequester) {
    Column(verticalArrangement = gap) {
        StanceSurface(modifier = Modifier.focusRequester(focus).stanceFocusRing(StanceTheme.shapes.large), onClick = {}, bordered = true) {
            Text("Focused with a keyboard", modifier = Modifier.padding(StanceSpacing.space4))
        }
        StanceSurface(modifier = Modifier.stanceFocusRing(StanceTheme.shapes.large), onClick = {}, bordered = true) {
            Text("Not focused", modifier = Modifier.padding(StanceSpacing.space4))
        }
    }
}

/** Every visual component, keyed by its name in components.json. */
@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
val componentPreviews: Map<String, ComponentPreview> = mapOf(
    "StanceTheme" to ComponentPreview {
        val c = StanceTheme.colors
        StanceCard {
            Text("Theme: ${StanceTheme.tokens.name}", style = StanceTheme.typography.title)
            Text("Ivory and indigo, mapped to every role.", style = StanceTheme.typography.bodySmall, color = c.fgMuted)
            Row(horizontalArrangement = rowGap, modifier = Modifier.padding(vertical = StanceSpacing.space3)) {
                listOf(c.bgCanvas, c.bgMuted, c.borderControl, c.fgMuted, c.fgDefault, c.dangerSolid, c.successSolid).forEach { colour ->
                    StanceSurface(color = colour, bordered = true, shape = StanceTheme.shapes.small, modifier = Modifier.size(StanceSizes.controlMedium)) {}
                }
            }
            Row(horizontalArrangement = rowGap) {
                StanceButton("Deploy", onClick = {})
                StanceButton("Preview", onClick = {}, variant = StanceButtonVariant.Outline)
            }
        }
    },
    "StanceSurface" to ComponentPreview {
        Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space5), modifier = Modifier.padding(StanceSpacing.space2)) {
            listOf("Flat" to StanceTheme.elevation.none, "Raised" to StanceTheme.elevation.md, "Overlay" to StanceTheme.elevation.xl).forEach { (name, level) ->
                StanceSurface(elevation = level, bordered = true, modifier = Modifier.size(width = StanceSpacing.space24, height = StanceSpacing.space16)) {
                    Box(contentAlignment = Alignment.Center) { Text(name, style = StanceTheme.typography.label) }
                }
            }
        }
    },
    "StanceCard" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceCardVariant.entries.forEach { variant ->
                StanceCard(variant = variant, modifier = Modifier.fillMaxWidth()) {
                    Text("Sales team signature", style = StanceTheme.typography.title)
                    Text("${variant.name} card. Deployed to 48 users.", style = StanceTheme.typography.bodySmall, color = StanceTheme.colors.fgMuted)
                }
            }
        }
    },
    "StanceDivider" to ComponentPreview {
        StanceCard(modifier = Modifier.fillMaxWidth()) {
            Text("Details", style = StanceTheme.typography.title)
            StanceDivider(modifier = Modifier.padding(vertical = StanceSpacing.space3))
            Text("Rollout", style = StanceTheme.typography.title)
            StanceDivider(modifier = Modifier.padding(vertical = StanceSpacing.space3))
            Text("History", style = StanceTheme.typography.title)
        }
    },
    "StanceScaffold" to ComponentPreview(PreviewFrame.Phone) {
        StanceScaffold(
            topBar = { StanceTopAppBar("Templates") { StanceIconButton(StanceIcons.Search, "Search", onClick = {}) } },
            bottomBar = { StanceNavigationBar(destinations, 0, onSelect = {}) },
            floatingActionButton = { StanceFloatingActionButton(StanceIcons.Plus, "New template", onClick = {}, text = "New template") },
        ) { padding ->
            Column(Modifier.padding(padding).padding(StanceSpacing.space4)) { StanceCard(Modifier.fillMaxWidth()) { TemplateRows() } }
        }
    },
    "StanceAdaptiveGrid" to ComponentPreview {
        StanceAdaptiveGrid(minColumnWidth = StanceSpacing.space32, modifier = Modifier.height(StanceSpacing.space20 * 2), contentPadding = androidx.compose.foundation.layout.PaddingValues(StanceSpacing.none)) {
            items(listOf("Sales" to "48", "Legal" to "12", "Finance" to "9", "Support" to "31")) { (team, users) ->
                StanceCard {
                    Text(team, style = StanceTheme.typography.title)
                    Text("$users users", style = StanceTheme.typography.bodySmall, color = StanceTheme.colors.fgMuted)
                }
            }
        }
    },
    "StanceIcon" to ComponentPreview {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space4), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space4)) {
            StanceIcons.all.take(32).forEach { (_, icon) -> StanceIcon(icon, contentDescription = null, size = StanceSizes.iconLarge) }
        }
    },
    "stanceFocusRing" to ComponentPreview {
        val focus = remember { FocusRequester() }
        LaunchedEffect(Unit) { focus.requestFocus() }
        // Focus rings appear for keyboard and D-pad focus, so render in keyboard input mode.
        CompositionLocalProvider(LocalInputModeManager provides KeyboardInputMode) {
            FocusRingPreview(focus)
        }
    },
    "StanceButton" to ComponentPreview {
        Column(verticalArrangement = gap) {
            FlowRow(horizontalArrangement = rowGap, verticalArrangement = rowGap) {
                StanceButton("Save template", onClick = {}, leadingIcon = StanceIcons.Check)
                StanceButton("Secondary", onClick = {}, variant = StanceButtonVariant.Secondary)
                StanceButton("Preview", onClick = {}, variant = StanceButtonVariant.Outline)
                StanceButton("Cancel", onClick = {}, variant = StanceButtonVariant.Ghost)
                StanceButton("Delete", onClick = {}, variant = StanceButtonVariant.Danger)
                StanceButton("Learn more", onClick = {}, variant = StanceButtonVariant.Link)
            }
            Row(horizontalArrangement = rowGap, verticalAlignment = Alignment.CenterVertically) {
                StanceButton("Small", onClick = {}, size = StanceButtonSize.Small)
                StanceButton("Medium", onClick = {})
                StanceButton("Large", onClick = {}, size = StanceButtonSize.Large)
            }
            Row(horizontalArrangement = rowGap) {
                StanceButton("Deploying", onClick = {}, loading = true)
                StanceButton("Disabled", onClick = {}, enabled = false)
            }
            StanceButton("Continue", onClick = {}, fullWidth = true, trailingIcon = StanceIcons.ArrowRight)
        }
    },
    "StanceIconButton" to ComponentPreview {
        Row(horizontalArrangement = rowGap) {
            StanceIconButton(StanceIcons.Pencil, "Edit template", onClick = {})
            StanceIconButton(StanceIcons.Copy, "Duplicate template", onClick = {}, variant = StanceIconButtonVariant.Outline)
            StanceIconButton(StanceIcons.Send, "Deploy template", onClick = {}, variant = StanceIconButtonVariant.Filled)
            StanceIconButton(StanceIcons.Trash, "Delete template", onClick = {}, enabled = false)
        }
    },
    "StanceFloatingActionButton" to ComponentPreview {
        Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space4), verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(StanceSpacing.space2)) {
            StanceFloatingActionButton(StanceIcons.Plus, "New template", onClick = {})
            StanceFloatingActionButton(StanceIcons.Plus, "New template", onClick = {}, text = "New template")
        }
    },
    "StanceButtonGroup" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceButtonGroup(listOf("Day", "Week", "Month"), 1, onSelect = {})
            StanceButtonGroup(listOf("Details", "Rollout"), 0, onSelect = {})
        }
    },
    "StanceSplitButton" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceSplitButton("Save", onClick = {}, menuItems = listOf(StanceMenuItem("Save as draft", {})), menuDescription = "More save options")
            StanceSplitButton("Export", onClick = {}, menuItems = listOf(StanceMenuItem("Export as PDF", {})), menuDescription = "More export options", variant = StanceButtonVariant.Outline)
        }
    },
    "StanceDropdownMenu" to ComponentPreview(PreviewFrame.Overlay, height = 400) {
        Box(Modifier.fillMaxSize().padding(StanceSpacing.space6)) {
            Box {
                StanceIconButton(StanceIcons.MoreVertical, "Template actions", onClick = {}, variant = StanceIconButtonVariant.Outline)
                StanceDropdownMenu(
                    expanded = true,
                    onDismissRequest = {},
                    items = listOf(
                        StanceMenuItem("Edit", onClick = {}, icon = StanceIcons.Pencil),
                        StanceMenuItem("Duplicate", onClick = {}, icon = StanceIcons.Copy),
                        StanceMenuItem("Archive", onClick = {}, icon = StanceIcons.Inbox, enabled = false),
                        StanceMenuItem("Delete", onClick = {}, icon = StanceIcons.Trash, destructive = true, startsGroup = true),
                    ),
                )
            }
        }
    },
    "StanceFormField" to ComponentPreview {
        Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space5)) {
            StanceFormField(label = "Signature", helper = "Draw with your finger or a stylus.", required = true) {
                StanceSurface(bordered = true, modifier = Modifier.fillMaxWidth().height(StanceSpacing.space16)) {
                    Box(contentAlignment = Alignment.Center) { Text("Your control", style = StanceTheme.typography.bodySmall, color = StanceTheme.colors.fgSubtle) }
                }
            }
            StanceFormField(label = "Logo", error = "Choose a PNG or SVG file") {
                StanceButton("Choose file", onClick = {}, variant = StanceButtonVariant.Outline, leadingIcon = StanceIcons.Upload)
            }
        }
    },
    "StanceTextField" to ComponentPreview {
        Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space4)) {
            StanceTextField("Sales team signature", {}, label = "Template name", helper = "Visible to your organisation.", required = true)
            StanceTextField("priya@binds", {}, label = "Work email", error = "Enter a valid email address", leadingIcon = StanceIcons.Mail)
            StanceTextField("binds.si", {}, label = "Domain", prefix = "https://", enabled = false)
        }
    },
    "StancePasswordField" to ComponentPreview {
        Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space4)) {
            StancePasswordField("correct horse", {}, label = "Password")
            StancePasswordField("short", {}, label = "New password", error = "Use at least 12 characters")
        }
    },
    "StanceSearchBar" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceSearchBar("", {}, placeholder = "Search templates")
            StanceSearchBar("sales team", {}, placeholder = "Search templates")
        }
    },
    "StanceCheckbox" to ComponentPreview {
        Column {
            StanceCheckbox("Send me a copy", true, {}, description = "A PDF is emailed after signing.")
            StanceCheckbox("Notify the sender", false, {})
            StanceCheckbox("All recipients", ToggleableState.Indeterminate, onClick = {})
            StanceCheckbox("Require a witness", false, {}, enabled = false)
        }
    },
    "StanceRadioGroup" to ComponentPreview {
        StanceRadioGroup(
            label = "Role",
            options = listOf(
                StanceRadioOption("viewer", "Viewer", "Can see templates"),
                StanceRadioOption("editor", "Editor", "Can change templates"),
                StanceRadioOption("owner", "Owner", "Managed by Binds", enabled = false),
            ),
            selected = "editor",
            onSelect = {},
        )
    },
    "StanceSwitch" to ComponentPreview {
        Column {
            StanceSwitch("Apply to new members automatically", true, {})
            StanceSwitch("Show company logo", false, {}, description = "Adds the logo above the signature.")
            StanceSwitch("Legal disclaimer", true, {}, enabled = false)
        }
    },
    "StanceSlider" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceSlider("Rollout", 40f, {}, valueRange = 0f..100f, valueText = "40%")
            StanceSlider("Logo size", 3f, {}, valueRange = 1f..5f, steps = 3, valueText = "Large")
            StanceSlider("Locked", 70f, {}, valueRange = 0f..100f, valueText = "70%", enabled = false)
        }
    },
    "StanceRangeSlider" to ComponentPreview {
        StanceRangeSlider("Team size", 20f..80f, {}, valueRange = 0f..100f, valueText = "20 to 80")
    },
    "StanceSelect" to ComponentPreview {
        Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space4)) {
            val roles = listOf(StanceSelectOption("admin", "Administrator"), StanceSelectOption("member", "Member"))
            StanceSelect("Role", roles, selected = "admin", onSelect = {}, helper = "Controls what this member can change.")
            StanceSelect("Department", emptyList<StanceSelectOption<String>>(), selected = null, onSelect = {}, error = "Choose a department", required = true)
        }
    },
    "StanceDatePicker" to ComponentPreview(PreviewFrame.Phone, prepare = { it.onNodeWithContentDescription("Signing deadline").performTouchInput { click() } }) {
        Column(Modifier.padding(StanceSpacing.space6)) {
            StanceDatePicker("Signing deadline", NOVEMBER_20_2026, onDateSelected = {}, locale = java.util.Locale.UK)
        }
    },
    "StanceDateRangePicker" to ComponentPreview(PreviewFrame.Phone, prepare = { it.onNodeWithContentDescription("Deployment window").performTouchInput { click() } }) {
        Column(Modifier.padding(StanceSpacing.space6)) {
            StanceDateRangePicker("Deployment window", NOVEMBER_20_2026, NOVEMBER_27_2026, onRangeSelected = { _, _ -> }, locale = java.util.Locale.UK)
        }
    },
    "StanceTimePicker" to ComponentPreview(PreviewFrame.Phone, prepare = { it.onNodeWithContentDescription("Reminder").performTouchInput { click() } }) {
        Column(Modifier.padding(StanceSpacing.space6)) { StanceTimePicker("Reminder", 9, 30, onTimeSelected = { _, _ -> }) }
    },
    "StanceFilterChip" to ComponentPreview {
        FlowRow(horizontalArrangement = rowGap) {
            StanceFilterChip("Signed", true, onClick = {})
            StanceFilterChip("Pending", false, onClick = {})
            StanceFilterChip("Draft", false, onClick = {}, leadingIcon = StanceIcons.FileText)
            StanceFilterChip("Archived", false, onClick = {}, enabled = false)
        }
    },
    "StanceInputChip" to ComponentPreview {
        FlowRow(horizontalArrangement = rowGap) {
            StanceInputChip("Priya Nair", onRemove = {}, removeDescription = "Remove Priya Nair")
            StanceInputChip("Lukas Brenner", onRemove = {}, removeDescription = "Remove Lukas Brenner")
            StanceInputChip("Hana Sato", onRemove = {}, removeDescription = "Remove Hana Sato")
        }
    },
    "StanceNavigationBar" to ComponentPreview { StanceNavigationBar(destinations, 0, onSelect = {}) },
    "StanceNavigationRail" to ComponentPreview(PreviewFrame.Phone) {
        Row(Modifier.fillMaxSize()) {
            StanceNavigationRail(destinations, 0, onSelect = {}, header = { StanceFloatingActionButton(StanceIcons.Plus, "New template", onClick = {}) })
            StanceScaffold(topBar = { StanceTopAppBar("Templates") }) { padding ->
                Column(Modifier.padding(padding).padding(StanceSpacing.space4)) { StanceCard(Modifier.fillMaxWidth()) { TemplateRows() } }
            }
        }
    },
    "StanceNavigationDrawer" to ComponentPreview(PreviewFrame.Wide) {
        StanceNavigationDrawer(destinations, 0, onSelect = {}, header = { Text("Stance", style = StanceTheme.typography.headingSmall, modifier = Modifier.padding(StanceSpacing.space4)) }) {
            StanceScaffold(topBar = { StanceTopAppBar("Templates") }) { padding ->
                Column(Modifier.padding(padding).padding(StanceSpacing.space4)) { StanceCard(Modifier.fillMaxWidth()) { TemplateRows() } }
            }
        }
    },
    "StanceAdaptiveNavigation" to ComponentPreview(PreviewFrame.Phone) {
        StanceAdaptiveNavigation(destinations, 0, onSelect = {}, windowWidth = StanceWindowWidth.Compact, topBar = { StanceTopAppBar("Templates") }) { padding ->
            Column(Modifier.padding(padding).padding(StanceSpacing.space4), verticalArrangement = gap) {
                StanceInlineAlert("A bottom bar on phones, a rail on tablets and a drawer on wide windows.", tone = StanceTone.Info)
                StanceCard(Modifier.fillMaxWidth()) { TemplateRows() }
            }
        }
    },
    "StanceTopAppBar" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceSurface(bordered = true) {
                StanceTopAppBar("Signature templates", onNavigateUp = {}) {
                    StanceIconButton(StanceIcons.Search, "Search", onClick = {})
                    StanceIconButton(StanceIcons.MoreVertical, "More", onClick = {})
                }
            }
            StanceSurface(bordered = true) { StanceTopAppBar("Templates", style = StanceTopAppBarStyle.CenterAligned) }
            StanceSurface(bordered = true) { StanceTopAppBar("Organisation users", style = StanceTopAppBarStyle.Large, onNavigateUp = {}) }
        }
    },
    "StanceTabs" to ComponentPreview {
        Column {
            StanceTabs(listOf("Details", "Rollout", "History"), 0, onSelect = {})
            Text("Template details", style = StanceTheme.typography.bodySmall, color = StanceTheme.colors.fgMuted, modifier = Modifier.padding(StanceSpacing.space4))
        }
    },
    "StancePagerIndicator" to ComponentPreview {
        StanceCard(modifier = Modifier.fillMaxWidth()) {
            Text("Welcome to eSignify", style = StanceTheme.typography.title)
            Text("Step 2 of 4: connect your mailbox.", style = StanceTheme.typography.bodySmall, color = StanceTheme.colors.fgMuted)
            Box(Modifier.fillMaxWidth().padding(top = StanceSpacing.space4), contentAlignment = Alignment.Center) { StancePagerIndicator(pageCount = 4, currentPage = 1) }
        }
    },
    "StanceStepper" to ComponentPreview { StanceStepper(listOf("Template", "Recipients", "Review", "Deploy"), currentStep = 2, errorSteps = setOf(1)) },
    "StanceListItem" to ComponentPreview { StanceCard(Modifier.fillMaxWidth(), contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = StanceSpacing.space1)) { TemplateRows() } },
    "StanceBadge" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceBadgeVariant.entries.forEach { variant ->
                Row(horizontalArrangement = rowGap) {
                    StanceBadge("Draft", variant = variant)
                    StanceBadge("Live", tone = StanceTone.Success, variant = variant)
                    StanceBadge("Pending", tone = StanceTone.Warning, variant = variant)
                    StanceBadge("Failed", tone = StanceTone.Danger, variant = variant)
                }
            }
        }
    },
    "StanceTag" to ComponentPreview {
        FlowRow(horizontalArrangement = rowGap) {
            StanceTag("Legal", icon = StanceIcons.Tag)
            StanceTag("Sales")
            StanceTag("Finance")
            StanceTag("Contracts", icon = StanceIcons.FileText)
        }
    },
    "StanceAvatar" to ComponentPreview {
        Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3), verticalAlignment = Alignment.CenterVertically) {
            StanceAvatar("Amara Okafor", size = StanceAvatarSize.Small)
            StanceAvatar("Lukas Brenner")
            StanceAvatar("Priya Nair", size = StanceAvatarSize.Large)
        }
    },
    "StanceAvatarGroup" to ComponentPreview {
        StanceAvatarGroup(listOf("Amara Okafor", "Lukas Brenner", "Priya Nair", "Hana Sato", "Owen Price"), max = 3)
    },
    "StanceProgressIndicator" to ComponentPreview {
        Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space4)) {
            StanceProgressIndicator(0.72f, label = "Rollout")
            StanceProgressIndicator(1f, label = "Mailboxes updated", tone = StanceTone.Success)
            StanceProgressIndicator(0.2f, label = "Failed deliveries", tone = StanceTone.Danger)
        }
    },
    "StanceCircularProgressIndicator" to ComponentPreview {
        Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space6), verticalAlignment = Alignment.CenterVertically) {
            StanceCircularProgressIndicator("Rollout, 72%", progress = 0.72f)
            StanceCircularProgressIndicator("Rollout, 30%", progress = 0.3f, size = StanceSizes.controlLarge)
            Caption("Determinate progress")
        }
    },
    "StanceSkeleton" to ComponentPreview {
        StanceCard(modifier = Modifier.fillMaxWidth()) {
            Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3), verticalAlignment = Alignment.CenterVertically) {
                StanceSkeleton(width = StanceSizes.controlMedium, height = StanceSizes.controlMedium, circle = true)
                Column(verticalArrangement = rowGap) {
                    StanceSkeleton(width = StanceSpacing.space32)
                    StanceSkeleton(width = StanceSpacing.space20, height = StanceSpacing.space3)
                }
            }
            Column(verticalArrangement = rowGap, modifier = Modifier.padding(top = StanceSpacing.space4)) {
                StanceSkeleton()
                StanceSkeleton()
                StanceSkeleton(width = StanceSpacing.space32)
            }
        }
    },
    "StanceEmptyState" to ComponentPreview {
        StanceEmptyState("No templates yet", description = "Create your first signature template to deploy it to your team.") {
            StanceButton("Create template", onClick = {}, leadingIcon = StanceIcons.Plus)
        }
    },
    "StanceTimeline" to ComponentPreview {
        StanceTimeline(
            listOf(
                StanceTimelineEvent("Deployed", "Today, 10:42", "35 of 48 mailboxes updated", StanceTone.Success),
                StanceTimelineEvent("Relay warning", "Today, 10:40", "13 mailboxes are waiting", StanceTone.Warning),
                StanceTimelineEvent("Template edited", "Yesterday, 16:05", "By Priya Nair"),
            ),
        )
    },
    "StanceStatCard" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceStatCard("Signatures deployed", "1,284", change = "12%", changeDescription = "up 12% from last month", positive = true, icon = StanceIcons.Send, modifier = Modifier.fillMaxWidth())
            StanceStatCard("Failed deliveries", "13", change = "4%", changeDescription = "up 4% from last month", positive = false, icon = StanceIcons.AlertTriangle, modifier = Modifier.fillMaxWidth())
        }
    },
    "StanceDescriptionList" to ComponentPreview {
        StanceCard(Modifier.fillMaxWidth()) { StanceDescriptionList(listOf("Owner" to "Priya Nair", "Status" to "Live", "Users" to "48", "Last deployed" to "Today, 10:42")) }
    },
    "StanceDataTable" to ComponentPreview {
        data class User(val name: String, val team: String, val deployments: Int)
        StanceSurface(bordered = true) {
            StanceDataTable(
                columns = listOf(
                    StanceTableColumn<User>("Name", width = StanceSpacing.space32) { it.name },
                    StanceTableColumn("Team", width = StanceSpacing.space24) { it.team },
                    StanceTableColumn("Deployments", width = StanceSpacing.space32, numeric = true) { it.deployments.toString() },
                ),
                rows = listOf(User("Priya Nair", "Sales", 14), User("Hana Sato", "Finance", 9), User("Amara Okafor", "Legal", 6)),
                caption = "Organisation users",
            )
        }
    },
    "StanceSnackbarHost" to ComponentPreview {
        val host = remember { SnackbarHostState() }
        LaunchedEffect(Unit) { host.showStanceSnackbar("Template saved", StanceTone.Neutral, actionLabel = "Undo") }
        StanceSnackbarHost(host)
    },
    // A text field inside a dialog window keeps the renderer busy, so this shows a choice instead.
    "StanceDialog" to ComponentPreview(PreviewFrame.Overlay, height = 440) {
        StanceDialog(
            title = "Who can edit this template?",
            onDismissRequest = {},
            actions = {
                StanceButton("Cancel", onClick = {}, variant = StanceButtonVariant.Ghost)
                StanceButton("Save", onClick = {})
            },
        ) {
            StanceRadioGroup(
                label = "Access",
                options = listOf(
                    StanceRadioOption("owner", "Only me"),
                    StanceRadioOption("team", "Sales team", "12 members"),
                    StanceRadioOption("org", "Everyone at Binds"),
                ),
                selected = "team",
                onSelect = {},
            )
        }
    },
    "StanceAlertDialog" to ComponentPreview(PreviewFrame.Overlay, height = 360) {
        StanceAlertDialog(
            title = "Delete this template?",
            message = "48 users will lose this signature. This cannot be undone.",
            confirmLabel = "Delete template",
            onConfirm = {},
            onDismissRequest = {},
            destructive = true,
        )
    },
    "StanceBottomSheet" to ComponentPreview(PreviewFrame.Overlay, height = 480) {
        StanceBottomSheet(onDismissRequest = {}, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), title = "Share template") {
            StanceListItem("Copy link", leading = { StanceIcon(StanceIcons.Link, null) }, onClick = {})
            StanceListItem("Send by email", leading = { StanceIcon(StanceIcons.Mail, null) }, onClick = {})
            StanceListItem("Download as PDF", leading = { StanceIcon(StanceIcons.Download, null) }, onClick = {})
        }
    },
    "StanceTooltip" to ComponentPreview(PreviewFrame.Overlay, height = 200, prepare = { it.onNodeWithContentDescription("Copy signature").performTouchInput { longClick() } }) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            StanceTooltip("Copy signature") { StanceIconButton(StanceIcons.Copy, "Copy signature", onClick = {}, variant = StanceIconButtonVariant.Outline) }
        }
    },
    "StanceInlineAlert" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceInlineAlert("Signatures deploy to new members automatically.", tone = StanceTone.Info)
            StanceInlineAlert("All 48 mailboxes are up to date.", tone = StanceTone.Success, title = "Deployment complete")
            StanceInlineAlert("13 mailboxes could not be updated.", tone = StanceTone.Warning, title = "Deployment incomplete")
            StanceInlineAlert("Exchange relay rejected the request.", tone = StanceTone.Danger, onDismiss = {})
        }
    },
    "StanceBanner" to ComponentPreview {
        Column(verticalArrangement = gap) {
            StanceBanner("Scheduled maintenance on Saturday from 22:00.", tone = StanceTone.Info, onDismiss = {})
            StanceBanner("Your plan expires tomorrow.", tone = StanceTone.Warning, title = "Action needed")
        }
    },
    "StanceLoadingOverlay" to ComponentPreview {
        StanceLoadingOverlay(visible = true, message = "Deploying signature") {
            StanceCard(modifier = Modifier.fillMaxWidth()) {
                Text("Sales team signature", style = StanceTheme.typography.title)
                StanceTextField("Sales team signature", {}, label = "Template name", modifier = Modifier.padding(top = StanceSpacing.space3))
            }
        }
    },
    "StanceErrorState" to ComponentPreview {
        StanceErrorState("Templates could not load", description = "Check your connection and try again.", onRetry = {}, modifier = Modifier.height(StanceSpacing.space32 * 2))
    },
    "StancePullToRefresh" to ComponentPreview {
        StancePullToRefresh(refreshing = true, onRefresh = {}, modifier = Modifier.height(StanceSpacing.space32 * 2)) {
            LazyColumn(Modifier.fillMaxSize()) { item { TemplateRows() } }
        }
    },
    "StanceSwipeActions" to ComponentPreview {
        StanceSurface(bordered = true) {
            Column {
                StanceSwipeActions(endAction = StanceSwipeAction("Delete", StanceIcons.Trash, StanceTone.Danger) {}) {
                    StanceListItem("Sales team signature", supporting = "Swipe from the end to delete", trailing = { StanceIcon(StanceIcons.ChevronLeft, null) })
                }
                StanceDivider()
                StanceSwipeActions(startAction = StanceSwipeAction("Archive", StanceIcons.Inbox, StanceTone.Neutral) {}) {
                    StanceListItem("Legal disclaimer", supporting = "Swipe from the start to archive", leading = { StanceIcon(StanceIcons.ChevronRight, null) })
                }
            }
        }
    },
    "StanceSearchableList" to ComponentPreview {
        val people = listOf("Amara Okafor", "Lukas Brenner", "Priya Nair")
        StanceSearchableList(people, matches = { person, query -> person.contains(query, ignoreCase = true) }, placeholder = "Search users", modifier = Modifier.height(StanceSpacing.space32 * 2)) { person ->
            StanceListItem(person, leading = { StanceAvatar(person) })
        }
    },
    "StanceFilterBar" to ComponentPreview {
        StanceFilterBar(
            filters = listOf(StanceFilter("signed", "Signed", true), StanceFilter("pending", "Pending", false), StanceFilter("draft", "Draft", false)),
            onToggle = {},
            onClearAll = {},
        )
    },
    "StanceSignatureCanvas" to ComponentPreview {
        val signature = rememberStanceSignatureState()
        LaunchedEffect(Unit) {
            val points = (0..60).map { i ->
                val x = 120f + i * 8f
                val y = 150f + (kotlin.math.sin(i / 4.0) * 46 * (1 - i / 90.0)).toFloat() - if (i in 18..26) 40f else 0f
                Offset(x, y)
            }
            signature.addStroke(points)
            signature.addStroke(listOf(Offset(150f, 230f), Offset(560f, 214f)))
        }
        StanceSignatureCanvas(signature, label = "Signature")
    },
    "StanceButtonView" to ComponentPreview {
        Column(verticalArrangement = gap) {
            Caption("Stance buttons hosted in Android Views")
            Row(horizontalArrangement = rowGap) {
                AndroidView(factory = { context -> StanceButtonView(context).apply { text = "Save template" } })
                AndroidView(factory = { context ->
                    StanceButtonView(context).apply {
                        text = "Preview"
                        variant = StanceButtonVariant.Outline
                    }
                })
            }
            AndroidView(factory = { context ->
                StanceButtonView(context).apply {
                    text = "Deploying"
                    loading = true
                }
            })
        }
    },
)

/** Entries in components.json that draw nothing on their own. */
val nonVisualComponents = setOf("rememberStancePhotoPicker", "rememberStanceDocumentPicker", "setStanceContent")
