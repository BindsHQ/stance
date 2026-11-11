package com.bindshq.stance.foundation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyGridScope
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.bindshq.stance.components.feedback.StanceSnackbarHost
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/**
 * Window width classes following the Android large-screen guidance:
 * compact below 600dp, medium below 840dp, expanded from 840dp.
 */
public enum class StanceWindowWidth {
    Compact,
    Medium,
    Expanded,
    ;

    public companion object {
        public fun fromWidth(width: Dp): StanceWindowWidth = when {
            width < MEDIUM_MIN -> Compact
            width < EXPANDED_MIN -> Medium
            else -> Expanded
        }

        private val MEDIUM_MIN = 600.dp
        private val EXPANDED_MIN = 840.dp
    }
}

/** The width class of the current window. Updates on rotation, multi-window and fold changes. */
@Composable
public fun rememberStanceWindowWidth(): StanceWindowWidth {
    val widthPx = LocalWindowInfo.current.containerSize.width
    val width = with(LocalDensity.current) { widthPx.toDp() }
    return StanceWindowWidth.fromWidth(width)
}

/**
 * The page frame: draws edge to edge on the Stance canvas colour and hands the system-bar,
 * cutout and keyboard insets to [content] as padding.
 *
 * @param snackbarHostState When set, a [StanceSnackbarHost] is placed above the bottom bar.
 */
@Composable
public fun StanceScaffold(
    modifier: Modifier = Modifier,
    topBar: @Composable () -> Unit = {},
    bottomBar: @Composable () -> Unit = {},
    floatingActionButton: @Composable () -> Unit = {},
    snackbarHostState: SnackbarHostState? = null,
    contentWindowInsets: WindowInsets = WindowInsets.safeDrawing,
    content: @Composable (PaddingValues) -> Unit,
) {
    Scaffold(
        modifier = modifier,
        topBar = topBar,
        bottomBar = bottomBar,
        floatingActionButton = floatingActionButton,
        snackbarHost = { if (snackbarHostState != null) StanceSnackbarHost(snackbarHostState) },
        containerColor = StanceTheme.colors.bgCanvas,
        contentColor = StanceTheme.colors.fgDefault,
        contentWindowInsets = contentWindowInsets,
        content = content,
    )
}

/**
 * A lazy grid that fits as many columns of at least [minColumnWidth] as the window allows,
 * so the same screen works on phones, tablets and foldables.
 */
@Composable
public fun StanceAdaptiveGrid(
    modifier: Modifier = Modifier,
    minColumnWidth: Dp = 280.dp,
    contentPadding: PaddingValues = PaddingValues(StanceSpacing.space4),
    spacing: Dp = StanceSpacing.space3,
    content: LazyGridScope.() -> Unit,
) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minColumnWidth),
        modifier = modifier,
        contentPadding = contentPadding,
        horizontalArrangement = Arrangement.spacedBy(spacing),
        verticalArrangement = Arrangement.spacedBy(spacing),
        content = content,
    )
}
