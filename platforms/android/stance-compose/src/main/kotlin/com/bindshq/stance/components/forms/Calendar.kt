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
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.snapshotFlow
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

/**
 * Whether a day can be chosen in a [StanceCalendar]: inside [min] and [max] (UTC milliseconds at
 * the start of the day, inclusive) and allowed by [isDateEnabled].
 */
internal fun stanceIsSelectableDay(utcMillis: Long, min: Long?, max: Long?, isDateEnabled: (Long) -> Boolean): Boolean =
    (min == null || utcMillis >= min) && (max == null || utcMillis <= max) && isDateEnabled(utcMillis)

/**
 * Pins what the Stance date components take as today: UTC milliseconds at the start of the day,
 * or null, the default, for the device clock.
 *
 * Provide it where the output must not depend on the day it is produced, such as documentation
 * previews and screenshot tests:
 *
 * ```
 * CompositionLocalProvider(LocalStanceToday provides fixedDay) { StanceCalendar(...) }
 * ```
 *
 * With a pinned day, [StanceCalendar], [StanceDatePicker] and [StanceDateRangePicker] open on its
 * month when nothing is chosen and draw no today marker. Material reads the marker from the device
 * clock and has no parameter for it, so hiding it is what keeps two runs on different days identical.
 */
public val LocalStanceToday: ProvidableCompositionLocal<Long?> = staticCompositionLocalOf { null }

/** The month a date component shows first: the chosen day, else the pinned today, else Material's default. */
internal fun stanceInitialMonth(selectedMillis: Long?, todayMillis: Long?): Long? = selectedMillis ?: todayMillis

/** Whether Material's today marker is drawn. It follows the device clock, so a pinned today turns it off. */
internal fun stanceShowsTodayMarker(todayMillis: Long?): Boolean = todayMillis == null

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
 * @param todayMillis Pins today, as [LocalStanceToday] does. Null follows the device clock.
 */
@Composable
public fun StanceCalendar(
    selectedDateMillis: Long?,
    onDateSelected: (Long?) -> Unit,
    modifier: Modifier = Modifier,
    minDateMillis: Long? = null,
    maxDateMillis: Long? = null,
    isDateEnabled: (Long) -> Boolean = { true },
    todayMillis: Long? = LocalStanceToday.current,
    initialDisplayedMonthMillis: Long? = stanceInitialMonth(selectedDateMillis, todayMillis),
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
        colors = stanceDatePickerColors(todayMillis).copy(containerColor = Color.Transparent),
    )
}
