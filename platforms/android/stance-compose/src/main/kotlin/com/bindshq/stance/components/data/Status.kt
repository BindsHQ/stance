package com.bindshq.stance.components.data

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.bindshq.stance.foundation.StanceSurface
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.foundation.colors
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.tokens.StanceTokens
import com.bindshq.stance.foundation.defaultAvatarSummary

/** How strongly a [StanceBadge] stands out. */
public enum class StanceBadgeVariant { Soft, Solid, Outline }

/**
 * A short status label such as "Live" or "Pending". Pair the tone with words: colour alone is not enough.
 */
@Composable
public fun StanceBadge(
    text: String,
    modifier: Modifier = Modifier,
    tone: StanceTone = StanceTone.Neutral,
    variant: StanceBadgeVariant = StanceBadgeVariant.Soft,
    icon: ImageVector? = null,
) {
    val t = tone.colors()
    val (background, content) = when (variant) {
        StanceBadgeVariant.Soft -> t.background to t.foreground
        StanceBadgeVariant.Solid -> t.solid to t.onSolid
        StanceBadgeVariant.Outline -> Color.Transparent to t.foreground
    }
    val outlined = variant == StanceBadgeVariant.Outline || StanceTheme.isHighContrast
    Row(
        modifier = modifier
            .clip(StanceTheme.shapes.pill)
            .background(background)
            .then(if (outlined) Modifier.border(StanceTheme.tokens.borderWidth.dp, t.border, StanceTheme.shapes.pill) else Modifier)
            .padding(horizontal = StanceSpacing.space2, vertical = StanceSpacing.space05),
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) StanceIcon(icon, contentDescription = null, size = StanceSizes.iconSmall, tint = content)
        Text(text, style = StanceTheme.typography.labelSmall, color = content, maxLines = 1)
    }
}

/**
 * A keyword or category label. For a removable value use `StanceInputChip`.
 */
@Composable
public fun StanceTag(text: String, modifier: Modifier = Modifier, icon: ImageVector? = null) {
    val c = StanceTheme.colors
    StanceSurface(modifier = modifier, shape = StanceTheme.shapes.small, color = c.bgMuted, bordered = true) {
        Row(
            modifier = Modifier.padding(horizontal = StanceSpacing.space2, vertical = StanceSpacing.space1),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (icon != null) StanceIcon(icon, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
            Text(text, style = StanceTheme.typography.labelSmall, color = c.fgDefault, maxLines = 1)
        }
    }
}

/** Diameter of a [StanceAvatar]. */
public enum class StanceAvatarSize(internal val diameter: Dp) {
    Small(StanceTokens.Size.controlSm.dp),
    Medium(StanceTokens.Size.controlMd.dp),
    Large(StanceTokens.Size.controlLg.dp),
}

/** Up to two initials from a person's name. */
public fun stanceInitials(name: String): String =
    name.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }.let { parts ->
        when {
            parts.isEmpty() -> "?"
            parts.size == 1 -> parts[0].take(1)
            else -> parts.first().take(1) + parts.last().take(1)
        }
    }.uppercase()

/**
 * Represents a person with their initials. Announced by name.
 *
 * @param image Optional picture drawn over the initials, for example an image loader composable.
 */
@Composable
public fun StanceAvatar(
    name: String,
    modifier: Modifier = Modifier,
    size: StanceAvatarSize = StanceAvatarSize.Medium,
    image: (@Composable () -> Unit)? = null,
) {
    val c = StanceTheme.colors
    Box(
        modifier = modifier
            .size(size.diameter)
            .clip(CircleShape)
            .background(c.bgEmphasis)
            .border(StanceTheme.tokens.borderWidth.dp, c.borderDefault, CircleShape)
            .clearAndSetSemantics { contentDescription = name },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            stanceInitials(name),
            style = if (size == StanceAvatarSize.Small) StanceTheme.typography.labelSmall else StanceTheme.typography.label,
            color = c.fgDefault,
        )
        image?.invoke()
    }
}

/**
 * A stack of avatars with a "+N" counter for the rest. Announced as one summary,
 * for example "Amara Okafor, Lukas Brenner and 3 more".
 */
@Composable
public fun StanceAvatarGroup(
    names: List<String>,
    modifier: Modifier = Modifier,
    max: Int = 4,
    size: StanceAvatarSize = StanceAvatarSize.Medium,
    summary: (shown: List<String>, remaining: Int) -> String = defaultAvatarSummary(),
) {
    val c = StanceTheme.colors
    val shown = names.take(max)
    val remaining = names.size - shown.size
    val overlap = size.diameter / 4
    Row(modifier = modifier.clearAndSetSemantics { contentDescription = summary(shown, remaining) }) {
        shown.forEachIndexed { index, name ->
            Box(
                modifier = Modifier
                    .offset(x = -overlap * index)
                    .border(BorderStroke(StanceSpacing.space05, c.bgSurface), CircleShape),
            ) { StanceAvatar(name, size = size) }
        }
        if (remaining > 0) {
            Box(
                modifier = Modifier
                    .offset(x = -overlap * shown.size)
                    .size(size.diameter)
                    .clip(CircleShape)
                    .background(c.bgMuted)
                    .border(BorderStroke(StanceSpacing.space05, c.bgSurface), CircleShape),
                contentAlignment = Alignment.Center,
            ) { Text("+$remaining", style = StanceTheme.typography.labelSmall, color = c.fgDefault) }
        }
        Spacer(Modifier.width(StanceSpacing.none))
    }
}
