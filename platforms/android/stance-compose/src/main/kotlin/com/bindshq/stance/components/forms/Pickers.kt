@file:OptIn(ExperimentalMaterial3Api::class)

package com.bindshq.stance.components.forms

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DateRangePicker
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TimePicker
import androidx.compose.material3.TimePickerDefaults
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberDateRangePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceTheme
import java.text.DateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import androidx.compose.ui.res.stringResource
import com.bindshq.stance.R
import com.bindshq.stance.foundation.defaultDateRangeText

/** A read-only field that opens a picker when tapped or activated from the keyboard. */
@Composable
private fun PickerField(
    label: String,
    text: String,
    placeholder: String,
    icon: ImageVector,
    onOpen: () -> Unit,
    modifier: Modifier,
    helper: String?,
    error: String?,
    required: Boolean,
    enabled: Boolean,
) {
    val interactions = remember { MutableInteractionSource() }
    LaunchedEffect(interactions, enabled) {
        interactions.interactions.collect { if (it is PressInteraction.Release && enabled) onOpen() }
    }
    StanceFormField(label = label, modifier = modifier, helper = helper, error = error, required = required, enabled = enabled) {
        OutlinedTextField(
            value = text,
            onValueChange = {},
            modifier = Modifier
                .fillMaxWidth()
                .semantics {
                    contentDescription = label
                    if (error != null) error(error)
                },
            enabled = enabled,
            readOnly = true,
            textStyle = StanceTheme.typography.body,
            placeholder = { Text(placeholder, style = StanceTheme.typography.body) },
            trailingIcon = { StanceIcon(icon, contentDescription = null) },
            isError = error != null,
            singleLine = true,
            interactionSource = interactions,
            shape = StanceTheme.shapes.medium,
            colors = stanceTextFieldColors(),
        )
    }
}

@Composable
internal fun stanceDatePickerColors() = StanceTheme.colors.let { c ->
    DatePickerDefaults.colors(
        containerColor = c.bgOverlay,
        titleContentColor = c.fgMuted,
        headlineContentColor = c.fgDefault,
        weekdayContentColor = c.fgMuted,
        dayContentColor = c.fgDefault,
        selectedDayContainerColor = c.accentBg,
        selectedDayContentColor = c.accentFg,
        todayContentColor = c.fgDefault,
        todayDateBorderColor = c.borderControl,
        dayInSelectionRangeContainerColor = c.interactiveSelected,
        dayInSelectionRangeContentColor = c.interactiveSelectedFg,
    )
}

private fun formatDate(millis: Long, locale: Locale): String =
    DateFormat.getDateInstance(DateFormat.MEDIUM, locale).apply { timeZone = TimeZone.getTimeZone("UTC") }.format(Date(millis))

/**
 * A date field that opens the platform Material date picker in a dialog.
 *
 * @param selectedDateMillis The selected day as UTC milliseconds at the start of the day, or null.
 */
@Composable
public fun StanceDatePicker(
    label: String,
    selectedDateMillis: Long?,
    onDateSelected: (Long?) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = stringResource(R.string.stance_select_date),
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    confirmLabel: String = stringResource(R.string.stance_ok),
    cancelLabel: String = stringResource(R.string.stance_cancel),
    locale: Locale = Locale.getDefault(),
) {
    var open by remember { mutableStateOf(false) }
    PickerField(
        label, selectedDateMillis?.let { formatDate(it, locale) }.orEmpty(), placeholder, StanceIcons.Calendar,
        { open = true }, modifier, helper, error, required, enabled,
    )
    if (open) {
        val state = rememberDatePickerState(initialSelectedDateMillis = selectedDateMillis)
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                StanceButton(confirmLabel, onClick = {
                    onDateSelected(state.selectedDateMillis)
                    open = false
                }, variant = StanceButtonVariant.Ghost)
            },
            dismissButton = { StanceButton(cancelLabel, onClick = { open = false }, variant = StanceButtonVariant.Ghost) },
            shape = StanceTheme.shapes.extraLarge,
            colors = stanceDatePickerColors(),
        ) {
            DatePicker(state = state, colors = stanceDatePickerColors())
        }
    }
}

/**
 * A field for a start and end date that opens the Material date range picker.
 *
 * @param rangeText Joins the formatted start and end dates, for example "1 Mar to 8 Mar".
 */
@Composable
public fun StanceDateRangePicker(
    label: String,
    startDateMillis: Long?,
    endDateMillis: Long?,
    onRangeSelected: (start: Long?, end: Long?) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = stringResource(R.string.stance_select_dates),
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    confirmLabel: String = stringResource(R.string.stance_ok),
    cancelLabel: String = stringResource(R.string.stance_cancel),
    locale: Locale = Locale.getDefault(),
    rangeText: (start: String, end: String) -> String = defaultDateRangeText(),
) {
    var open by remember { mutableStateOf(false) }
    val text = if (startDateMillis != null && endDateMillis != null) {
        rangeText(formatDate(startDateMillis, locale), formatDate(endDateMillis, locale))
    } else {
        ""
    }
    PickerField(label, text, placeholder, StanceIcons.Calendar, { open = true }, modifier, helper, error, required, enabled)
    if (open) {
        val state = rememberDateRangePickerState(
            initialSelectedStartDateMillis = startDateMillis,
            initialSelectedEndDateMillis = endDateMillis,
        )
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                StanceButton(confirmLabel, onClick = {
                    onRangeSelected(state.selectedStartDateMillis, state.selectedEndDateMillis)
                    open = false
                }, variant = StanceButtonVariant.Ghost)
            },
            dismissButton = { StanceButton(cancelLabel, onClick = { open = false }, variant = StanceButtonVariant.Ghost) },
            shape = StanceTheme.shapes.extraLarge,
            colors = stanceDatePickerColors(),
        ) {
            DateRangePicker(
                state = state,
                modifier = Modifier.heightIn(max = StanceSizes.pickerMaxHeight),
                colors = stanceDatePickerColors(),
            )
        }
    }
}

/**
 * A time field that opens the Material time picker. Follows the device's 12 or 24 hour setting
 * unless [is24Hour] is given.
 */
@Composable
public fun StanceTimePicker(
    label: String,
    hour: Int?,
    minute: Int?,
    onTimeSelected: (hour: Int, minute: Int) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = stringResource(R.string.stance_select_time),
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    is24Hour: Boolean = true,
    confirmLabel: String = stringResource(R.string.stance_ok),
    cancelLabel: String = stringResource(R.string.stance_cancel),
) {
    var open by remember { mutableStateOf(false) }
    val text = if (hour != null && minute != null) String.format(Locale.ROOT, "%02d:%02d", hour, minute) else ""
    PickerField(label, text, placeholder, StanceIcons.Clock, { open = true }, modifier, helper, error, required, enabled)
    if (open) {
        val c = StanceTheme.colors
        val state = rememberTimePickerState(initialHour = hour ?: 9, initialMinute = minute ?: 0, is24Hour = is24Hour)
        AlertDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                StanceButton(confirmLabel, onClick = {
                    onTimeSelected(state.hour, state.minute)
                    open = false
                }, variant = StanceButtonVariant.Ghost)
            },
            dismissButton = { StanceButton(cancelLabel, onClick = { open = false }, variant = StanceButtonVariant.Ghost) },
            title = { Text(label, style = StanceTheme.typography.headingSmall) },
            text = {
                TimePicker(
                    state = state,
                    colors = TimePickerDefaults.colors(
                        clockDialColor = c.bgMuted,
                        clockDialSelectedContentColor = c.accentFg,
                        clockDialUnselectedContentColor = c.fgDefault,
                        selectorColor = c.accentBg,
                        containerColor = c.bgOverlay,
                        timeSelectorSelectedContainerColor = c.interactiveSelected,
                        timeSelectorSelectedContentColor = c.interactiveSelectedFg,
                        timeSelectorUnselectedContainerColor = c.bgMuted,
                        timeSelectorUnselectedContentColor = c.fgDefault,
                        periodSelectorSelectedContainerColor = c.interactiveSelected,
                        periodSelectorSelectedContentColor = c.interactiveSelectedFg,
                        periodSelectorUnselectedContentColor = c.fgMuted,
                        periodSelectorBorderColor = c.borderControl,
                    ),
                )
            },
            shape = StanceTheme.shapes.extraLarge,
            containerColor = c.bgOverlay,
            titleContentColor = c.fgDefault,
        )
    }
}

/** One option in a [StanceSelect]. */
public data class StanceSelectOption<T>(val value: T, val label: String, val enabled: Boolean = true)

/**
 * Chooses one value from a list using the platform exposed dropdown menu.
 */
@Composable
public fun <T> StanceSelect(
    label: String,
    options: List<StanceSelectOption<T>>,
    selected: T?,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = stringResource(R.string.stance_select),
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
) {
    var expanded by remember { mutableStateOf(false) }
    val c = StanceTheme.colors
    StanceFormField(label = label, modifier = modifier, helper = helper, error = error, required = required, enabled = enabled) {
        ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { if (enabled) expanded = it }) {
            OutlinedTextField(
                value = options.firstOrNull { it.value == selected }?.label.orEmpty(),
                onValueChange = {},
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable, enabled)
                    .semantics {
                        contentDescription = label
                        if (error != null) error(error)
                    },
                enabled = enabled,
                readOnly = true,
                textStyle = StanceTheme.typography.body,
                placeholder = { Text(placeholder, style = StanceTheme.typography.body) },
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
                options.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option.label, style = StanceTheme.typography.body, color = if (option.enabled) c.fgDefault else c.disabledFg) },
                        onClick = {
                            onSelect(option.value)
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
