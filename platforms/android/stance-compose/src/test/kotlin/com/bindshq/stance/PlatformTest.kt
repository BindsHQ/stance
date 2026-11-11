package com.bindshq.stance

import android.content.Context
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.advanced.StanceFilter
import com.bindshq.stance.components.advanced.StanceFilterBar
import com.bindshq.stance.components.advanced.StanceSearchableList
import com.bindshq.stance.components.advanced.StanceSignatureCanvas
import com.bindshq.stance.components.advanced.StanceSignatureState
import com.bindshq.stance.components.advanced.StanceSwipeAction
import com.bindshq.stance.components.advanced.StanceSwipeActions
import com.bindshq.stance.components.data.StanceListItem
import com.bindshq.stance.components.forms.StanceSwitch
import com.bindshq.stance.components.forms.StanceTextField
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.interop.StanceButtonView
import com.bindshq.stance.theme.StanceAppearance
import com.bindshq.stance.theme.StanceAppearanceStore
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.tokens.StanceTokens
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "w600dp-h1400dp")
class PlatformTest {
    @get:Rule
    val rule = createComposeRule()

    private val context: Context get() = ApplicationProvider.getApplicationContext()

    @Test
    fun appearancePreferencePersists() {
        val store = StanceAppearanceStore(context, name = "stance-test")
        assertEquals(StanceAppearance.System, store.load())
        store.save(StanceAppearance.HighContrast)
        assertEquals(StanceAppearance.HighContrast, StanceAppearanceStore(context, name = "stance-test").load())
        assertEquals("high-contrast", context.getSharedPreferences("stance-test", Context.MODE_PRIVATE).getString("stance-theme", null))
    }

    @Test
    fun themeProvidesTokensToContentInEveryTheme() {
        for (theme in StanceTokens.allThemes) {
            var canvas: Color? = null
            var highContrast: Boolean? = null
            rule.setContent {
                StanceTheme(tokens = theme) {
                    canvas = StanceTheme.colors.bgCanvas
                    highContrast = StanceTheme.isHighContrast
                }
            }
            rule.waitForIdle()
            assertEquals(Color(theme.colors.bgCanvas), canvas)
            assertEquals(theme.name == "high-contrast", highContrast)
            break
        }
    }

    @Test
    fun layoutSurvivesTwoHundredPercentFontScale() {
        rule.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density, fontScale = 2f)) {
                StanceTheme(tokens = StanceTokens.light) {
                    Column {
                        StanceButton("Save template", onClick = {})
                        StanceTextField("Sales team", {}, label = "Template name", helper = "Visible to your organisation.")
                        StanceSwitch("Apply to new members automatically", true, {})
                    }
                }
            }
        }
        // Controls grow with text instead of clipping it.
        rule.onNodeWithText("Save template").assertIsDisplayed().assertHeightIsAtLeast(40.dp)
        rule.onNodeWithText("Visible to your organisation.").assertIsDisplayed()
        rule.onNodeWithText("Apply to new members automatically").assertIsDisplayed().assertHeightIsAtLeast(48.dp)
    }

    @Test
    fun everyIconBuildsAValidVector() {
        assertTrue(StanceIcons.all.size >= 80)
        for ((name, icon) in StanceIcons.all) {
            assertEquals(24.dp, icon.defaultWidth, name)
            assertEquals(24f, icon.viewportWidth, name)
        }
    }

    @Test
    fun decorativeIconsAreHiddenAndLabelledIconsAreAnnounced() {
        rule.setStanceContent {
            Column {
                StanceIcon(StanceIcons.Search, contentDescription = null)
                StanceIcon(StanceIcons.AlertTriangle, contentDescription = "Warning")
            }
        }
        rule.onNodeWithContentDescription("Warning").assertExists()
    }

    @Test
    fun signatureStateTracksStrokesUndoAndClear() {
        val state = StanceSignatureState()
        assertTrue(state.isEmpty)
        state.addStroke(listOf(Offset(0f, 0f), Offset(10f, 10f), Offset(20f, 5f)))
        state.addStroke(listOf(Offset(30f, 0f), Offset(40f, 10f)))
        assertEquals(2, state.strokeCount)
        assertFalse(state.toPath().isEmpty)
        state.undo()
        assertEquals(1, state.strokeCount)
        state.clear()
        assertTrue(state.isEmpty)
        assertNull(state.toImageBitmap(Color.Black, 2f, Density(1f)))
    }

    @Test
    fun signatureCanvasAnnouncesStateAndExports() {
        val state = StanceSignatureState()
        rule.setStanceContent { StanceSignatureCanvas(state, label = "Signature") }
        rule.onNodeWithContentDescription("Signature").assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Empty"))
        rule.onNodeWithText("Clear").assertIsNotEnabled()
        rule.runOnIdle { state.addStroke(listOf(Offset(10f, 10f), Offset(60f, 40f), Offset(120f, 20f))) }
        rule.onNodeWithContentDescription("Signature").assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Signed"))
        val bitmap = rule.runOnIdle { state.toImageBitmap(Color.Black, 3f, Density(1f)) }
        assertNotNull(bitmap)
        assertTrue(bitmap.width > 0 && bitmap.height > 0)
        rule.onNodeWithText("Clear").performClick()
        rule.runOnIdle { assertTrue(state.isEmpty) }
    }

    @Test
    fun swipeActionsAreAvailableAsAccessibilityActions() {
        var deleted = 0
        rule.setStanceContent {
            StanceSwipeActions(endAction = StanceSwipeAction("Delete", StanceIcons.Trash, StanceTone.Danger) { deleted++ }) {
                StanceListItem("Sales team signature")
            }
        }
        val actions = rule.onNode(SemanticsMatcher.keyIsDefined(SemanticsActions.CustomActions))
            .fetchSemanticsNode().config.getOrNull(SemanticsActions.CustomActions)
        assertEquals(listOf("Delete"), actions?.map { it.label })
        rule.runOnIdle { actions!!.first().action() }
        assertEquals(1, deleted)
    }

    @Test
    fun searchableListFiltersAndShowsAnEmptyState() {
        val people = listOf("Amara Okafor", "Lukas Brenner", "Priya Nair")
        rule.setStanceContent {
            StanceSearchableList(people, matches = { item, query -> item.contains(query, ignoreCase = true) }) { Text(it) }
        }
        rule.onNodeWithText("3 results").assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion))
        rule.onNode(hasSetTextAction()).performTextInput("pri")
        rule.onNodeWithText("1 result").assertIsDisplayed()
        rule.onNodeWithText("Priya Nair").assertIsDisplayed()
        rule.onNodeWithText("Lukas Brenner").assertDoesNotExist()
        rule.onNode(hasSetTextAction()).performTextInput("zzz")
        rule.onNodeWithText("No results").assertIsDisplayed()
    }

    @Test
    fun filterBarTogglesAndClears() {
        var toggled = ""
        var cleared = 0
        rule.setStanceContent {
            StanceFilterBar(
                filters = listOf(StanceFilter("signed", "Signed", selected = true), StanceFilter("pending", "Pending", selected = false)),
                onToggle = { toggled = it },
                onClearAll = { cleared++ },
            )
        }
        rule.onNodeWithText("Pending").performClick()
        rule.onNodeWithText("Clear all").performClick()
        assertEquals("pending", toggled)
        assertEquals(1, cleared)
    }

    @Test
    fun buttonViewBridgesToTheViewSystem() {
        val view = StanceButtonView(context)
        view.text = "Save template"
        var clicks = 0
        view.setOnClickListener { clicks++ }
        rule.setContent { androidx.compose.ui.viewinterop.AndroidView(factory = { view }) }
        rule.onNodeWithText("Save template").performClick()
        assertEquals(1, clicks)
        rule.runOnIdle { view.isEnabled = false }
        rule.onNodeWithText("Save template").assertIsNotEnabled()
    }
}
