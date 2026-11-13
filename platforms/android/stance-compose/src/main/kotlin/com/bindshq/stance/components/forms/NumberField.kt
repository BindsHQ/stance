package com.bindshq.stance.components.forms

import androidx.compose.foundation.border
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.password
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.bindshq.stance.R
import com.bindshq.stance.components.actions.StanceIconButton
import com.bindshq.stance.foundation.rememberFromResources
import com.bindshq.stance.icons.StanceIcons
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import java.math.BigDecimal
import java.math.RoundingMode
import java.text.DecimalFormatSymbols
import java.text.NumberFormat
import java.util.Locale

// ───────────── Number field logic ─────────────

/** Decimal places in [step], for example 2 for 0.05. */
internal fun stancePrecisionOf(step: Double): Int = BigDecimal(step.toString()).stripTrailingZeros().scale().coerceAtLeast(0)

/** Rounds to [precision] places and keeps the value inside [min] and [max]. */
internal fun stanceClampNumber(value: Double, min: Double?, max: Double?, precision: Int): Double {
    val rounded = BigDecimal(value.toString()).setScale(precision, RoundingMode.HALF_UP).toDouble()
    return rounded.coerceIn(min ?: Double.NEGATIVE_INFINITY, max ?: Double.POSITIVE_INFINITY)
}

/**
 * The value after one step up ([direction] 1) or down (-1). An empty value starts from [min],
 * or from 0 when there is no minimum.
 */
internal fun stanceStepNumber(value: Double?, direction: Int, step: Double, min: Double?, max: Double?, precision: Int): Double {
    val base = value ?: return stanceClampNumber(min ?: 0.0, min, max, precision)
    return stanceClampNumber(base + direction * step, min, max, precision)
}

/**
 * Reads a number typed in [locale]. Accepts the locale's decimal separator or a point, Arabic
 * Indic digits and a leading minus, and ignores grouping and other characters such as a currency
 * sign. Returns null when there are no digits.
 */
internal fun stanceParseNumber(text: String, locale: Locale): Double? {
    val decimal = DecimalFormatSymbols.getInstance(locale).decimalSeparator
    val normalised = buildString {
        text.trim().forEachIndexed { index, char ->
            when {
                char.isDigit() -> append(Character.getNumericValue(char))
                char == decimal || char == '.' || char == '٫' -> if ('.' !in this) append('.')
                (char == '-' || char == '−') && index == 0 -> append('-')
            }
        }
    }
    return normalised.takeIf { it.any(Char::isDigit) }?.toDoubleOrNull()
}

private fun defaultNumberFormat(precision: Int, locale: Locale): (Double) -> String {
    val format = NumberFormat.getNumberInstance(locale).apply {
        isGroupingUsed = false
        minimumFractionDigits = precision
        maximumFractionDigits = precision
    }
    return { format.format(it) }
}

/**
 * A field for numbers with a numeric keyboard, bounds and buttons to step down and up.
 *
 * The value is rounded to [precision] and kept inside [min] and [max] as people type, and the
 * text is formatted again when the field loses focus. The step buttons are disabled at the
 * bounds, and the up and down keys of a hardware keyboard step as well.
 *
 * @param value The number, or null when the field is empty.
 * @param precision Decimal places. Inferred from [step] when omitted.
 * @param format Shows the value, for example with a fixed number of decimals. Defaults to the locale.
 */
@Composable
public fun StanceNumberField(
    value: Double?,
    onValueChange: (Double?) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    min: Double? = null,
    max: Double? = null,
    step: Double = 1.0,
    precision: Int = stancePrecisionOf(step),
    helper: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    showStepper: Boolean = true,
    prefix: String? = null,
    suffix: String? = null,
    locale: Locale = Locale.getDefault(),
    format: (Double) -> String = remember(precision, locale) { defaultNumberFormat(precision, locale) },
    incrementLabel: String = stringResource(R.string.stance_increase),
    decrementLabel: String = stringResource(R.string.stance_decrease),
) {
    var text by remember { mutableStateOf(value?.let(format).orEmpty()) }
    var focused by remember { mutableStateOf(false) }
    // While typing, the text stays as typed; otherwise it follows the value.
    LaunchedEffect(value, focused, format) { if (!focused) text = value?.let(format).orEmpty() }
    fun stepBy(direction: Int) {
        val next = stanceStepNumber(value, direction, step, min, max, precision)
        text = format(next)
        onValueChange(next)
    }
    val canDecrement = enabled && (value == null || min == null || value > min)
    val canIncrement = enabled && (value == null || max == null || value < max)
    StanceFormField(label = label, modifier = modifier, helper = helper, error = error, required = required, enabled = enabled) {
        OutlinedTextField(
            value = text,
            onValueChange = { typed ->
                text = typed
                onValueChange(stanceParseNumber(typed, locale)?.let { stanceClampNumber(it, min, max, precision) })
            },
            modifier = Modifier
                .fillMaxWidth()
                .onFocusChanged { focused = it.isFocused }
                .onPreviewKeyEvent { event ->
                    if (event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                    when (event.key) {
                        Key.DirectionUp -> { if (canIncrement) stepBy(1); true }
                        Key.DirectionDown -> { if (canDecrement) stepBy(-1); true }
                        else -> false
                    }
                }
                .semantics {
                    contentDescription = label
                    if (error != null) error(error)
                },
            enabled = enabled,
            textStyle = StanceTheme.typography.body.copy(textAlign = if (showStepper) TextAlign.Center else TextAlign.Start),
            leadingIcon = if (showStepper) {
                { StanceIconButton(StanceIcons.Minus, decrementLabel, onClick = { stepBy(-1) }, enabled = canDecrement) }
            } else {
                null
            },
            trailingIcon = if (showStepper) {
                { StanceIconButton(StanceIcons.Plus, incrementLabel, onClick = { stepBy(1) }, enabled = canIncrement) }
            } else {
                null
            },
            prefix = prefix?.let { { Text(it, style = StanceTheme.typography.body) } },
            suffix = suffix?.let { { Text(it, style = StanceTheme.typography.body) } },
            isError = error != null,
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = if (precision > 0) KeyboardType.Decimal else KeyboardType.Number,
                imeAction = ImeAction.Done,
            ),
            keyboardActions = KeyboardActions(onDone = { text = value?.let(format).orEmpty() }),
            shape = StanceTheme.shapes.medium,
            colors = stanceTextFieldColors(),
        )
    }
}

// ───────────── Pin field ─────────────

/**
 * Keeps the characters a pin field accepts, up to [length]. Pasted codes such as "123 456" or
 * "123-456" become "123456". Letters are upper cased for alphanumeric codes.
 */
internal fun stanceSanitizePin(input: String, length: Int, numeric: Boolean): String =
    input.asSequence()
        .filter { if (numeric) it in '0'..'9' else it.isLetterOrDigit() && it.code < ASCII_LIMIT }
        .map { it.uppercaseChar() }
        .take(length)
        .joinToString("")

private const val ASCII_LIMIT = 128

@Composable
private fun defaultPinProgress(): (entered: Int, length: Int) -> String =
    rememberFromResources { r -> { entered, length -> r.getQuantityString(R.plurals.stance_pin_progress, entered, entered, length) } }

/**
 * Entry for a one time code or PIN, drawn as one box per character.
 *
 * It is a single text field, so a pasted or autofilled code fills every box at once. It offers
 * SMS code autofill, a numeric keyboard for numeric codes, and stays left to right in right to
 * left layouts because codes are read in that order. Screen readers hear its [label] and how many
 * characters are entered; a masked field is announced as a password.
 *
 * @param onComplete Called once when the last character is entered.
 * @param numeric Accepts digits only. Otherwise letters and digits.
 * @param mask Hides the characters, as for a PIN.
 */
@Composable
public fun StancePinField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    length: Int = 6,
    onComplete: ((String) -> Unit)? = null,
    numeric: Boolean = true,
    mask: Boolean = false,
    enabled: Boolean = true,
    error: String? = null,
    label: String = stringResource(R.string.stance_verification_code),
    progressText: (entered: Int, length: Int) -> String = defaultPinProgress(),
) {
    val c = StanceTheme.colors
    val interactions = remember { MutableInteractionSource() }
    val focused by interactions.collectIsFocusedAsState()
    val code = stanceSanitizePin(value, length, numeric)
    StanceFormField(label = null, modifier = modifier, error = error, enabled = enabled) {
        BasicTextField(
            value = code,
            onValueChange = { typed ->
                val next = stanceSanitizePin(typed, length, numeric)
                if (next != code) {
                    onValueChange(next)
                    if (next.length == length) onComplete?.invoke(next)
                }
            },
            modifier = Modifier.semantics {
                contentDescription = label
                stateDescription = progressText(code.length, length)
                contentType = ContentType.SmsOtpCode
                if (mask) password()
                if (error != null) error(error)
            },
            enabled = enabled,
            singleLine = true,
            interactionSource = interactions,
            keyboardOptions = KeyboardOptions(
                keyboardType = if (numeric) KeyboardType.NumberPassword else KeyboardType.Ascii,
                imeAction = ImeAction.Done,
            ),
            decorationBox = {
                // Codes read left to right in every language.
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                    Row(horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                        repeat(length) { index ->
                            val char = code.getOrNull(index)
                            val current = focused && (index == code.length || (index == length - 1 && code.length == length))
                            val border = when {
                                !enabled -> c.disabledBorder
                                error != null -> c.dangerFg
                                current -> c.focusRing
                                else -> c.borderControl
                            }
                            val width = if (current) StanceTheme.tokens.focusWidth.dp else StanceTheme.tokens.controlBorderWidth.dp
                            Box(
                                modifier = Modifier
                                    .defaultMinSize(minWidth = StanceSizes.controlMedium, minHeight = StanceSizes.touchTarget)
                                    .background(if (enabled) c.bgSurface else c.disabledBg, StanceTheme.shapes.medium)
                                    .border(width, border, StanceTheme.shapes.medium),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = when {
                                        char == null -> ""
                                        mask -> MASK
                                        else -> char.toString()
                                    },
                                    style = StanceTheme.typography.headingSmall,
                                    color = if (enabled) c.fgDefault else c.disabledFg,
                                )
                            }
                        }
                    }
                }
            },
        )
    }
}

private const val MASK = "•"
