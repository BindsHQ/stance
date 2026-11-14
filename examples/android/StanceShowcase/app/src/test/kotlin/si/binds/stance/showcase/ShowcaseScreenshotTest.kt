package si.binds.stance.showcase

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.semantics.SemanticsActions
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.theme.StanceAppearance
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.tokens.StanceThemeTokens
import com.bindshq.stance.tokens.StanceTokens
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File
import kotlin.test.Test

/**
 * Renders every showcase destination in each theme at phone and tablet sizes on the JVM
 * and writes PNGs. Set STANCE_SHOTS_DIR to choose the output directory.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35])
class ShowcaseScreenshotTest {
    @get:Rule
    val rule = createComposeRule()

    private val output = File(System.getenv("STANCE_SHOTS_DIR") ?: "build/outputs/stance-shots").apply { mkdirs() }

    private fun capture(device: String, qualifiers: String, width: StanceWindowWidth, theme: StanceThemeTokens, destination: Destination) {
        RuntimeEnvironment.setQualifiers(qualifiers)
        rule.setContent {
            StanceTheme(tokens = theme) {
                ShowcaseApp(StanceAppearance.System, onAppearanceChange = {}, initialDestination = destination, windowWidth = width)
            }
        }
        rule.waitForIdle()
        rule.onRoot().captureRoboImage(File(output, "$device-${destination.name.lowercase()}-${theme.name}.png").path)
    }

    private val phone = "w411dp-h891dp-xxhdpi"
    private val tablet = "w1280dp-h800dp-land-xhdpi"

    @Test fun phoneSampleLight() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.light, Destination.Sample)

    @Test fun phoneSampleDark() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.dark, Destination.Sample)

    @Test fun phoneSampleHighContrast() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.highContrast, Destination.Sample)

    @Test fun phoneFoundationsLight() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.light, Destination.Foundations)

    @Test fun phoneFoundationsDark() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.dark, Destination.Foundations)

    @Test fun phoneComponentsLight() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.light, Destination.Components)

    @Test fun phoneComponentsDark() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.dark, Destination.Components)

    @Test fun phoneComponentsHighContrast() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.highContrast, Destination.Components)

    @Test fun phoneAccessibilityHighContrast() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.highContrast, Destination.Accessibility)

    @Test fun phoneAssistantLight() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.light, Destination.Assistant)

    @Test fun phoneAssistantHighContrast() = capture("phone", phone, StanceWindowWidth.Compact, StanceTokens.highContrast, Destination.Assistant)

    @Test fun tabletAssistantDark() = capture("tablet", tablet, StanceWindowWidth.Expanded, StanceTokens.dark, Destination.Assistant)

    @Test fun tabletSampleLight() = capture("tablet", tablet, StanceWindowWidth.Expanded, StanceTokens.light, Destination.Sample)

    @Test fun tabletSampleDark() = capture("tablet", tablet, StanceWindowWidth.Expanded, StanceTokens.dark, Destination.Sample)

    @Test fun tabletComponentsHighContrast() = capture("tablet", tablet, StanceWindowWidth.Expanded, StanceTokens.highContrast, Destination.Components)

    @Test
    fun phoneBrandDark() {
        RuntimeEnvironment.setQualifiers(phone)
        rule.setContent {
            StanceTheme(tokens = StanceTokens.dark) {
                ShowcaseApp(StanceAppearance.System, onAppearanceChange = {}, windowWidth = StanceWindowWidth.Compact, initialBrandOpen = true)
            }
        }
        rule.waitForIdle()
        rule.onRoot().captureRoboImage(File(output, "phone-brand-dark.png").path)
    }

    @Test
    fun brandScreenOpensFromFoundationsAndNavigatesUp() {
        RuntimeEnvironment.setQualifiers(phone)
        rule.setContent {
            StanceTheme(tokens = StanceTokens.light) {
                ShowcaseApp(StanceAppearance.System, onAppearanceChange = {}, windowWidth = StanceWindowWidth.Compact)
            }
        }
        // Five tabs; Brand is not one of them.
        rule.onAllNodesWithText("Brand").assertCountEquals(1)
        // The row sits at the end of Foundations; trigger its click action directly so the
        // bottom bar drawn over the scrolled content cannot intercept the tap.
        rule.onNodeWithText("Make Stance yours").performScrollTo().performSemanticsAction(SemanticsActions.OnClick)
        rule.onNodeWithContentDescription("Navigate up").assertIsDisplayed()
        rule.onNodeWithText("Make Stance yours").assertIsDisplayed()
        rule.onNodeWithText("Graphite").performClick()
        rule.onNodeWithText("Every contrast check passes in all three themes.").performScrollTo().assertIsDisplayed()
        rule.onNodeWithContentDescription("Navigate up").performClick()
        rule.onNodeWithText("Typography").assertExists()
        rule.onAllNodesWithText("Graphite").assertCountEquals(0)
    }

    @Test
    fun navigationSwitchesDestinations() {
        RuntimeEnvironment.setQualifiers(phone)
        rule.setContent { StanceTheme(tokens = StanceTokens.light) { ShowcaseApp(StanceAppearance.System, onAppearanceChange = {}) } }
        rule.onNodeWithText("Sample").performClick()
        rule.onNodeWithText("Recent activity").assertIsDisplayed()
    }
}
