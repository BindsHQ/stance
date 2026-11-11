package com.bindshq.stance.theme

import android.app.UiModeManager
import android.content.Context
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.core.content.edit
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import com.bindshq.stance.tokens.StanceThemeTokens
import com.bindshq.stance.tokens.StanceTokens

/**
 * The appearance a person chose. [System] follows the device's dark theme and contrast settings.
 *
 * [storageValue] matches the strings Stance uses on the web, so a preference means the same on every platform.
 */
public enum class StanceAppearance(public val storageValue: String) {
    System("system"),
    Light("light"),
    Dark("dark"),
    HighContrast("high-contrast"),
    ;

    public companion object {
        /** Parses a stored value. Unknown or missing values fall back to [System]. */
        public fun fromStorageValue(value: String?): StanceAppearance =
            entries.firstOrNull { it.storageValue == value } ?: System
    }
}

/**
 * Pure resolution of a preference to theme tokens.
 *
 * In [StanceAppearance.System], a request for more contrast wins over dark theme, because
 * high contrast is an accessibility need while dark theme is a preference.
 */
public fun resolveStanceTheme(
    appearance: StanceAppearance,
    systemInDarkTheme: Boolean,
    systemHighContrast: Boolean,
): StanceThemeTokens = when (appearance) {
    StanceAppearance.Light -> StanceTokens.light
    StanceAppearance.Dark -> StanceTokens.dark
    StanceAppearance.HighContrast -> StanceTokens.highContrast
    StanceAppearance.System -> when {
        systemHighContrast -> StanceTokens.highContrast
        systemInDarkTheme -> StanceTokens.dark
        else -> StanceTokens.light
    }
}

/**
 * Whether the device asks for increased contrast: the system contrast level on Android 14+
 * (medium or higher), or the "high contrast text" accessibility setting on older versions.
 */
public fun isSystemHighContrast(context: Context): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val manager = context.getSystemService(Context.UI_MODE_SERVICE) as? UiModeManager
        if (manager != null && manager.contrast >= MEDIUM_CONTRAST) return true
    }
    return try {
        Settings.Secure.getInt(context.contentResolver, HIGH_TEXT_CONTRAST_SETTING, 0) == 1
    } catch (_: SecurityException) {
        false
    }
}

private const val MEDIUM_CONTRAST = 0.5f
private const val HIGH_TEXT_CONTRAST_SETTING = "high_text_contrast_enabled"

/** Resolves [appearance] against the current device settings. */
@Composable
public fun rememberStanceThemeTokens(appearance: StanceAppearance): StanceThemeTokens {
    val context = LocalContext.current
    val dark = isSystemInDarkTheme()
    val highContrast = remember(context, dark) { isSystemHighContrast(context) }
    return resolveStanceTheme(appearance, dark, highContrast)
}

/**
 * Persists the appearance preference in SharedPreferences under the key `stance-theme`.
 */
public class StanceAppearanceStore(context: Context, name: String = PREFERENCES_NAME) {
    private val preferences = context.applicationContext.getSharedPreferences(name, Context.MODE_PRIVATE)

    public fun load(): StanceAppearance = StanceAppearance.fromStorageValue(preferences.getString(KEY, null))

    public fun save(appearance: StanceAppearance) {
        preferences.edit { putString(KEY, appearance.storageValue) }
    }

    public companion object {
        public const val KEY: String = "stance-theme"
        public const val PREFERENCES_NAME: String = "stance"
    }
}

/**
 * Remembers the appearance preference as state backed by [StanceAppearanceStore].
 * Assigning a new value saves it.
 */
@Composable
public fun rememberStanceAppearance(): MutableState<StanceAppearance> {
    val context = LocalContext.current
    return remember(context) {
        val store = StanceAppearanceStore(context)
        val state = mutableStateOf(store.load())
        object : MutableState<StanceAppearance> {
            override var value: StanceAppearance
                get() = state.value
                set(new) {
                    state.value = new
                    store.save(new)
                }

            override fun component1(): StanceAppearance = value

            override fun component2(): (StanceAppearance) -> Unit = { value = it }
        }
    }
}
