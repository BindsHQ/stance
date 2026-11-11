package com.bindshq.stance.foundation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceTheme

/** The meaning a status component communicates. Status colours are functional, never decorative. */
public enum class StanceTone { Neutral, Info, Success, Warning, Danger }

/** The colours of one tone in the active theme. */
@Immutable
public data class StanceToneColors(
    val foreground: Color,
    val background: Color,
    val border: Color,
    val solid: Color,
    val onSolid: Color,
)

/** Resolves the colours for this tone from the active theme. */
@Composable
@ReadOnlyComposable
public fun StanceTone.colors(): StanceToneColors {
    val c = StanceTheme.colors
    return when (this) {
        StanceTone.Neutral -> StanceToneColors(c.fgDefault, c.bgMuted, c.borderDefault, c.bgInverse, c.fgInverse)
        StanceTone.Info -> StanceToneColors(c.infoFg, c.infoBg, c.infoBorder, c.infoSolid, c.infoOnSolid)
        StanceTone.Success -> StanceToneColors(c.successFg, c.successBg, c.successBorder, c.successSolid, c.successOnSolid)
        StanceTone.Warning -> StanceToneColors(c.warningFg, c.warningBg, c.warningBorder, c.warningSolid, c.warningOnSolid)
        StanceTone.Danger -> StanceToneColors(c.dangerFg, c.dangerBg, c.dangerBorder, c.dangerSolid, c.dangerOnSolid)
    }
}

/** The icon that accompanies a tone, so status is never conveyed by colour alone. */
public val StanceTone.icon: ImageVector
    get() = when (this) {
        StanceTone.Neutral, StanceTone.Info -> StanceIcons.Info
        StanceTone.Success -> StanceIcons.CheckCircle
        StanceTone.Warning -> StanceIcons.AlertTriangle
        StanceTone.Danger -> StanceIcons.AlertCircle
    }
