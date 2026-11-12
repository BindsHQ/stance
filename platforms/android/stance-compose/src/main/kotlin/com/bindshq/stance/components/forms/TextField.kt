package com.bindshq.stance.components.forms

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldColors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceTheme
import androidx.compose.ui.res.stringResource
import com.bindshq.stance.R

@Composable
internal fun stanceTextFieldColors(): TextFieldColors {
    val c = StanceTheme.colors
    return OutlinedTextFieldDefaults.colors(
        focusedTextColor = c.fgDefault,
        unfocusedTextColor = c.fgDefault,
        disabledTextColor = c.disabledFg,
        errorTextColor = c.fgDefault,
        focusedContainerColor = c.bgSurface,
        unfocusedContainerColor = c.bgSurface,
        disabledContainerColor = c.disabledBg,
        errorContainerColor = c.bgSurface,
        cursorColor = c.fgDefault,
        errorCursorColor = c.dangerFg,
        focusedBorderColor = c.focusRing,
        unfocusedBorderColor = c.borderControl,
        disabledBorderColor = c.disabledBorder,
        errorBorderColor = c.dangerFg,
        focusedLeadingIconColor = c.fgMuted,
        unfocusedLeadingIconColor = c.fgMuted,
        focusedTrailingIconColor = c.fgMuted,
        unfocusedTrailingIconColor = c.fgMuted,
        errorTrailingIconColor = c.dangerFg,
        focusedPlaceholderColor = c.fgSubtle,
        unfocusedPlaceholderColor = c.fgSubtle,
        focusedPrefixColor = c.fgMuted,
        unfocusedPrefixColor = c.fgMuted,
        focusedSuffixColor = c.fgMuted,
        unfocusedSuffixColor = c.fgMuted,
    )
}

/**
 * A single-line or multi-line text input with a label above it.
 *
 * Built on the Material 3 outlined text field. The label names the field for screen readers,
 * and an [error] marks it invalid and is announced.
 *
 * @param label Visible label, also the accessible name.
 * @param error Error message. A non-null value marks the field invalid.
 */
@Composable
public fun StanceTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    singleLine: Boolean = true,
    minLines: Int = 1,
    leadingIcon: ImageVector? = null,
    prefix: String? = null,
    suffix: String? = null,
    trailing: (@Composable () -> Unit)? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
) {
    StanceFormField(label = label, modifier = modifier, helper = helper, error = error, required = required, enabled = enabled) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .fillMaxWidth()
                .semantics {
                    contentDescription = label
                    if (error != null) error(error)
                },
            enabled = enabled,
            readOnly = readOnly,
            textStyle = StanceTheme.typography.body,
            placeholder = placeholder?.let { { Text(it, style = StanceTheme.typography.body) } },
            leadingIcon = leadingIcon?.let { { StanceIcon(it, contentDescription = null, size = StanceSizes.iconMedium) } },
            trailingIcon = trailing,
            prefix = prefix?.let { { Text(it, style = StanceTheme.typography.body) } },
            suffix = suffix?.let { { Text(it, style = StanceTheme.typography.body) } },
            isError = error != null,
            visualTransformation = visualTransformation,
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            singleLine = singleLine,
            minLines = minLines,
            shape = StanceTheme.shapes.medium,
            colors = stanceTextFieldColors(),
        )
    }
}

/**
 * A password input with a button to show or hide what was typed.
 */
@Composable
public fun StancePasswordField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    showDescription: String = stringResource(R.string.stance_show_password),
    hideDescription: String = stringResource(R.string.stance_hide_password),
    keyboardActions: KeyboardActions = KeyboardActions.Default,
) {
    var visible by rememberSaveable { mutableStateOf(false) }
    StanceTextField(
        value = value,
        onValueChange = onValueChange,
        label = label,
        modifier = modifier,
        helper = helper,
        error = error,
        required = required,
        enabled = enabled,
        visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
        keyboardActions = keyboardActions,
        trailing = {
            StanceIconButton(
                icon = if (visible) StanceIcons.EyeOff else StanceIcons.Eye,
                contentDescription = if (visible) hideDescription else showDescription,
                onClick = { visible = !visible },
                enabled = enabled,
            )
        },
    )
}

/**
 * A search input with a clear button. Pressing search on the keyboard calls [onSearch].
 */
@Composable
public fun StanceSearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = stringResource(R.string.stance_search),
    onSearch: (String) -> Unit = {},
    enabled: Boolean = true,
    clearDescription: String = stringResource(R.string.stance_clear_search),
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier
            .fillMaxWidth()
            .semantics { contentDescription = placeholder },
        enabled = enabled,
        textStyle = StanceTheme.typography.body,
        placeholder = { Text(placeholder, style = StanceTheme.typography.body) },
        leadingIcon = { StanceIcon(StanceIcons.Search, contentDescription = null) },
        trailingIcon = if (query.isNotEmpty()) {
            { StanceIconButton(StanceIcons.X, clearDescription, onClick = { onQueryChange("") }, enabled = enabled) }
        } else {
            null
        },
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        keyboardActions = KeyboardActions(onSearch = { onSearch(query) }),
        singleLine = true,
        shape = StanceTheme.shapes.pill,
        colors = stanceTextFieldColors(),
    )
}
