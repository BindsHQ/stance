package com.bindshq.stance.foundation

import android.content.res.Resources
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalResources
import com.bindshq.stance.R
import com.bindshq.stance.components.navigation.StanceStepState

/**
 * Remembers a value built from the current [Resources], rebuilt when the configuration
 * (and so the locale) changes. Used for defaults of formatter parameters that are plain lambdas.
 */
@Composable
internal fun <T> rememberFromResources(block: (Resources) -> T): T {
    val configuration = LocalConfiguration.current
    val resources = LocalResources.current
    return remember(configuration, resources) { block(resources) }
}

@Composable
internal fun defaultPageDescription(): (current: Int, count: Int) -> String =
    rememberFromResources { r -> { current, count -> r.getString(R.string.stance_page_of, current, count) } }

@Composable
internal fun defaultStepDescription(): (step: Int, count: Int, label: String) -> String =
    rememberFromResources { r -> { step, count, label -> r.getString(R.string.stance_step_of, step, count, label) } }

@Composable
internal fun defaultStepStateLabel(): (StanceStepState) -> String = rememberFromResources { r ->
    { state ->
        r.getString(
            when (state) {
                StanceStepState.Complete -> R.string.stance_step_complete
                StanceStepState.Current -> R.string.stance_step_current
                StanceStepState.Upcoming -> R.string.stance_step_upcoming
                StanceStepState.Error -> R.string.stance_step_error
            },
        )
    }
}

@Composable
internal fun defaultResultsDescription(): (Int) -> String =
    rememberFromResources { r -> { count -> r.getQuantityString(R.plurals.stance_results, count, count) } }

@Composable
internal fun defaultEmptyDescription(): (String) -> String =
    rememberFromResources { r -> { query -> r.getString(R.string.stance_nothing_matches, query) } }

@Composable
internal fun defaultDateRangeText(): (start: String, end: String) -> String =
    rememberFromResources { r -> { start, end -> r.getString(R.string.stance_date_range, start, end) } }

@Composable
internal fun defaultAvatarSummary(): (shown: List<String>, remaining: Int) -> String = rememberFromResources { r ->
    { shown, remaining ->
        val names = shown.joinToString(r.getString(R.string.stance_list_separator))
        if (remaining > 0) r.getQuantityString(R.plurals.stance_names_and_more, remaining, names, remaining) else names
    }
}
