package si.binds.stance.showcase

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.theme.StanceAppearance
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.tokens.StanceThemeTokens
import com.bindshq.stance.tokens.StanceTokens
import com.github.takahirom.roborazzi.captureRoboImage
import com.github.takahirom.roborazzi.captureScreenRoboImage
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File
import kotlin.test.Test

/**
 * Renders the documentation image of every visual component in each theme, straight from
 * the real composables. Run it with `./gradlew :app:generateStancePreviews`.
 *
 * Output: `<dir>/<slug>.<theme>.png` at xhdpi. The directory comes from the
 * `stance.previews.dir` system property, which the Gradle task sets.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35])
class ComponentPreviewTest(private val name: String, private val themeName: String) {
    @get:Rule
    val rule = createComposeRule()

    private val theme: StanceThemeTokens get() = StanceTokens.allThemes.first { it.name == themeName }
    private val directory: File? get() = System.getProperty("stance.previews.dir")?.let { File(it).apply { mkdirs() } }

    private fun file(slug: String) = File(directory, "$slug.$themeName.png").path

    @Test
    fun capture() {
        assumeTrue("Set stance.previews.dir to write previews", directory != null)
        // -Pstance.previews.only=StanceButton renders a single component while iterating.
        val only = System.getProperty("stance.previews.only")
        assumeTrue(only.isNullOrEmpty() || only == name)
        val showcase = showcaseCaptures[name]
        if (showcase != null) captureShowcase(showcase) else captureComponent(componentPreviews.getValue(name))
    }

    private fun captureComponent(preview: ComponentPreview) {
        RuntimeEnvironment.setQualifiers(
            when (preview.frame) {
                PreviewFrame.Inline -> "w${INLINE_WIDTH}dp-h1400dp-xhdpi"
                PreviewFrame.Overlay -> "w${INLINE_WIDTH}dp-h${preview.height}dp-xhdpi"
                PreviewFrame.Phone -> PHONE
                PreviewFrame.Wide -> "w840dp-h${MAX_HEIGHT}dp-land-xhdpi"
            },
        )
        rule.setContent {
            StanceTheme(tokens = theme) {
                if (preview.frame == PreviewFrame.Inline) {
                    Box(
                        Modifier
                            .testTag(TAG)
                            .width(INLINE_WIDTH.dp)
                            .heightIn(max = MAX_HEIGHT.dp)
                            .clipToBounds()
                            .background(StanceTheme.colors.bgCanvas)
                            .padding(StanceSpacing.space6),
                    ) { preview.content() }
                } else {
                    Box(Modifier.fillMaxSize().background(StanceTheme.colors.bgCanvas)) { preview.content() }
                }
            }
        }
        rule.waitForIdle()
        preview.prepare?.invoke(rule)
        rule.waitForIdle()
        if (preview.frame == PreviewFrame.Inline) {
            rule.onNodeWithTag(TAG).captureRoboImage(file(slug(name)))
        } else {
            captureScreenRoboImage(file(slug(name)))
        }
    }

    private fun captureShowcase(capture: ShowcaseCapture) {
        RuntimeEnvironment.setQualifiers(capture.qualifiers)
        rule.setContent {
            StanceTheme(tokens = theme) {
                ShowcaseApp(StanceAppearance.System, onAppearanceChange = {}, initialDestination = capture.destination, windowWidth = capture.width)
            }
        }
        rule.waitForIdle()
        captureScreenRoboImage(file(name))
    }

    private class ShowcaseCapture(val destination: Destination, val qualifiers: String, val width: StanceWindowWidth, val themes: List<String>)

    companion object {
        private const val TAG = "stance-preview"
        private const val INLINE_WIDTH = 408 // 360dp of content plus 24dp padding on each side
        private const val MAX_HEIGHT = 560
        private const val PHONE = "w411dp-h891dp-xhdpi"
        private const val TABLET = "w1280dp-h800dp-land-xhdpi"

        /** StanceButton to stance-button, rememberStancePhotoPicker to remember-stance-photo-picker. */
        fun slug(name: String): String = name.replace(Regex("([a-z0-9])([A-Z])"), "$1-$2").lowercase()

        private val showcaseCaptures = mapOf(
            "showcase-sample" to ShowcaseCapture(Destination.Sample, PHONE, StanceWindowWidth.Compact, listOf("light", "dark")),
            "showcase-components" to ShowcaseCapture(Destination.Components, PHONE, StanceWindowWidth.Compact, listOf("light")),
            "showcase-sample-tablet" to ShowcaseCapture(Destination.Sample, TABLET, StanceWindowWidth.Expanded, listOf("light")),
        )

        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1}")
        fun parameters(): List<Array<String>> =
            componentPreviews.keys.flatMap { name -> StanceTokens.allThemes.map { arrayOf(name, it.name) } } +
                showcaseCaptures.flatMap { (name, capture) -> capture.themes.map { arrayOf(name, it) } }
    }
}
