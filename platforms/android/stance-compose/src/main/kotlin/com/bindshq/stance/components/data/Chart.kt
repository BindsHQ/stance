@file:OptIn(ExperimentalLayoutApi::class)

package com.bindshq.stance.components.data

import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import com.bindshq.stance.R
import com.bindshq.stance.theme.StanceSizes
import com.bindshq.stance.theme.StanceSpacing
import com.bindshq.stance.theme.StanceTheme
import com.bindshq.stance.tokens.StanceTokens
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.floor
import kotlin.math.log10
import kotlin.math.pow

/** One series of a [StanceChart]: a name and one value per category. Missing values are null. */
@Immutable
public data class StanceChartSeries(val label: String, val values: List<Float?>)

/** How a [StanceChart] draws its series. */
public enum class StanceChartType { Line, Bar, Area }

/**
 * The top of the value axis: the smallest of 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 or 10 times a power of
 * ten that is at least [value]. Zero or less gives 1.
 */
internal fun stanceNiceMax(value: Float): Float {
    if (value <= 0f) return 1f
    val magnitude = 10.0.pow(floor(log10(value.toDouble())))
    val step = listOf(1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0).first { it * magnitude >= value - value * EPSILON }
    return (step * magnitude).toFloat()
}

private const val EPSILON = 1e-6f

/**
 * Charts a few series over categories as lines, bars or filled areas, drawn on a Compose [Canvas].
 *
 * Series use the chart colours of the theme, which step along the ink scale, and line series also
 * differ by dash pattern so they never rely on colour alone. A legend names each series.
 *
 * For screen readers the chart is one summary, for example "Line chart: Signatures sent. Lowest
 * 12, highest 48.", followed by one stop per category that reads every series value. The chart
 * mirrors in right to left layouts and draws in at once when animations are off.
 *
 * @param categories Labels along the axis, such as months.
 * @param maxValue The top of the value axis. Defaults to a rounded maximum of the data.
 * @param valueText Formats values for the axis and for screen readers.
 * @param summary Replaces the generated summary.
 */
@Composable
public fun StanceChart(
    title: String,
    categories: List<String>,
    series: List<StanceChartSeries>,
    modifier: Modifier = Modifier,
    type: StanceChartType = StanceChartType.Line,
    description: String? = null,
    height: Dp = StanceSpacing.space32 + StanceSpacing.space16,
    maxValue: Float? = null,
    showLegend: Boolean = series.size > 1,
    valueText: (Float) -> String = remember { defaultValueText() },
    summary: String? = null,
) {
    val c = StanceTheme.colors
    val palette = listOf(c.chart1, c.chart2, c.chart3, c.chart4, c.chart5)
    val values = series.flatMap { it.values.filterNotNull() }
    val top = maxValue ?: stanceNiceMax(values.maxOrNull() ?: 0f)
    val typeName = stringResource(
        when (type) {
            StanceChartType.Line -> R.string.stance_chart_line
            StanceChartType.Bar -> R.string.stance_chart_bar
            StanceChartType.Area -> R.string.stance_chart_area
        },
    )
    val spoken = summary ?: stringResource(
        R.string.stance_chart_summary,
        typeName,
        title,
        valueText(values.minOrNull() ?: 0f),
        valueText(values.maxOrNull() ?: 0f),
    )
    val cellFormat = stringResource(R.string.stance_table_cell)
    val separator = stringResource(R.string.stance_list_separator)
    val pointFormat = stringResource(R.string.stance_chart_point)

    val motion = StanceTheme.motion
    val progress = remember { Animatable(if (motion.reduceMotion) 1f else 0f) }
    LaunchedEffect(series, type) { progress.animateTo(1f, motion.slower()) }

    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(StanceSpacing.space3)) {
        Text(title, style = StanceTheme.typography.title, color = c.fgDefault, modifier = Modifier.semantics { heading() })
        if (description != null) Text(description, style = StanceTheme.typography.bodySmall, color = c.fgMuted)
        if (showLegend) {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space4),
                verticalArrangement = Arrangement.spacedBy(StanceSpacing.space1),
                modifier = Modifier.clearAndSetSemantics {},
            ) {
                series.forEachIndexed { index, s ->
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(StanceSpacing.space2)) {
                        LegendSwatch(palette[index % palette.size], index, type)
                        Text(s.label, style = StanceTheme.typography.caption, color = c.fgMuted)
                    }
                }
            }
        }
        Row(
            modifier = Modifier.semantics {
                contentDescription = spoken
                isTraversalGroup = true
            },
        ) {
            // Value axis: the top and the baseline.
            Column(
                modifier = Modifier.height(height).padding(end = StanceSpacing.space2).clearAndSetSemantics {},
                verticalArrangement = Arrangement.SpaceBetween,
                horizontalAlignment = Alignment.End,
            ) {
                Text(valueText(top), style = StanceTheme.typography.caption, color = c.fgSubtle)
                Text(valueText(0f), style = StanceTheme.typography.caption, color = c.fgSubtle)
            }
            Column(modifier = Modifier.weight(1f)) {
                Box(modifier = Modifier.fillMaxWidth().height(height)) {
                    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
                    val grid = c.borderSubtle
                    val baseline = c.borderDefault
                    Canvas(modifier = Modifier.fillMaxSize().clearAndSetSemantics {}) {
                        drawGrid(grid, baseline)
                        drawSeries(type, series, categories.size, top, palette, rtl, progress.value)
                    }
                    // One accessibility stop per category, laid over its column.
                    Row(modifier = Modifier.fillMaxSize()) {
                        categories.forEachIndexed { index, category ->
                            val readings = series.mapNotNull { s -> s.values.getOrNull(index)?.let { cellFormat.format(s.label, valueText(it)) } }
                            Box(
                                Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .semantics { contentDescription = pointFormat.format(category, readings.joinToString(separator)) },
                            )
                        }
                    }
                }
                Row(modifier = Modifier.fillMaxWidth().padding(top = StanceSpacing.space1).clearAndSetSemantics {}) {
                    categories.forEach { category ->
                        Text(
                            category,
                            style = StanceTheme.typography.caption,
                            color = c.fgMuted,
                            textAlign = TextAlign.Center,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }
        }
    }
}

private fun defaultValueText(): (Float) -> String {
    val format = NumberFormat.getNumberInstance(Locale.getDefault()).apply { maximumFractionDigits = 1 }
    return { format.format(it) }
}

@Composable
private fun LegendSwatch(color: Color, index: Int, type: StanceChartType) {
    val effect = lineEffect(index)
    Canvas(Modifier.size(width = StanceSizes.iconMedium, height = StanceSizes.iconSmall)) {
        if (type == StanceChartType.Bar) {
            drawRoundRect(color, cornerRadius = CornerRadius(size.minDimension / 4))
        } else {
            drawLine(
                color,
                Offset(0f, center.y),
                Offset(size.width, center.y),
                strokeWidth = StanceSpacing.space05.toPx(),
                cap = StrokeCap.Round,
                pathEffect = effect?.let { it(this) },
            )
        }
    }
}

/** Solid for the first series, then dashed and dotted, so lines differ by more than colour. */
private fun lineEffect(index: Int): (DrawScope.() -> PathEffect)? = when (index % LINE_PATTERNS) {
    0 -> null
    1 -> { { PathEffect.dashPathEffect(floatArrayOf(StanceSpacing.space15.toPx(), StanceSpacing.space1.toPx())) } }
    else -> { { PathEffect.dashPathEffect(floatArrayOf(StanceSpacing.hairline.toPx(), StanceSpacing.space1.toPx())) } }
}

private fun DrawScope.drawGrid(grid: Color, baseline: Color) {
    val stroke = StanceSpacing.hairline.toPx()
    for (step in 0 until GRID_LINES) {
        val y = size.height * step / GRID_LINES
        drawLine(grid, Offset(0f, y), Offset(size.width, y), stroke)
    }
    drawLine(baseline, Offset(0f, size.height), Offset(size.width, size.height), stroke)
}

private fun DrawScope.drawSeries(
    type: StanceChartType,
    series: List<StanceChartSeries>,
    count: Int,
    top: Float,
    palette: List<Color>,
    rtl: Boolean,
    progress: Float,
) {
    if (count == 0 || series.isEmpty()) return
    val column = size.width / count
    fun x(index: Int, offset: Float = column / 2): Float = (column * index + offset).let { if (rtl) size.width - it else it }
    fun y(value: Float): Float = size.height - size.height * (value.coerceIn(0f, top) / top) * progress

    when (type) {
        StanceChartType.Bar -> {
            val group = column * BAR_GROUP
            val bar = group / series.size
            val radius = CornerRadius(bar / 4)
            series.forEachIndexed { s, entry ->
                entry.values.take(count).forEachIndexed { index, value ->
                    if (value == null) return@forEachIndexed
                    val start = (column - group) / 2 + bar * s
                    val left = if (rtl) x(index, start + bar) else x(index, start)
                    val topY = y(value)
                    drawRoundRect(palette[s % palette.size], Offset(left, topY), Size(bar * BAR_FILL, size.height - topY), radius)
                }
            }
        }
        StanceChartType.Line, StanceChartType.Area -> series.forEachIndexed { s, entry ->
            val color = palette[s % palette.size]
            val points = entry.values.take(count).mapIndexedNotNull { index, value -> value?.let { Offset(x(index), y(it)) } }
            if (points.isEmpty()) return@forEachIndexed
            val line = Path().apply {
                moveTo(points.first().x, points.first().y)
                points.drop(1).forEach { lineTo(it.x, it.y) }
            }
            if (type == StanceChartType.Area) {
                val fill = Path().apply {
                    addPath(line)
                    lineTo(points.last().x, size.height)
                    lineTo(points.first().x, size.height)
                    close()
                }
                drawPath(fill, Brush.verticalGradient(listOf(color.copy(alpha = StanceTokens.Opacity.scrim), color.copy(alpha = 0f))))
            }
            drawPath(line, color, style = Stroke(width = StanceSpacing.space05.toPx(), cap = StrokeCap.Round, pathEffect = lineEffect(s)?.let { it(this) }))
            points.forEach { drawCircle(color, radius = StanceSpacing.space1.toPx(), center = it) }
        }
    }
}

private const val GRID_LINES = 4
private const val BAR_GROUP = 0.7f
private const val BAR_FILL = 0.85f
private const val LINE_PATTERNS = 3
