package com.bindshq.stance.components.forms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.selection.triStateToggleable
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.RangeSlider
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TriStateCheckbox
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.state.ToggleableState
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import androidx.compose.ui.res.stringResource
import com.bindshq.stance.R

@Composable
private fun ChoiceLabel(label: String, description: String?, enabled: Boolean, modifier: Modifier = Modifier) {
    val c = StanceTheme.colors
    Column(modifier = modifier) {
        Text(label, style = StanceTheme.typography.body, color = if (enabled) c.fgDefault else c.fgDisabled)
        if (description != null) {
            Text(description, style = StanceTheme.typography.caption, color = if (enabled) c.fgMuted else c.fgDisabled)
        }
    }
}

/**
 * A checkbox with its label. The whole row is one toggle target, announced once with its label and state.
 *
 * @param state Use [ToggleableState.Indeterminate] for a partially selected group.
 */
@Composable
public fun StanceCheckbox(
    label: String,
    state: ToggleableState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    enabled: Boolean = true,
) {
    val c = StanceTheme.colors
    Row(
        modifier = modifier
            .heightIn(min = StanceSizes.touchTarget)
            .triStateToggleable(state = state, enabled = enabled, role = Role.Checkbox, onClick = onClick),
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        TriStateCheckbox(
            state = state,
            onClick = null,
            enabled = enabled,
            colors = CheckboxDefaults.colors(
                checkedColor = c.accentBg,
                uncheckedColor = c.borderControl,
                checkmarkColor = c.accentFg,
                disabledCheckedColor = c.disabledFg,
                disabledUncheckedColor = c.disabledBorder,
                disabledIndeterminateColor = c.disabledFg,
            ),
        )
        ChoiceLabel(label, description, enabled)
    }
}

/** A checkbox with a boolean value. */
@Composable
public fun StanceCheckbox(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    enabled: Boolean = true,
) {
    StanceCheckbox(
        label = label,
        state = if (checked) ToggleableState.On else ToggleableState.Off,
        onClick = { onCheckedChange(!checked) },
        modifier = modifier,
        description = description,
        enabled = enabled,
    )
}

/** One option in a [StanceRadioGroup]. */
public data class StanceRadioOption<T>(val value: T, val label: String, val description: String? = null, val enabled: Boolean = true)

/**
 * A set of mutually exclusive options. Announced as a group with the [label];
 * each row is one radio target with its label and selected state.
 */
@Composable
public fun <T> StanceRadioGroup(
    label: String,
    options: List<StanceRadioOption<T>>,
    selected: T?,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    error: String? = null,
    enabled: Boolean = true,
) {
    val c = StanceTheme.colors
    StanceFormField(label = label, modifier = modifier, error = error, enabled = enabled) {
        Column(modifier = Modifier.selectableGroup().semantics { contentDescription = label }) {
            options.forEach { option ->
                val optionEnabled = enabled && option.enabled
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = StanceSizes.touchTarget)
                        .selectable(
                            selected = option.value == selected,
                            enabled = optionEnabled,
                            role = Role.RadioButton,
                            onClick = { onSelect(option.value) },
                        ),
                    horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space3),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    RadioButton(
                        selected = option.value == selected,
                        onClick = null,
                        enabled = optionEnabled,
                        colors = RadioButtonDefaults.colors(
                            selectedColor = c.accentBg,
                            unselectedColor = c.borderControl,
                            disabledSelectedColor = c.disabledFg,
                            disabledUnselectedColor = c.disabledBorder,
                        ),
                    )
                    ChoiceLabel(option.label, option.description, optionEnabled)
                }
            }
        }
    }
}

/**
 * A switch with its label for settings that apply immediately.
 * The whole row is the toggle target and is announced as a switch with "On" or "Off".
 */
@Composable
public fun StanceSwitch(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    enabled: Boolean = true,
) {
    val c = StanceTheme.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = StanceSizes.touchTarget)
            .toggleable(value = checked, enabled = enabled, role = Role.Switch, onValueChange = onCheckedChange),
        horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space4),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ChoiceLabel(label, description, enabled, modifier = Modifier.weight(1f))
        Switch(
            checked = checked,
            onCheckedChange = null,
            enabled = enabled,
            colors = SwitchDefaults.colors(
                checkedThumbColor = c.accentFg,
                checkedTrackColor = c.accentBg,
                checkedBorderColor = c.accentBg,
                uncheckedThumbColor = c.borderControl,
                uncheckedTrackColor = c.bgSurface,
                uncheckedBorderColor = c.borderControl,
                disabledCheckedThumbColor = c.disabledBg,
                disabledCheckedTrackColor = c.disabledFg,
                disabledUncheckedThumbColor = c.disabledFg,
                disabledUncheckedTrackColor = c.disabledBg,
                disabledUncheckedBorderColor = c.disabledBorder,
            ),
        )
    }
}

@Composable
private fun stanceSliderColors() = StanceTheme.colors.let { c ->
    SliderDefaults.colors(
        thumbColor = c.accentBg,
        activeTrackColor = c.accentBg,
        inactiveTrackColor = c.bgEmphasis,
        activeTickColor = c.accentFg,
        inactiveTickColor = c.borderControl,
        disabledThumbColor = c.disabledFg,
        disabledActiveTrackColor = c.disabledFg,
        disabledInactiveTrackColor = c.disabledBg,
    )
}

@Composable
private fun SliderHeader(label: String, valueText: String, enabled: Boolean) {
    val c = StanceTheme.colors
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = StanceTheme.typography.label, color = if (enabled) c.fgDefault else c.fgDisabled)
        Text(valueText, style = StanceTheme.typography.label, color = if (enabled) c.fgMuted else c.fgDisabled)
    }
}

/**
 * Picks a number from a range. Supports drag, tap, arrow keys and accessibility actions.
 *
 * @param valueText The value as people should read and hear it, for example "40%".
 */
@Composable
public fun StanceSlider(
    label: String,
    value: Float,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    valueRange: ClosedFloatingPointRange<Float> = 0f..1f,
    steps: Int = 0,
    enabled: Boolean = true,
    valueText: String = value.toInt().toString(),
) {
    Column(modifier = modifier) {
        SliderHeader(label, valueText, enabled)
        Slider(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.semantics {
                contentDescription = label
                stateDescription = valueText
            },
            enabled = enabled,
            valueRange = valueRange,
            steps = steps,
            colors = stanceSliderColors(),
        )
    }
}

/** Picks a lower and an upper bound. Each thumb is separately focusable and adjustable. */
@Composable
public fun StanceRangeSlider(
    label: String,
    value: ClosedFloatingPointRange<Float>,
    onValueChange: (ClosedFloatingPointRange<Float>) -> Unit,
    modifier: Modifier = Modifier,
    valueRange: ClosedFloatingPointRange<Float> = 0f..1f,
    steps: Int = 0,
    enabled: Boolean = true,
    valueText: String = stringResource(R.string.stance_range_value, value.start.toInt(), value.endInclusive.toInt()),
) {
    Column(modifier = modifier.padding(vertical = StanceSpacing.space1)) {
        SliderHeader(label, valueText, enabled)
        RangeSlider(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.semantics { contentDescription = label },
            enabled = enabled,
            valueRange = valueRange,
            steps = steps,
            colors = stanceSliderColors(),
        )
    }
}
