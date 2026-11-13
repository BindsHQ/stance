@file:OptIn(ExperimentalMaterial3Api::class)

package com.bindshq.stance.components.forms

import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.DisplayMode
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

/**
 * Whether a day can be chosen in a [StanceCalendar]: inside [min] and [max] (UTC milliseconds at
 * the start of the day, inclusive) and allowed by [isDateEnabled].
 */
internal fun stanceIsSelectableDay(utcMillis: Long, min: Long?, max: Long?, isDateEnabled: (Long) -> Boolean): Boolean =
    (min == null || utcMillis >= min) && (max == null || utcMillis <= max) && isDateEnabled(utcMillis)

/**
 * An inline month grid for choosing a day, on the Material 3 date picker in its picker display
 * mode without the dialog, title or input toggle.
 *
 * Material provides the month and year navigation, the keyboard and TalkBack semantics for each
 * day. Stance styles it with theme roles and keeps the selection in your state.
 *
 * @param selectedDateMillis The chosen day as UTC milliseconds at the start of the day, or null.
 * @param onDateSelected Called when a day is tapped.
 * @param minDateMillis Earliest day that can be chosen, inclusive.
 * @param maxDateMillis Latest day that can be chosen, inclusive.
 * @param isDateEnabled Further rules, for example weekdays only. Receives UTC milliseconds.
 * @param initialDisplayedMonthMillis The month shown first. Defaults to the chosen day or today.
 */
@Composable
public fun StanceCalendar(
    selectedDateMillis: Long?,
    onDateSelected: (Long?) -> Unit,
    modifier: Modifier = Modifier,
    minDateMillis: Long? = null,
    maxDateMillis: Long? = null,
    isDateEnabled: (Long) -> Boolean = { true },
    initialDisplayedMonthMillis: Long? = selectedDateMillis,
    yearRange: IntRange = DatePickerDefaults.YearRange,
) {
    val rule by rememberUpdatedState(isDateEnabled)
    val selectable = remember(minDateMillis, maxDateMillis) {
        object : SelectableDates {
            override fun isSelectableDate(utcTimeMillis: Long): Boolean =
                stanceIsSelectableDay(utcTimeMillis, minDateMillis, maxDateMillis, rule)

            override fun isSelectableYear(year: Int): Boolean = year in yearRange
        }
    }
    val state = rememberDatePickerState(
        initialSelectedDateMillis = selectedDateMillis,
        initialDisplayedMonthMillis = initialDisplayedMonthMillis,
        yearRange = yearRange,
        initialDisplayMode = DisplayMode.Picker,
        selectableDates = selectable,
    )
    val current by rememberUpdatedState(selectedDateMillis)
    val onSelect by rememberUpdatedState(onDateSelected)
    // The selection is hoisted: a tap is reported, and a change from outside is shown.
    LaunchedEffect(state) {
        snapshotFlow { state.selectedDateMillis }.collect { if (it != current) onSelect(it) }
    }
    LaunchedEffect(selectedDateMillis) {
        if (state.selectedDateMillis != selectedDateMillis) state.selectedDateMillis = selectedDateMillis
    }
    DatePicker(
        state = state,
        modifier = modifier,
        title = null,
        headline = null,
        showModeToggle = false,
        colors = stanceDatePickerColors().copy(containerColor = Color.Transparent),
    )
}
