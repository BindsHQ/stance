@file:OptIn(ExperimentalMaterial3Api::class)

package com.bindshq.stance.components.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.PermanentDrawerSheet
import androidx.compose.material3.PermanentNavigationDrawer
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.TopAppBarScrollBehavior
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.foundation.StanceScaffold
import com.bindshq.stance.foundation.StanceWindowWidth
import com.bindshq.stance.foundation.rememberStanceWindowWidth
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import androidx.compose.ui.res.stringResource
import com.bindshq.stance.R

/** A top-level destination. */
@Immutable
public data class StanceNavigationItem(
    val label: String,
    val icon: ImageVector,
    /** Shown as a badge, for example an unread count. */
    val badge: String? = null,
)

@Composable
private fun NavIcon(item: StanceNavigationItem) {
    if (item.badge != null) {
        BadgedBox(badge = {
            Badge(containerColor = StanceTheme.colors.dangerSolid, contentColor = StanceTheme.colors.dangerOnSolid) { Text(item.badge) }
        }) { StanceIcon(item.icon, contentDescription = null, size = StanceSizes.iconLarge) }
    } else {
        StanceIcon(item.icon, contentDescription = null, size = StanceSizes.iconLarge)
    }
}

/**
 * Bottom navigation for three to five top-level destinations on compact screens.
 */
@Composable
public fun StanceNavigationBar(
    items: List<StanceNavigationItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = StanceTheme.colors
    NavigationBar(modifier = modifier, containerColor = c.bgSurface, contentColor = c.fgDefault, tonalElevation = StanceTheme.elevation.none.shadow) {
        items.forEachIndexed { index, item ->
            NavigationBarItem(
                selected = index == selectedIndex,
                onClick = { onSelect(index) },
                icon = { NavIcon(item) },
                label = { Text(item.label, style = StanceTheme.typography.labelSmall, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = c.accentFg,
                    selectedTextColor = c.fgDefault,
                    indicatorColor = c.accentBg,
                    unselectedIconColor = c.fgMuted,
                    unselectedTextColor = c.fgMuted,
                ),
            )
        }
    }
}

/**
 * Side navigation for medium-width windows such as tablets in portrait and unfolded foldables.
 */
@Composable
public fun StanceNavigationRail(
    items: List<StanceNavigationItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    header: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val c = StanceTheme.colors
    NavigationRail(modifier = modifier, containerColor = c.bgSurface, contentColor = c.fgDefault, header = header) {
        items.forEachIndexed { index, item ->
            NavigationRailItem(
                selected = index == selectedIndex,
                onClick = { onSelect(index) },
                icon = { NavIcon(item) },
                label = { Text(item.label, style = StanceTheme.typography.labelSmall, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                colors = NavigationRailItemDefaults.colors(
                    selectedIconColor = c.accentFg,
                    selectedTextColor = c.fgDefault,
                    indicatorColor = c.accentBg,
                    unselectedIconColor = c.fgMuted,
                    unselectedTextColor = c.fgMuted,
                ),
            )
        }
    }
}

/**
 * A permanent navigation drawer for expanded windows. The selected item is filled with the accent colour.
 */
@Composable
public fun StanceNavigationDrawer(
    items: List<StanceNavigationItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    header: (@Composable ColumnScope.() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    val c = StanceTheme.colors
    PermanentNavigationDrawer(
        modifier = modifier,
        drawerContent = {
            PermanentDrawerSheet(
                modifier = Modifier.width(StanceSizes.drawerWidth),
                drawerContainerColor = c.bgSurface,
                drawerContentColor = c.fgDefault,
            ) {
                Column(modifier = Modifier.fillMaxHeight().padding(StanceSpacing.space3)) {
                    header?.invoke(this)
                    Spacer(Modifier.height(StanceSpacing.space2))
                    items.forEachIndexed { index, item ->
                        NavigationDrawerItem(
                            label = { Text(item.label, style = StanceTheme.typography.label) },
                            selected = index == selectedIndex,
                            onClick = { onSelect(index) },
                            icon = { StanceIcon(item.icon, contentDescription = null) },
                            badge = item.badge?.let { { Text(it, style = StanceTheme.typography.labelSmall) } },
                            shape = StanceTheme.shapes.medium,
                            colors = NavigationDrawerItemDefaults.colors(
                                selectedContainerColor = c.accentBg,
                                selectedIconColor = c.accentFg,
                                selectedTextColor = c.accentFg,
                                selectedBadgeColor = c.accentFg,
                                unselectedIconColor = c.fgMuted,
                                unselectedTextColor = c.fgDefault,
                                unselectedBadgeColor = c.fgMuted,
                            ),
                        )
                    }
                }
            }
        },
        content = content,
    )
}

/**
 * Top-level navigation that adapts to the window: a bottom bar on compact widths, a rail on
 * medium widths and a permanent drawer on expanded widths. Destinations keep their order and
 * selection across layouts, so rotating or unfolding the device never loses the person's place.
 *
 * @param topBar Shown above the content in every layout.
 */
@Composable
public fun StanceAdaptiveNavigation(
    items: List<StanceNavigationItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    windowWidth: StanceWindowWidth = rememberStanceWindowWidth(),
    topBar: @Composable () -> Unit = {},
    snackbarHostState: androidx.compose.material3.SnackbarHostState? = null,
    header: (@Composable ColumnScope.() -> Unit)? = null,
    content: @Composable (PaddingValues) -> Unit,
) {
    when (windowWidth) {
        StanceWindowWidth.Compact -> StanceScaffold(
            modifier = modifier,
            topBar = topBar,
            bottomBar = { StanceNavigationBar(items, selectedIndex, onSelect) },
            snackbarHostState = snackbarHostState,
            content = content,
        )

        StanceWindowWidth.Medium -> Row(modifier = modifier.fillMaxSize()) {
            StanceNavigationRail(items, selectedIndex, onSelect, header = header)
            StanceScaffold(topBar = topBar, snackbarHostState = snackbarHostState, content = content)
        }

        StanceWindowWidth.Expanded -> StanceNavigationDrawer(items, selectedIndex, onSelect, modifier = modifier, header = header) {
            StanceScaffold(topBar = topBar, snackbarHostState = snackbarHostState, content = content)
        }
    }
}

/** Layout of a [StanceTopAppBar]. */
public enum class StanceTopAppBarStyle { Small, CenterAligned, Large }

/**
 * The bar at the top of a screen: title, navigation and up to a few actions.
 * The title is a heading for screen readers.
 *
 * @param onNavigateUp When set, shows a back arrow. System back and predictive back are handled
 * by the navigation host, not by this bar.
 */
@Composable
public fun StanceTopAppBar(
    title: String,
    modifier: Modifier = Modifier,
    style: StanceTopAppBarStyle = StanceTopAppBarStyle.Small,
    onNavigateUp: (() -> Unit)? = null,
    navigateUpDescription: String = stringResource(R.string.stance_navigate_up),
    actions: @Composable RowScope.() -> Unit = {},
) {
    StanceTopAppBar(title, scrollBehavior = null, modifier, style, onNavigateUp, navigateUpDescription, actions)
}

/**
 * [StanceTopAppBar] with a Material scroll behaviour, for bars that collapse or lift on scroll.
 * Marked experimental because the Material scroll behaviour API is.
 */
@ExperimentalMaterial3Api
@Composable
public fun StanceTopAppBar(
    title: String,
    scrollBehavior: TopAppBarScrollBehavior?,
    modifier: Modifier = Modifier,
    style: StanceTopAppBarStyle = StanceTopAppBarStyle.Small,
    onNavigateUp: (() -> Unit)? = null,
    navigateUpDescription: String = stringResource(R.string.stance_navigate_up),
    actions: @Composable RowScope.() -> Unit = {},
) {
    val windowInsets = TopAppBarDefaults.windowInsets
    val c = StanceTheme.colors
    val colors = TopAppBarDefaults.topAppBarColors(
        containerColor = c.bgCanvas,
        scrolledContainerColor = c.bgSurface,
        navigationIconContentColor = c.fgDefault,
        titleContentColor = c.fgDefault,
        actionIconContentColor = c.fgDefault,
    )
    val titleContent: @Composable () -> Unit = {
        Text(
            title,
            style = if (style == StanceTopAppBarStyle.Large) StanceTheme.typography.headingLarge else StanceTheme.typography.headingSmall,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.semantics { heading() },
        )
    }
    val navigationIcon: @Composable () -> Unit = {
        if (onNavigateUp != null) StanceIconButton(StanceIcons.ArrowLeft, navigateUpDescription, onNavigateUp)
    }
    when (style) {
        StanceTopAppBarStyle.Small ->
            TopAppBar(titleContent, modifier, navigationIcon, actions, windowInsets = windowInsets, colors = colors, scrollBehavior = scrollBehavior)
        StanceTopAppBarStyle.CenterAligned ->
            CenterAlignedTopAppBar(titleContent, modifier, navigationIcon, actions, windowInsets = windowInsets, colors = colors, scrollBehavior = scrollBehavior)
        StanceTopAppBarStyle.Large ->
            LargeTopAppBar(titleContent, modifier, navigationIcon, actions, windowInsets = windowInsets, colors = colors, scrollBehavior = scrollBehavior)
    }
}

/** Convenience for content that must avoid system bars when not using [StanceScaffold]. */
@Composable
public fun StanceSafeArea(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(modifier = modifier.padding(WindowInsets.safeDrawing.asPaddingValuesInternal())) { content() }
}

@Composable
private fun WindowInsets.asPaddingValuesInternal(): PaddingValues {
    val density = androidx.compose.ui.platform.LocalDensity.current
    val direction = androidx.compose.ui.platform.LocalLayoutDirection.current
    // Insets are physical edges, so they map to absolute padding and must not swap in right to left.
    return with(density) {
        PaddingValues.Absolute(
            left = getLeft(this, direction).toDp(),
            top = getTop(this).toDp(),
            right = getRight(this, direction).toDp(),
            bottom = getBottom(this).toDp(),
        )
    }
}
