package com.bindshq.stance.components.forms

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.state.ToggleableState
import com.bindshq.stance.R
import com.bindshq.stance.theme.StanceSpacing

/** One option in a [StanceCheckboxGroup]. */
@Immutable
public data class StanceCheckboxOption<T>(val value: T, val label: String, val description: String? = null, val enabled: Boolean = true)

/** The state of a select all checkbox: on when every enabled option is chosen, mixed when some are. */
internal fun <T> stanceSelectAllState(options: List<StanceCheckboxOption<T>>, selected: Set<T>): ToggleableState {
    val enabled = options.filter { it.enabled }.map { it.value }
    val chosen = enabled.count { it in selected }
    return when {
        enabled.isEmpty() || chosen == 0 -> ToggleableState.Off
        chosen == enabled.size -> ToggleableState.On
        else -> ToggleableState.Indeterminate
    }
}

/**
 * The selection after select all is tapped. From off or mixed it chooses every enabled option;
 * from on it clears them. Disabled options keep their state.
 */
internal fun <T> stanceToggleAll(options: List<StanceCheckboxOption<T>>, selected: Set<T>): Set<T> {
    val enabled = options.filter { it.enabled }.map { it.value }.toSet()
    return if (stanceSelectAllState(options, selected) == ToggleableState.On) selected - enabled else selected + enabled
}

/**
 * A labelled set of checkboxes for choosing any number of options.
 *
 * Laid out by [StanceFormField], so the error is announced and the required marker is read.
 * With [selectAll] a tri state checkbox above the options chooses or clears them all and
 * shows a mixed state when only some are chosen.
 *
 * @param selected The chosen values.
 * @param onSelectedChange Called with the new set of chosen values.
 * @param selectAll Shows a select all checkbox above the options.
 */
@Composable
public fun <T> StanceCheckboxGroup(
    label: String,
    options: List<StanceCheckboxOption<T>>,
    selected: Set<T>,
    onSelectedChange: (Set<T>) -> Unit,
    modifier: Modifier = Modifier,
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    selectAll: Boolean = false,
    selectAllLabel: String = stringResource(R.string.stance_select_all),
) {
    StanceFormField(label = label, modifier = modifier, helper = helper, error = error, required = required, enabled = enabled) {
        Column(modifier = Modifier.semantics { contentDescription = label; isTraversalGroup = true }) {
            if (selectAll) {
                StanceCheckbox(
                    label = selectAllLabel,
                    state = stanceSelectAllState(options, selected),
                    onClick = { onSelectedChange(stanceToggleAll(options, selected)) },
                    enabled = enabled && options.any { it.enabled },
                )
            }
            Column(modifier = if (selectAll) Modifier.padding(start = StanceSpacing.space6) else Modifier) {
                options.forEach { option ->
                    StanceCheckbox(
                        label = option.label,
                        checked = option.value in selected,
                        onCheckedChange = { on -> onSelectedChange(if (on) selected + option.value else selected - option.value) },
                        description = option.description,
                        enabled = enabled && option.enabled,
                    )
                }
            }
        }
    }
}
