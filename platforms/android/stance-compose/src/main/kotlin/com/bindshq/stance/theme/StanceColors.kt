package com.bindshq.stance.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import com.bindshq.stance.tokens.StanceColorTokens

/**
 * Semantic colour roles for the active Stance theme as Compose [Color]s.
 *
 * Components read these roles and never use raw values. The roles mirror the
 * generated [StanceColorTokens] one to one; `StanceColorsParityTest` fails when a
 * role is added to the token source without being exposed here.
 */
@Immutable
public class StanceColors(public val tokens: StanceColorTokens) {
    public val bgCanvas: Color = Color(tokens.bgCanvas)
    public val bgSubtle: Color = Color(tokens.bgSubtle)
    public val bgMuted: Color = Color(tokens.bgMuted)
    public val bgEmphasis: Color = Color(tokens.bgEmphasis)
    public val bgSurface: Color = Color(tokens.bgSurface)
    public val bgSurfaceRaised: Color = Color(tokens.bgSurfaceRaised)
    public val bgOverlay: Color = Color(tokens.bgOverlay)
    public val bgInverse: Color = Color(tokens.bgInverse)
    public val bgScrim: Color = Color(tokens.bgScrim)
    public val fgDefault: Color = Color(tokens.fgDefault)
    public val fgMuted: Color = Color(tokens.fgMuted)
    public val fgSubtle: Color = Color(tokens.fgSubtle)
    public val fgDisabled: Color = Color(tokens.fgDisabled)
    public val fgInverse: Color = Color(tokens.fgInverse)
    public val fgLink: Color = Color(tokens.fgLink)
    public val borderSubtle: Color = Color(tokens.borderSubtle)
    public val borderDefault: Color = Color(tokens.borderDefault)
    public val borderStrong: Color = Color(tokens.borderStrong)
    public val borderControl: Color = Color(tokens.borderControl)
    public val borderControlHover: Color = Color(tokens.borderControlHover)
    public val separator: Color = Color(tokens.separator)
    public val accentBg: Color = Color(tokens.accentBg)
    public val accentBgHover: Color = Color(tokens.accentBgHover)
    public val accentBgActive: Color = Color(tokens.accentBgActive)
    public val accentFg: Color = Color(tokens.accentFg)
    public val interactiveHover: Color = Color(tokens.interactiveHover)
    public val interactiveActive: Color = Color(tokens.interactiveActive)
    public val interactiveSelected: Color = Color(tokens.interactiveSelected)
    public val interactiveSelectedFg: Color = Color(tokens.interactiveSelectedFg)
    public val focusRing: Color = Color(tokens.focusRing)
    public val focusRingOffset: Color = Color(tokens.focusRingOffset)
    public val disabledBg: Color = Color(tokens.disabledBg)
    public val disabledFg: Color = Color(tokens.disabledFg)
    public val disabledBorder: Color = Color(tokens.disabledBorder)
    public val dangerFg: Color = Color(tokens.dangerFg)
    public val dangerBg: Color = Color(tokens.dangerBg)
    public val dangerBorder: Color = Color(tokens.dangerBorder)
    public val dangerSolid: Color = Color(tokens.dangerSolid)
    public val dangerSolidHover: Color = Color(tokens.dangerSolidHover)
    public val dangerOnSolid: Color = Color(tokens.dangerOnSolid)
    public val successFg: Color = Color(tokens.successFg)
    public val successBg: Color = Color(tokens.successBg)
    public val successBorder: Color = Color(tokens.successBorder)
    public val successSolid: Color = Color(tokens.successSolid)
    public val successOnSolid: Color = Color(tokens.successOnSolid)
    public val warningFg: Color = Color(tokens.warningFg)
    public val warningBg: Color = Color(tokens.warningBg)
    public val warningBorder: Color = Color(tokens.warningBorder)
    public val warningSolid: Color = Color(tokens.warningSolid)
    public val warningOnSolid: Color = Color(tokens.warningOnSolid)
    public val infoFg: Color = Color(tokens.infoFg)
    public val infoBg: Color = Color(tokens.infoBg)
    public val infoBorder: Color = Color(tokens.infoBorder)
    public val infoSolid: Color = Color(tokens.infoSolid)
    public val infoOnSolid: Color = Color(tokens.infoOnSolid)
    public val chart1: Color = Color(tokens.chart1)
    public val chart2: Color = Color(tokens.chart2)
    public val chart3: Color = Color(tokens.chart3)
    public val chart4: Color = Color(tokens.chart4)
    public val chart5: Color = Color(tokens.chart5)

    override fun equals(other: Any?): Boolean = other is StanceColors && other.tokens == tokens

    override fun hashCode(): Int = tokens.hashCode()
}
