package com.bindshq.stance.interop

import android.content.Context
import android.util.AttributeSet
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.AbstractComposeView
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import com.bindshq.stance.components.actions.StanceButton
import com.bindshq.stance.components.actions.StanceButtonVariant
import com.bindshq.stance.theme.StanceAppearance
import com.bindshq.stance.theme.StanceTheme

/**
 * Hosts Stance content inside a View hierarchy, for adopting Stance one screen region at a time.
 *
 * ```kotlin
 * binding.composeContainer.setStanceContent { StanceBadge("Live", tone = StanceTone.Success) }
 * ```
 *
 * The composition is disposed with the view tree's lifecycle, which is correct inside fragments.
 */
public fun ComposeView.setStanceContent(
    appearance: StanceAppearance = StanceAppearance.System,
    content: @Composable () -> Unit,
) {
    setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
    setContent { StanceTheme(appearance = appearance, content = content) }
}

/**
 * A Stance button usable from XML layouts and View code.
 *
 * ```xml
 * <com.bindshq.stance.interop.StanceButtonView
 *     android:id="@+id/save"
 *     android:layout_width="wrap_content"
 *     android:layout_height="wrap_content" />
 * ```
 * ```kotlin
 * binding.save.text = "Save template"
 * binding.save.setOnClickListener { viewModel.save() }
 * ```
 */
public class StanceButtonView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0,
) : AbstractComposeView(context, attrs, defStyleAttr) {

    /** The button label. */
    public var text: String by mutableStateOf("")

    /** Visual emphasis. */
    public var variant: StanceButtonVariant by mutableStateOf(StanceButtonVariant.Primary)

    /** Shows progress and ignores taps. */
    public var loading: Boolean by mutableStateOf(false)

    /** The appearance used for this view's theme. */
    public var appearance: StanceAppearance by mutableStateOf(StanceAppearance.System)

    private var enabledState by mutableStateOf(true)
    private var clickListener: OnClickListener? = null

    init {
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
    }

    override fun setEnabled(enabled: Boolean) {
        super.setEnabled(enabled)
        enabledState = enabled
    }

    override fun setOnClickListener(listener: OnClickListener?) {
        clickListener = listener
    }

    @Composable
    override fun Content() {
        StanceTheme(appearance = appearance) {
            StanceButton(
                text = text,
                onClick = { clickListener?.onClick(this) },
                variant = variant,
                enabled = enabledState,
                loading = loading,
            )
        }
    }
}
