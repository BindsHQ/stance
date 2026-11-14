package si.binds.stance.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonSize
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.components.data.StanceBadge
import com.bindshq.stance.components.data.StanceProgressIndicator
import com.bindshq.stance.components.feedback.StanceInlineAlert
import com.bindshq.stance.components.forms.StanceSwitch
import com.bindshq.stance.components.forms.StanceTextField
import com.bindshq.stance.components.navigation.StanceTabs
import com.bindshq.stance.foundation.StanceCard
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.theme.StanceBrand
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.tokens.StanceBrandEngine
import com.bindshq.stance.tokens.StanceThemeTokens
import com.bindshq.stance.tokens.StanceTokens

/** Example brands to start from. */
private data class BrandPreset(val name: String, val light: String, val dark: String, val accent: String = "", val accentDark: String = "")

private val presets = listOf(
    BrandPreset("Binds", "#FCF6EB", "#140C2E"),
    BrandPreset("Harbour", "#F2F8FF", "#0A1A50", "#FF5A36"),
    BrandPreset("Sage", "#F4F2EC", "#171D1A", "#5E7361", "#8FA892"),
    BrandPreset("Graphite", "#FAFAF7", "#1A1A1F", "#7A7A7A"),
)

private fun isHex(value: String): Boolean = runCatching { StanceBrandEngine.parseHex(value) }.isSuccess

private const val HEX_HINT = "A hex colour, for example #F2F8FF"

/**
 * Make Stance yours: pick a light and a dark colour, and optionally an accent, and see the
 * components and the contrast report update live in light, dark and high contrast.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun BrandScreen(padding: PaddingValues) {
    var light by rememberSaveable { mutableStateOf("#F2F8FF") }
    var dark by rememberSaveable { mutableStateOf("#0A1A50") }
    var accent by rememberSaveable { mutableStateOf("#FF5A36") }
    var accentDark by rememberSaveable { mutableStateOf("") }

    val valid = isHex(light) && isHex(dark) && (accent.isBlank() || isHex(accent)) && (accentDark.isBlank() || isHex(accentDark))
    val brand = remember(light, dark, accent, accentDark, valid) {
        when {
            !valid -> null
            accent.isBlank() -> StanceBrand("Your brand", light, dark)
            accentDark.isBlank() -> StanceBrand("Your brand", light, dark, accent)
            else -> StanceBrand("Your brand", light, dark, accentLight = accent, accentDark = accentDark)
        }
    }

    Page(padding) {
        Text("Make Stance yours", style = StanceTheme.typography.headingMedium)
        Text(
            "Stance works as it is. If you like, give it your own light and dark colours and an accent, and every component follows in light, dark and high contrast.",
            style = StanceTheme.typography.body,
            color = StanceTheme.colors.fgMuted,
        )

        FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            presets.forEach { preset ->
                StanceButton(
                    preset.name,
                    onClick = {
                        light = preset.light
                        dark = preset.dark
                        accent = preset.accent
                        accentDark = preset.accentDark
                    },
                    variant = StanceButtonVariant.Secondary,
                    size = StanceButtonSize.Small,
                )
            }
        }

        StanceTextField(light, { light = it }, label = "Light colour", helper = "The canvas, and text on dark surfaces", error = HEX_HINT.takeUnless { isHex(light) })
        StanceTextField(dark, { dark = it }, label = "Dark colour", helper = "Text, and the dark canvas", error = HEX_HINT.takeUnless { isHex(dark) })
        StanceTextField(accent, { accent = it }, label = "Accent (optional)", helper = "Buttons, links, selection and focus", error = HEX_HINT.takeUnless { accent.isBlank() || isHex(accent) })
        StanceTextField(accentDark, { accentDark = it }, label = "Accent in dark theme (optional)", helper = "Leave empty to use the accent above", error = HEX_HINT.takeUnless { accentDark.isBlank() || isHex(accentDark) })

        if (brand != null) {
            SectionTitle("Preview")
            for (theme in StanceTokens.allThemes) BrandPreview(theme, brand)

            SectionTitle("Contrast")
            val report = remember(brand) { brand.contrastReport() }
            if (report.isEmpty()) {
                StanceInlineAlert("Every contrast check passes in all three themes.", tone = StanceTone.Success, title = "Looking good")
            } else {
                StanceInlineAlert(
                    report.joinToString("\n") { it.toString() },
                    tone = StanceTone.Warning,
                    title = "${report.size} pair(s) to adjust",
                )
            }
        }
    }
}

private val themeLabels = mapOf("light" to "Light", "dark" to "Dark", "high-contrast" to "High contrast")

@Composable
private fun BrandPreview(theme: StanceThemeTokens, brand: StanceBrand) {
    StanceTheme(tokens = theme, brand = brand) {
        var on by remember { mutableStateOf(true) }
        var tab by remember { mutableStateOf(0) }
        StanceCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
                Text(themeLabels[theme.name] ?: theme.name, style = StanceTheme.typography.title)
                StanceTabs(listOf("Overview", "Activity"), selectedIndex = tab, onSelect = { tab = it })
                FlowRowButtons()
                StanceSwitch("Notifications", checked = on, onCheckedChange = { on = it })
                StanceProgressIndicator(0.6f, label = "Setup")
                Text("Read the guide", style = StanceTheme.typography.body, color = StanceTheme.colors.fgLink)
                StanceBadge("New", tone = StanceTone.Info)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun FlowRowButtons() {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
        StanceButton("Get started", onClick = {})
        StanceButton("Learn more", onClick = {}, variant = StanceButtonVariant.Secondary)
    }
}
