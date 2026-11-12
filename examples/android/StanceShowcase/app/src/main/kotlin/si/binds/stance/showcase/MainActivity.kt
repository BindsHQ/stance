package si.binds.stance.showcase

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.bindshq.stance.components.actions.StanceDropdownMenu
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.components.actions.StanceMenuItem
import com.bindshq.stance.components.navigation.StanceAdaptiveNavigation
import com.bindshq.stance.components.navigation.StanceNavigationItem
import com.bindshq.stance.components.navigation.StanceTopAppBar
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.foundation.rememberStanceWindowWidth
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceAppearance
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.theme.rememberStanceAppearance

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            var appearance by rememberStanceAppearance()
            StanceTheme(appearance = appearance) {
                ShowcaseApp(appearance = appearance, onAppearanceChange = { appearance = it })
            }
        }
    }
}

/** Top-level destinations of the showcase. */
enum class Destination(val label: String) {
    Foundations("Foundations"),
    Components("Components"),
    Sample("Sample"),
    Accessibility("Accessibility"),
    Assistant("Assistant"),
}

private val navigationItems = listOf(
    StanceNavigationItem(Destination.Foundations.label, StanceIcons.Palette),
    StanceNavigationItem(Destination.Components.label, StanceIcons.LayoutGrid),
    StanceNavigationItem(Destination.Sample.label, StanceIcons.Signature),
    StanceNavigationItem(Destination.Accessibility.label, StanceIcons.Eye),
    StanceNavigationItem(Destination.Assistant.label, StanceIcons.Sparkle),
)

val appearanceLabels = mapOf(
    StanceAppearance.System to "System",
    StanceAppearance.Light to "Light",
    StanceAppearance.Dark to "Dark",
    StanceAppearance.HighContrast to "High contrast",
)

/**
 * The showcase shell: adaptive navigation (bar, rail or drawer by window width), a theme menu
 * and the selected screen. Back returns to the first destination before leaving the app.
 */
@Composable
fun ShowcaseApp(
    appearance: StanceAppearance,
    onAppearanceChange: (StanceAppearance) -> Unit,
    initialDestination: Destination = Destination.Foundations,
    windowWidth: StanceWindowWidth = rememberStanceWindowWidth(),
) {
    var selected by rememberSaveable { mutableIntStateOf(initialDestination.ordinal) }
    val snackbars = remember { SnackbarHostState() }
    BackHandler(enabled = selected != 0) { selected = 0 }

    StanceAdaptiveNavigation(
        items = navigationItems,
        selectedIndex = selected,
        onSelect = { selected = it },
        windowWidth = windowWidth,
        snackbarHostState = snackbars,
        header = {
            Text(
                "Stance",
                style = StanceTheme.typography.headingSmall,
                modifier = Modifier.padding(horizontal = StanceSpacing.space4, vertical = StanceSpacing.space4),
            )
        },
        topBar = {
            StanceTopAppBar(Destination.entries[selected].label) {
                ThemeMenu(appearance, onAppearanceChange)
            }
        },
    ) { padding ->
        DestinationContent(Destination.entries[selected], padding, appearance, onAppearanceChange, snackbars)
    }
}

@Composable
private fun DestinationContent(
    destination: Destination,
    padding: PaddingValues,
    appearance: StanceAppearance,
    onAppearanceChange: (StanceAppearance) -> Unit,
    snackbars: SnackbarHostState,
) {
    when (destination) {
        Destination.Foundations -> FoundationsScreen(padding)
        Destination.Components -> ComponentsScreen(padding)
        Destination.Sample -> SampleScreen(padding, snackbars)
        Destination.Accessibility -> AccessibilityScreen(padding, appearance, onAppearanceChange)
        Destination.Assistant -> AssistantScreen(padding)
    }
}

@Composable
private fun ThemeMenu(appearance: StanceAppearance, onAppearanceChange: (StanceAppearance) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        StanceIconButton(StanceIcons.Contrast, contentDescription = "Theme: ${appearanceLabels[appearance]}", onClick = { expanded = true })
        StanceDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            items = StanceAppearance.entries.map { option ->
                StanceMenuItem(
                    label = appearanceLabels.getValue(option),
                    onClick = { onAppearanceChange(option) },
                    icon = if (option == appearance) StanceIcons.Check else null,
                )
            },
        )
    }
}
