package si.binds.stance.showcase

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonGroup
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.data.StanceAvatarGroup
import com.bindshq.stance.components.data.StanceBadge
import com.bindshq.stance.components.data.StanceListItem
import com.bindshq.stance.components.data.StanceProgressIndicator
import com.bindshq.stance.components.feedback.StanceBottomSheet
import com.bindshq.stance.components.feedback.StanceInlineAlert
import com.bindshq.stance.components.feedback.showStanceSnackbar
import com.bindshq.stance.components.forms.StanceSelect
import com.bindshq.stance.components.forms.StanceSelectOption
import com.bindshq.stance.components.forms.StanceSwitch
import com.bindshq.stance.components.forms.StanceTextField
import com.bindshq.stance.foundation.StanceCard
import com.bindshq.stance.foundation.StanceCardVariant
import com.bindshq.stance.foundation.StanceDivider
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceAppearance
import com.bindshq.stance.theme.StanceElevationLevel
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import kotlinx.coroutines.launch

@Composable
private fun SectionTitle(text: String) {
    Text(text, style = StanceTheme.typography.headingSmall, modifier = Modifier.padding(top = StanceSpacing.space4).semantics { heading() })
}

@Composable
private fun Page(padding: PaddingValues, content: @Composable () -> Unit) {
    // Content keeps a readable measure on tablets and unfolded devices instead of stretching.
    Box(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(padding),
        contentAlignment = Alignment.TopCenter,
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = StanceSizes.contentMaxWidth)
                .fillMaxWidth()
                .padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space2),
            verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
        ) { content() }
    }
}

// ───────────── Foundations ─────────────

@Composable
private fun Swatch(name: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
        Box(
            Modifier
                .size(StanceSizes.controlMedium)
                .clip(StanceTheme.shapes.small)
                .background(color)
                .border(StanceSpacing.hairline, StanceTheme.colors.borderStrong, StanceTheme.shapes.small),
        )
        Text(name, style = StanceTheme.typography.bodySmall)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FoundationsScreen(padding: PaddingValues) {
    val c = StanceTheme.colors
    val type = StanceTheme.typography
    Page(padding) {
        Text("Theme: ${StanceTheme.tokens.name}", style = type.label, color = c.fgMuted)

        SectionTitle("Colour")
        val swatches = listOf(
            "bgCanvas" to c.bgCanvas, "bgSurface" to c.bgSurface, "bgMuted" to c.bgMuted, "fgDefault" to c.fgDefault,
            "fgMuted" to c.fgMuted, "accentBg" to c.accentBg, "borderControl" to c.borderControl, "dangerSolid" to c.dangerSolid,
            "successSolid" to c.successSolid, "warningSolid" to c.warningSolid,
        )
        FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space4), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            swatches.forEach { (name, color) -> Box(Modifier.width(StanceSizes.tableColumnWidth)) { Swatch(name, color) } }
        }

        SectionTitle("Typography")
        val styles: List<Pair<String, TextStyle>> = listOf(
            "Display" to type.display, "Heading large" to type.headingLarge, "Heading medium" to type.headingMedium,
            "Heading small" to type.headingSmall, "Title" to type.title, "Body" to type.body, "Body small" to type.bodySmall,
            "Label" to type.label, "Caption" to type.caption, "Code" to type.code,
        )
        styles.forEach { (name, style) -> Text(name, style = style) }

        SectionTitle("Spacing")
        listOf("space1" to StanceSpacing.space1, "space2" to StanceSpacing.space2, "space4" to StanceSpacing.space4, "space8" to StanceSpacing.space8, "space16" to StanceSpacing.space16).forEach { (name, size) ->
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
                Text("$name, ${size.value.toInt()}dp", style = type.caption, modifier = Modifier.width(StanceSpacing.space24))
                Box(Modifier.height(StanceSpacing.space3).width(size).background(c.accentBg))
            }
        }

        SectionTitle("Shapes")
        FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
            listOf("Small" to StanceTheme.shapes.small, "Medium" to StanceTheme.shapes.medium, "Large" to StanceTheme.shapes.large, "Pill" to StanceTheme.shapes.pill).forEach { (name, shape) ->
                Box(
                    Modifier.size(width = StanceSpacing.space20, height = StanceSpacing.space12).border(StanceSpacing.space05, c.fgDefault, shape),
                    contentAlignment = Alignment.Center,
                ) { Text(name, style = type.caption) }
            }
        }

        SectionTitle("Elevation")
        val levels: List<Pair<String, StanceElevationLevel>> = listOf("xs" to StanceTheme.elevation.xs, "md" to StanceTheme.elevation.md, "xl" to StanceTheme.elevation.xl)
        Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space6), modifier = Modifier.padding(StanceSpacing.space2)) {
            levels.forEach { (name, level) ->
                StanceSurface(elevation = level, modifier = Modifier.size(StanceSpacing.space16)) {
                    Box(contentAlignment = Alignment.Center) { Text(name, style = type.caption) }
                }
            }
        }

        SectionTitle("Icons")
        FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
            StanceIcons.all.take(40).forEach { (name, icon) -> StanceIcon(icon, contentDescription = name, size = StanceSizes.iconLarge) }
        }
    }
}

// ───────────── Components catalogue ─────────────

private data class Entry(val name: String, val content: @Composable () -> Unit)

private val catalogue: List<Pair<String, List<Entry>>> = listOf(
    "Actions" to listOf(
        Entry("StanceButton") { StanceButtonExample() },
        Entry("StanceIconButton") { StanceIconButtonExample() },
        Entry("StanceFloatingActionButton") { StanceFloatingActionButtonExample() },
        Entry("StanceButtonGroup") { StanceButtonGroupExample() },
        Entry("StanceSplitButton") { StanceSplitButtonExample() },
        Entry("StanceDropdownMenu") { StanceDropdownMenuExample() },
    ),
    "Forms" to listOf(
        Entry("StanceTextField") { StanceTextFieldExample() },
        Entry("StancePasswordField") { StancePasswordFieldExample() },
        Entry("StanceSearchBar") { StanceSearchBarExample() },
        Entry("StanceSelect") { StanceSelectExample() },
        Entry("StanceCheckbox") { StanceCheckboxExample() },
        Entry("StanceRadioGroup") { StanceRadioGroupExample() },
        Entry("StanceSwitch") { StanceSwitchExample() },
        Entry("StanceSlider") { StanceSliderExample() },
        Entry("StanceRangeSlider") { StanceRangeSliderExample() },
        Entry("StanceDatePicker") { StanceDatePickerExample() },
        Entry("StanceDateRangePicker") { StanceDateRangePickerExample() },
        Entry("StanceTimePicker") { StanceTimePickerExample() },
        Entry("StanceFilterChip") { StanceFilterChipExample() },
        Entry("StanceInputChip") { StanceInputChipExample() },
    ),
    "Navigation" to listOf(
        Entry("StanceTopAppBar") { StanceTopAppBarExample() },
        Entry("StanceTabs") { StanceTabsExample() },
        Entry("StanceNavigationBar") { StanceNavigationBarExample() },
        Entry("StanceStepper") { StanceStepperExample() },
        Entry("StancePagerIndicator") { StancePagerIndicatorExample() },
    ),
    "Data display" to listOf(
        Entry("StanceCard") { StanceCardExample() },
        Entry("StanceListItem") { StanceListItemExample() },
        Entry("StanceBadge") { StanceBadgeExample() },
        Entry("StanceTag") { StanceTagExample() },
        Entry("StanceAvatar") { StanceAvatarExample() },
        Entry("StanceAvatarGroup") { StanceAvatarGroupExample() },
        Entry("StanceProgressIndicator") { StanceProgressIndicatorExample() },
        Entry("StanceCircularProgressIndicator") { StanceCircularProgressIndicatorExample() },
        Entry("StanceSkeleton") { StanceSkeletonExample() },
        Entry("StanceStatCard") { StanceStatCardExample() },
        Entry("StanceTimeline") { StanceTimelineExample() },
        Entry("StanceDescriptionList") { StanceDescriptionListExample() },
        Entry("StanceDataTable") { StanceDataTableExample() },
        Entry("StanceEmptyState") { StanceEmptyStateExample() },
    ),
    "Feedback and overlays" to listOf(
        Entry("StanceInlineAlert") { StanceInlineAlertExample() },
        Entry("StanceBanner") { StanceBannerExample() },
        Entry("StanceSnackbarHost") { StanceSnackbarHostExample() },
        Entry("StanceDialog") { StanceDialogExample() },
        Entry("StanceAlertDialog") { StanceAlertDialogExample() },
        Entry("StanceBottomSheet") { StanceBottomSheetExample() },
        Entry("StanceTooltip") { StanceTooltipExample() },
        Entry("StanceLoadingOverlay") { StanceLoadingOverlayExample() },
        Entry("StanceErrorState") { StanceErrorStateExample() },
    ),
    "Advanced" to listOf(
        Entry("StanceFilterBar") { StanceFilterBarExample() },
        Entry("StanceSwipeActions") { StanceSwipeActionsExample() },
        Entry("StanceSignatureCanvas") { StanceSignatureCanvasExample() },
        Entry("StanceSearchableList") { StanceSearchableListExample() },
        Entry("Photo and document pickers") {
            Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                StancePhotoPickerExample()
                StanceDocumentPickerExample()
            }
        },
        Entry("View interoperability") { StanceButtonViewExample() },
    ),
)

/** Every component with its variants, grouped by category. [section] limits it to one category. */
@Composable
fun ComponentsScreen(padding: PaddingValues, section: String? = null) {
    val sections = remember(section) { catalogue.filter { section == null || it.first == section } }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = StanceSpacing.space4,
            end = StanceSpacing.space4,
            top = padding.calculateTopPadding() + StanceSpacing.space2,
            bottom = padding.calculateBottomPadding() + StanceSpacing.space6,
        ),
        verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
    ) {
        sections.forEach { (title, entries) ->
            item(key = title) { SectionTitle(title) }
            items(entries, key = { it.name }) { entry ->
                StanceCard(modifier = Modifier.fillMaxWidth()) {
                    Text(entry.name, style = StanceTheme.typography.labelSmall, color = StanceTheme.colors.fgMuted)
                    Box(Modifier.padding(top = StanceSpacing.space3)) { entry.content() }
                }
            }
        }
    }
}

// ───────────── Sample: signature template settings ─────────────

/** A realistic screen composed only from Stance components. No network and no business logic. */
@Composable
fun SampleScreen(padding: PaddingValues, snackbars: SnackbarHostState) {
    var name by rememberSaveable { mutableStateOf("Sales team signature") }
    var domain by rememberSaveable { mutableStateOf<String?>("binds.si") }
    var autoApply by rememberSaveable { mutableStateOf(true) }
    var tab by rememberSaveable { mutableStateOf(0) }
    var sheetOpen by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val nameError = if (name.isBlank()) "Enter a template name" else null

    Page(padding) {
        StanceCard(variant = StanceCardVariant.Elevated, modifier = Modifier.fillMaxWidth()) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Sales team signature", style = StanceTheme.typography.headingSmall)
                    Text("Deployed to 48 organisation users", style = StanceTheme.typography.bodySmall, color = StanceTheme.colors.fgMuted)
                }
                StanceBadge("Live", tone = StanceTone.Success)
            }
            Box(Modifier.padding(vertical = StanceSpacing.space3)) {
                StanceButtonGroup(listOf("Details", "Rollout"), tab, onSelect = { tab = it })
            }
            if (tab == 0) {
                Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space4)) {
                    StanceTextField(name, { name = it }, label = "Template name", required = true, error = nameError)
                    StanceSelect(
                        label = "Reply-to domain",
                        options = listOf(StanceSelectOption("binds.si", "binds.si"), StanceSelectOption("esignify.com", "esignify.com")),
                        selected = domain,
                        onSelect = { domain = it },
                        helper = "Used for every signature link.",
                    )
                    StanceSwitch("Apply to new members automatically", autoApply, { autoApply = it })
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
                    StanceProgressIndicator(0.72f, label = "Rollout")
                    StanceInlineAlert("13 mailboxes are waiting for Exchange relay.", tone = StanceTone.Warning)
                }
            }
            StanceDivider(modifier = Modifier.padding(vertical = StanceSpacing.space4))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                StanceAvatarGroup(listOf("Amara Okafor", "Lukas Brenner", "Priya Nair", "Tomás Ruiz", "Hana Sato"), max = 3)
                Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                    StanceButton("Share", onClick = { sheetOpen = true }, variant = StanceButtonVariant.Ghost)
                    StanceButton(
                        "Deploy",
                        onClick = { scope.launch { snackbars.showStanceSnackbar("Deployment started", StanceTone.Success, actionLabel = "View") } },
                        enabled = nameError == null,
                        leadingIcon = StanceIcons.Send,
                    )
                }
            }
        }

        SectionTitle("Recent activity")
        StanceCard(modifier = Modifier.fillMaxWidth(), contentPadding = PaddingValues(vertical = StanceSpacing.space1)) {
            StanceListItem("Priya Nair", supporting = "Signature updated, 10:42", trailing = { StanceBadge("Live", tone = StanceTone.Success) }, onClick = {})
            StanceDivider()
            StanceListItem("Lukas Brenner", supporting = "Waiting for relay", trailing = { StanceBadge("Pending", tone = StanceTone.Warning) }, onClick = {})
            StanceDivider()
            StanceListItem("Tomás Ruiz", supporting = "Mailbox not found", trailing = { StanceBadge("Failed", tone = StanceTone.Danger) }, onClick = {})
        }
    }

    if (sheetOpen) {
        StanceBottomSheet(onDismissRequest = { sheetOpen = false }, title = "Share template") {
            StanceListItem("Copy link", leading = { StanceIcon(StanceIcons.Link, null) }, onClick = { sheetOpen = false })
            StanceListItem("Send by email", leading = { StanceIcon(StanceIcons.Mail, null) }, onClick = { sheetOpen = false })
        }
    }
}

// ───────────── Accessibility ─────────────

@Composable
fun AccessibilityScreen(padding: PaddingValues, appearance: StanceAppearance, onAppearanceChange: (StanceAppearance) -> Unit) {
    Page(padding) {
        SectionTitle("Appearance")
        StanceButtonGroup(
            options = StanceAppearance.entries.map { appearanceLabels.getValue(it) },
            selectedIndex = appearance.ordinal,
            onSelect = { onAppearanceChange(StanceAppearance.entries[it]) },
        )
        Text(
            "System follows the device dark theme and contrast settings. High contrast gives stronger borders, thicker focus rings and darker secondary text.",
            style = StanceTheme.typography.bodySmall,
            color = StanceTheme.colors.fgMuted,
        )

        SectionTitle("Built in")
        listOf(
            "Touch targets" to "Every control is at least 48dp, even when it looks smaller.",
            "Text size" to "Type uses sp, so it follows the system font size up to 200%.",
            "Screen readers" to "Controls expose roles, states and labels to TalkBack.",
            "Keyboard" to "Focus is always visible. Current width: ${StanceTheme.tokens.focusWidth.toInt()}dp.",
            "Motion" to if (StanceTheme.motion.reduceMotion) "Animations are off, following the system setting." else "Animations follow the system setting. Turn on Remove animations to stop them.",
            "Colour" to "Status always pairs colour with text or an icon.",
        ).forEach { (title, body) ->
            StanceCard(modifier = Modifier.fillMaxWidth()) {
                Text(title, style = StanceTheme.typography.title)
                Text(body, style = StanceTheme.typography.bodySmall, color = StanceTheme.colors.fgMuted)
            }
        }

        SectionTitle("Try it")
        StanceInlineAlert("Turn on TalkBack and swipe through this screen. Each card is read as one item.", tone = StanceTone.Info)
    }
}
