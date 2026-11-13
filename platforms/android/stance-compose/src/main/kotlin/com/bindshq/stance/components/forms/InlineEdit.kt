package com.bindshq.stance.components.forms

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import com.bindshq.stance.R
import com.bindshq.stance.a11y.stanceFocusRing
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.icons.StanceIcon
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme

/** What happens when an inline edit is committed: the value to save, or an error to show. */
internal data class StanceInlineEditOutcome(val value: String?, val error: String?)

/** Trims [draft] when asked and runs [validate]. A message from [validate] keeps the edit open. */
internal fun stanceInlineEditCommit(draft: String, trim: Boolean, validate: ((String) -> String?)?): StanceInlineEditOutcome {
    val value = if (trim) draft.trim() else draft
    val error = validate?.invoke(value)
    return if (error != null) StanceInlineEditOutcome(null, error) else StanceInlineEditOutcome(value, null)
}

/**
 * Text that turns into a field when tapped, for editing a value in place such as a template name.
 *
 * The read view is one button named, for example, "Edit template name", and reads the current
 * value. While editing, the keyboard Done action and the save button commit, and the cancel
 * button or the system back gesture restore the value. A message from [validate] is shown and
 * announced, and keeps the field open.
 *
 * @param label What is being edited, for example "template name".
 * @param onCommit Called with the new value. Not called when it equals [value].
 * @param multiline Edits several lines. Then only the save button commits.
 */
@Composable
public fun StanceInlineEdit(
    value: String,
    onCommit: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    validate: ((String) -> String?)? = null,
    onCancel: (() -> Unit)? = null,
    multiline: Boolean = false,
    enabled: Boolean = true,
    trim: Boolean = true,
    initiallyEditing: Boolean = false,
    textStyle: TextStyle = StanceTheme.typography.body,
    editDescription: String = stringResource(R.string.stance_edit_named, label),
    saveLabel: String = stringResource(R.string.stance_save),
    cancelLabel: String = stringResource(R.string.stance_cancel),
) {
    val c = StanceTheme.colors
    var editing by rememberSaveable { mutableStateOf(initiallyEditing) }
    var draft by rememberSaveable { mutableStateOf(value) }
    var error by rememberSaveable { mutableStateOf<String?>(null) }
    val focus = remember { FocusRequester() }

    fun start() {
        draft = value
        error = null
        editing = true
    }

    fun cancel() {
        editing = false
        error = null
        onCancel?.invoke()
    }

    fun commit() {
        val outcome = stanceInlineEditCommit(draft, trim, validate)
        error = outcome.error
        if (outcome.value != null) {
            editing = false
            if (outcome.value != value) onCommit(outcome.value)
        }
    }

    if (!editing) {
        val shown = value.ifEmpty { placeholder.orEmpty() }
        Row(
            modifier = modifier
                .fillMaxWidth()
                .heightIn(min = StanceSizes.touchTarget)
                .stanceFocusRing(StanceTheme.shapes.small)
                .clickable(enabled = enabled, role = Role.Button, onClick = ::start)
                .clearAndSetSemantics {
                    contentDescription = editDescription
                    stateDescription = shown
                    role = Role.Button
                    if (enabled) onClick { start(); true }
                }
                .padding(horizontal = StanceSpacing.space1),
            horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                shown,
                style = textStyle,
                color = when {
                    !enabled -> c.fgDisabled
                    value.isEmpty() -> c.fgSubtle
                    else -> c.fgDefault
                },
                modifier = Modifier.weight(1f, fill = false),
            )
            if (enabled) StanceIcon(StanceIcons.Pencil, contentDescription = null, size = StanceSizes.iconSmall, tint = c.fgMuted)
        }
        return
    }

    BackHandler(onBack = ::cancel)
    LaunchedEffect(Unit) { focus.requestFocus() }
    StanceFormField(label = null, modifier = modifier, error = error) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = draft,
                onValueChange = {
                    draft = it
                    error = null
                },
                modifier = Modifier
                    .weight(1f)
                    .focusRequester(focus)
                    .semantics {
                        contentDescription = label
                        error?.let { error(it) }
                    },
                textStyle = textStyle,
                placeholder = placeholder?.let { { Text(it, style = textStyle) } },
                isError = error != null,
                singleLine = !multiline,
                minLines = if (multiline) 2 else 1,
                keyboardOptions = KeyboardOptions(imeAction = if (multiline) ImeAction.Default else ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { commit() }),
                shape = StanceTheme.shapes.medium,
                colors = stanceTextFieldColors(),
            )
            StanceIconButton(StanceIcons.Check, saveLabel, onClick = ::commit)
            StanceIconButton(StanceIcons.X, cancelLabel, onClick = ::cancel)
        }
    }
}
