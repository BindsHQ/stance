package com.bindshq.stance.foundation

import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.expandHorizontally
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkHorizontally
import androidx.compose.animation.shrinkVertically
import com.bindshq.stance.theme.StanceMotion

// Shared enter and exit transitions built from the motion tokens. With reduced motion
// (animator duration scale 0) they are None, so state changes apply at once.

internal fun StanceMotion.fadeEnter(): EnterTransition = if (reduceMotion) EnterTransition.None else fadeIn(normal())

internal fun StanceMotion.fadeExit(): ExitTransition = if (reduceMotion) ExitTransition.None else fadeOut(exit())

/** Content that appears in a vertical flow and pushes what follows it. */
internal fun StanceMotion.expandEnter(): EnterTransition =
    if (reduceMotion) EnterTransition.None else fadeIn(normal()) + expandVertically(normal())

internal fun StanceMotion.shrinkExit(): ExitTransition =
    if (reduceMotion) ExitTransition.None else fadeOut(exit()) + shrinkVertically(exit())

/** Content that appears in a row, such as a trailing action. */
internal fun StanceMotion.expandHorizontalEnter(): EnterTransition =
    if (reduceMotion) EnterTransition.None else fadeIn(normal()) + expandHorizontally(normal())

internal fun StanceMotion.shrinkHorizontalExit(): ExitTransition =
    if (reduceMotion) ExitTransition.None else fadeOut(exit()) + shrinkHorizontally(exit())
