package com.bindshq.stance.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.bindshq.stance.tokens.StanceTokens

/**
 * The Stance type scale. Sizes are in `sp`, so text follows the system font size,
 * including non-linear scaling at large sizes. Line heights are in `em` so they scale with the text.
 */
@Immutable
public data class StanceTypography(
    val display: TextStyle,
    val headingLarge: TextStyle,
    val headingMedium: TextStyle,
    val headingSmall: TextStyle,
    val title: TextStyle,
    val bodyLarge: TextStyle,
    val body: TextStyle,
    val bodySmall: TextStyle,
    val label: TextStyle,
    val labelSmall: TextStyle,
    val caption: TextStyle,
    val button: TextStyle,
    val code: TextStyle,
)

private fun style(
    size: Float,
    weight: Int,
    lineHeight: Float,
    letterSpacing: Float,
    family: FontFamily,
): TextStyle = TextStyle(
    fontFamily = family,
    fontSize = size.sp,
    fontWeight = FontWeight(weight),
    lineHeight = lineHeight.em,
    letterSpacing = letterSpacing.em,
)

/**
 * Builds the type scale from Stance tokens.
 *
 * @param fontFamily Defaults to the platform typeface. Pass a [FontFamily] for DM Sans
 * (the Stance web typeface) if your app bundles or downloads it.
 */
public fun stanceTypography(fontFamily: FontFamily = FontFamily.Default): StanceTypography {
    val size = StanceTokens.FontSize
    val weight = StanceTokens.FontWeight
    val line = StanceTokens.LineHeight
    val tracking = StanceTokens.LetterSpacing
    return StanceTypography(
        display = style(size.size3xl, weight.semibold, line.tight, tracking.tighter, fontFamily),
        headingLarge = style(size.size2xl, weight.semibold, line.snug, tracking.tight, fontFamily),
        headingMedium = style(size.sizexl, weight.semibold, line.snug, tracking.tight, fontFamily),
        headingSmall = style(size.sizelg, weight.semibold, line.snug, tracking.tight, fontFamily),
        title = style(size.sizemd, weight.semibold, line.snug, tracking.normal, fontFamily),
        bodyLarge = style(size.sizelg, weight.regular, line.normal, tracking.normal, fontFamily),
        body = style(size.sizemd, weight.regular, line.normal, tracking.normal, fontFamily),
        bodySmall = style(size.sizesm, weight.regular, line.normal, tracking.normal, fontFamily),
        label = style(size.sizesm, weight.medium, line.snug, tracking.normal, fontFamily),
        labelSmall = style(size.sizexs, weight.medium, line.snug, tracking.wide, fontFamily),
        caption = style(size.sizexs, weight.regular, line.normal, tracking.normal, fontFamily),
        button = style(size.sizesm, weight.semibold, line.snug, tracking.normal, fontFamily),
        code = style(size.sizesm, weight.regular, line.normal, tracking.normal, FontFamily.Monospace),
    )
}
