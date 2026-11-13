@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)

package com.bindshq.stance.components.forms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** Matches an option whose label contains the query, ignoring case. The default filter. */
public fun <T> stanceLabelContains(option: StanceSelectOption<T>, query: String): Boolean =
    option.label.contains(query.trim(), ignoreCase = true)

/** The options to show for [query]. A blank query or a null [filter] shows every option. */
internal fun <T> stanceFilterOptions(
    options: List<StanceSelectOption<T>>,
    query: String,
    filter: ((StanceSelectOption<T>, String) -> Boolean)?,
): List<StanceSelectOption<T>> =
    if (filter == null || query.isBlank()) options else options.filter { filter(it, query) }

@Composable
private fun OptionsMessage(text: String) {
    DropdownMenuItem(
        text = { Text(text, style = StanceTheme.typography.bodySmall, color = StanceTheme.colors.fgMuted) },
        onClick = {},
        enabled = false,
        modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
    )
}

/**
 * A text field that filters a list of options as people type, on the Material 3 exposed
 * dropdown menu with an editable anchor, so the keyboard stays open while the list updates.
 *
 * Choosing an option fills the field with its label. When the field loses the selection, for
 * example after clearing it, [onSelect] receives null.
 *
 * @param filter How options match the typed text. Defaults to [stanceLabelContains]. Pass null to
 * show every option, for example when [onQueryChange] runs a server search.
 * @param onQueryChange Called with the typed text, for search that happens elsewhere.
 * @param loading Shows the loading message instead of options.
 */
@Composable
public fun <T> StanceCombobox(
    label: String,
    options: List<StanceSelectOption<T>>,
    selected: T?,
    onSelect: (T?) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    filter: ((StanceSelectOption<T>, String) -> Boolean)? = ::stanceLabelContains,
    onQueryChange: ((String) -> Unit)? = null,
    loading: Boolean = false,
    loadingText: String = stringResource(R.string.stance_loading),
    emptyText: String = stringResource(R.string.stance_no_results),
    clearDescription: String = stringResource(R.string.stance_clear_search),
) {
    val c = StanceTheme.colors
    val selectedLabel = options.firstOrNull { it.value == selected }?.label.orEmpty()
    var text by rememberSaveable(selectedLabel) { mutableStateOf(selectedLabel) }
    var expanded by remember { mutableStateOf(false) }
    // While the field still shows the chosen label, every option is offered, as on the web.
    val query = if (text == selectedLabel) "" else text
    val shown = remember(options, query, filter) { stanceFilterOptions(options, query, filter) }
    StanceFormField(label = label, modifier = modifier, helper = helper, error = error, required = required, enabled = enabled) {
        ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { if (enabled) expanded = it }) {
            OutlinedTextField(
                value = text,
                onValueChange = { value ->
                    text = value
                    expanded = true
                    onQueryChange?.invoke(value)
                    if (value.isEmpty() && selected != null) onSelect(null)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryEditable, enabled)
                    .semantics {
                        contentDescription = label
                        if (error != null) error(error)
                    },
                enabled = enabled,
                textStyle = StanceTheme.typography.body,
                placeholder = placeholder?.let { { Text(it, style = StanceTheme.typography.body) } },
                trailingIcon = if (text.isNotEmpty()) {
                    {
                        StanceIconButton(StanceIcons.X, clearDescription, onClick = {
                            text = ""
                            onQueryChange?.invoke("")
                            if (selected != null) onSelect(null)
                        }, enabled = enabled)
                    }
                } else {
                    { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) }
                },
                isError = error != null,
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                shape = StanceTheme.shapes.medium,
                colors = stanceTextFieldColors(),
            )
            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = {
                    expanded = false
                    // A typed value that matches nothing returns to the chosen label.
                    text = selectedLabel
                },
                shape = StanceTheme.shapes.large,
                containerColor = c.bgOverlay,
            ) {
                when {
                    loading -> OptionsMessage(loadingText)
                    shown.isEmpty() -> OptionsMessage(emptyText)
                    else -> shown.forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option.label, style = StanceTheme.typography.body, color = if (option.enabled) c.fgDefault else c.disabledFg) },
                            onClick = {
                                onSelect(option.value)
                                text = option.label
                                expanded = false
                            },
                            enabled = option.enabled,
                            trailingIcon = if (option.value == selected) {
                                { StanceIcon(StanceIcons.Check, contentDescription = null, size = StanceSizes.iconSmall) }
                            } else {
                                null
                            },
                        )
                    }
                }
            }
        }
    }
}

/**
 * Chooses several values from a list that can be searched. The chosen values show as input
 * chips under the field, each with a named remove button.
 *
 * Built on the Material 3 exposed dropdown menu. The menu stays open while options are toggled,
 * and each option is a checkbox announced with its state.
 *
 * @param searchable Lets people type to filter the options. Otherwise the field shows the count.
 * @param removeDescription Names a chip's remove button, for example "Remove Legal".
 */
@Composable
public fun <T> StanceMultiSelect(
    label: String,
    options: List<StanceSelectOption<T>>,
    selected: Set<T>,
    onSelectedChange: (Set<T>) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = stringResource(R.string.stance_select),
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    searchable: Boolean = true,
    filter: (StanceSelectOption<T>, String) -> Boolean = ::stanceLabelContains,
    emptyText: String = stringResource(R.string.stance_no_results),
    countText: String = pluralStringResource(R.plurals.stance_selected_count, selected.size, selected.size),
    removeDescription: (String) -> String = defaultRemoveDescription(),
) {
    val c = StanceTheme.colors
    var expanded by remember { mutableStateOf(false) }
    var query by rememberSaveable { mutableStateOf("") }
    LaunchedEffect(expanded) { if (!expanded) query = "" }
    val shown = remember(options, query) { stanceFilterOptions(options, query, filter) }
    StanceFormField(label = label, modifier = modifier, helper = helper, error = error, required = required, enabled = enabled) {
        Column(verticalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
            ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { if (enabled) expanded = it }) {
                val editable = searchable && expanded
                OutlinedTextField(
                    value = if (editable) query else if (selected.isEmpty()) "" else countText,
                    onValueChange = { query = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(
                            if (searchable) ExposedDropdownMenuAnchorType.PrimaryEditable else ExposedDropdownMenuAnchorType.PrimaryNotEditable,
                            enabled,
                        )
                        .semantics {
                            contentDescription = label
                            if (error != null) error(error)
                        },
                    enabled = enabled,
                    readOnly = !editable,
                    textStyle = StanceTheme.typography.body,
                    placeholder = { Text(if (editable) stringResource(R.string.stance_search) else placeholder, style = StanceTheme.typography.body) },
                    leadingIcon = if (editable) {
                        { StanceIcon(StanceIcons.Search, contentDescription = null, size = StanceSizes.iconMedium) }
                    } else {
                        null
                    },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    isError = error != null,
                    singleLine = true,
                    shape = StanceTheme.shapes.medium,
                    colors = stanceTextFieldColors(),
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false },
                    shape = StanceTheme.shapes.large,
                    containerColor = c.bgOverlay,
                ) {
                    if (shown.isEmpty()) OptionsMessage(emptyText)
                    shown.forEach { option ->
                        val checked = option.value in selected
                        DropdownMenuItem(
                            text = { Text(option.label, style = StanceTheme.typography.body, color = if (option.enabled) c.fgDefault else c.disabledFg) },
                            onClick = { onSelectedChange(if (checked) selected - option.value else selected + option.value) },
                            enabled = option.enabled,
                            leadingIcon = {
                                Checkbox(
                                    checked = checked,
                                    onCheckedChange = null,
                                    enabled = option.enabled,
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = c.accentBg,
                                        uncheckedColor = c.borderControl,
                                        checkmarkColor = c.accentFg,
                                        disabledCheckedColor = c.disabledFg,
                                        disabledUncheckedColor = c.disabledBorder,
                                    ),
                                )
                            },
                            modifier = Modifier.semantics(mergeDescendants = true) {},
                        )
                    }
                }
            }
            if (selected.isNotEmpty()) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
                    verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                ) {
                    options.filter { it.value in selected }.forEach { option ->
                        StanceInputChip(
                            label = option.label,
                            onRemove = { onSelectedChange(selected - option.value) },
                            removeDescription = removeDescription(option.label),
                            enabled = enabled,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun defaultRemoveDescription(): (String) -> String =
    rememberFromResources { r -> { label -> r.getString(R.string.stance_remove_item, label) } }
