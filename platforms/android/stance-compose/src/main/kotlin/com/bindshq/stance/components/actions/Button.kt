package com.bindshq.stance.components.actions

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonColors
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** Visual emphasis of a [StanceButton]. Use one [Primary] action per screen. */
public enum class StanceButtonVariant { Primary, Secondary, Outline, Ghost, Danger, Link }

/** Visual height of a [StanceButton]. The touch target is always at least 48dp. */
public enum class StanceButtonSize { Small, Medium, Large }

@Immutable
internal data class ButtonSpec(val height: Dp, val padding: PaddingValues, val text: TextStyle, val icon: Dp)

@Composable
internal fun StanceButtonSize.spec(): ButtonSpec = when (this) {
    StanceButtonSize.Small -> ButtonSpec(
        StanceSizes.controlSmall,
        PaddingValues(horizontal = StanceSpacing.space3),
        StanceTheme.typography.button,
        StanceSizes.iconSmall,
    )
    StanceButtonSize.Medium -> ButtonSpec(
        StanceSizes.controlMedium,
        PaddingValues(horizontal = StanceSpacing.space4),
        StanceTheme.typography.button,
        StanceSizes.iconSmall,
    )
    StanceButtonSize.Large -> ButtonSpec(
        StanceSizes.controlLarge,
        PaddingValues(horizontal = StanceSpacing.space6),
        StanceTheme.typography.title,
        StanceSizes.iconMedium,
    )
}

@Composable
internal fun StanceButtonVariant.colors(): ButtonColors {
    val c = StanceTheme.colors
    val (container, content) = when (this) {
        StanceButtonVariant.Primary -> c.accentBg to c.accentFg
        StanceButtonVariant.Secondary -> c.bgMuted to c.fgDefault
        StanceButtonVariant.Outline, StanceButtonVariant.Ghost -> Color.Transparent to c.fgDefault
        StanceButtonVariant.Danger -> c.dangerSolid to c.dangerOnSolid
        StanceButtonVariant.Link -> Color.Transparent to c.fgLink
    }
    val transparent = this == StanceButtonVariant.Ghost || this == StanceButtonVariant.Link || this == StanceButtonVariant.Outline
    return ButtonDefaults.buttonColors(
        containerColor = container,
        contentColor = content,
        disabledContainerColor = if (transparent) Color.Transparent else c.disabledBg,
        disabledContentColor = c.disabledFg,
    )
}

/**
 * Triggers an action.
 *
 * Built on the Material 3 button, so it has button semantics, ripple, a 48dp minimum touch
 * target and keyboard activation. Stance adds semantic variants, sizes, a loading state and token styling.
 *
 * @param loading Shows a progress indicator and ignores taps while keeping the button focusable.
 * Screen readers hear "Loading".
 * @param leadingIcon Decorative icon before the label.
 * @param trailingIcon Decorative icon after the label.
 */
@Composable
public fun StanceButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: StanceButtonVariant = StanceButtonVariant.Primary,
    size: StanceButtonSize = StanceButtonSize.Medium,
    enabled: Boolean = true,
    loading: Boolean = false,
    fullWidth: Boolean = false,
    leadingIcon: ImageVector? = null,
    trailingIcon: ImageVector? = null,
    loadingDescription: String = "Loading",
) {
    val spec = size.spec()
    val colors = StanceTheme.colors
    val border = when {
        variant == StanceButtonVariant.Outline ->
            BorderStroke(StanceTheme.tokens.controlBorderWidth.dp, if (enabled) colors.borderControl else colors.disabledBorder)
        StanceTheme.isHighContrast && variant == StanceButtonVariant.Secondary ->
            BorderStroke(StanceTheme.tokens.controlBorderWidth.dp, colors.borderControl)
        else -> null
    }
    Button(
        onClick = { if (!loading) onClick() },
        modifier = modifier
            .then(if (fullWidth) Modifier.fillMaxWidth() else Modifier)
            .defaultMinSize(minHeight = spec.height)
            .stanceFocusRing(StanceTheme.shapes.medium)
            .then(if (loading) Modifier.semantics { stateDescription = loadingDescription } else Modifier),
        enabled = enabled,
        shape = StanceTheme.shapes.medium,
        colors = variant.colors(),
        border = border,
        contentPadding = spec.padding,
        elevation = null,
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(spec.icon),
                color = LocalContentColor.current,
                strokeWidth = StanceSpacing.space05,
            )
            Spacer(Modifier.width(StanceSpacing.space2))
        } else if (leadingIcon != null) {
            StanceIcon(leadingIcon, contentDescription = null, size = spec.icon)
            Spacer(Modifier.width(StanceSpacing.space2))
        }
        Text(
            text = text,
            style = spec.text,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textDecoration = if (variant == StanceButtonVariant.Link) TextDecoration.Underline else null,
        )
        if (trailingIcon != null && !loading) {
            Spacer(Modifier.width(StanceSpacing.space2))
            StanceIcon(trailingIcon, contentDescription = null, size = spec.icon)
        }
    }
}
