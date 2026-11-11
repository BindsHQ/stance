package com.bindshq.stance.components.advanced

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember

/** Launches a system picker. Obtain one with [rememberStancePhotoPicker] or [rememberStanceDocumentPicker]. */
public fun interface StancePickerLauncher {
    public fun launch()
}

/**
 * The system Photo Picker for choosing images. It needs no storage permission and grants
 * access only to what the person selects.
 *
 * @param maxItems Maximum number of images; 1 opens the single-select picker.
 */
@Composable
public fun rememberStancePhotoPicker(maxItems: Int = 1, onResult: (List<Uri>) -> Unit): StancePickerLauncher {
    val request = remember { PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly) }
    return if (maxItems > 1) {
        val launcher = rememberLauncherForActivityResult(ActivityResultContracts.PickMultipleVisualMedia(maxItems), onResult)
        remember(launcher) { StancePickerLauncher { launcher.launch(request) } }
    } else {
        val launcher = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { onResult(listOfNotNull(it)) }
        remember(launcher) { StancePickerLauncher { launcher.launch(request) } }
    }
}

/**
 * The system file picker (Storage Access Framework) for attaching documents.
 *
 * @param mimeTypes Accepted types, for example `arrayOf("application/pdf")`.
 */
@Composable
public fun rememberStanceDocumentPicker(
    mimeTypes: Array<String> = arrayOf("*/*"),
    multiple: Boolean = false,
    onResult: (List<Uri>) -> Unit,
): StancePickerLauncher {
    return if (multiple) {
        val launcher = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments(), onResult)
        remember(launcher, mimeTypes) { StancePickerLauncher { launcher.launch(mimeTypes) } }
    } else {
        val launcher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { onResult(listOfNotNull(it)) }
        remember(launcher, mimeTypes) { StancePickerLauncher { launcher.launch(mimeTypes) } }
    }
}
