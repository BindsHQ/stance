plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

// Documentation previews: rendered from the real composables into platforms/android/previews.
val previewsDir = rootDir.resolve("../../../platforms/android/previews").normalize()
val generatingPreviews = gradle.startParameter.taskNames.any { it.endsWith("generateStancePreviews") }

android {
    namespace = "si.binds.stance.showcase"
    compileSdk = 37

    defaultConfig {
        applicationId = "si.binds.stance.showcase"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    testOptions {
        unitTests {
            isIncludeAndroidResources = true
            all {
                it.systemProperty("robolectric.graphicsMode", "NATIVE")
                it.systemProperty("roborazzi.test.record", "true")
                it.maxHeapSize = "2g"
                if (generatingPreviews) {
                    it.systemProperty("stance.previews.dir", previewsDir.absolutePath)
                    it.systemProperty("stance.previews.only", providers.gradleProperty("stance.previews.only").getOrElse(""))
                    it.filter.includeTestsMatching("*ComponentPreviewTest")
                    it.outputs.upToDateWhen { false }
                }
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("com.bindshq:stance-compose:0.1.0")
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.core)

    testImplementation(libs.junit)
    testImplementation(libs.kotlin.test)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(libs.compose.ui.test.junit4)
    testImplementation(libs.roborazzi)
    testImplementation(libs.roborazzi.compose)
    debugImplementation(libs.compose.ui.test.manifest)
}

// Lossless PNG optimisation. Requires oxipng (brew install oxipng).
val optimiseStancePreviews by tasks.registering(Exec::class) {
    dependsOn("testDebugUnitTest")
    commandLine("sh", "-c", "oxipng -o max --strip safe -q '${previewsDir.absolutePath}'/*.png")
}

/**
 * Renders every component preview in the three themes, optimises the PNGs and refreshes
 * components.json. Run: ./gradlew :app:generateStancePreviews
 */
tasks.register<Exec>("generateStancePreviews") {
    group = "documentation"
    description = "Renders component previews for the documentation site."
    dependsOn(optimiseStancePreviews)
    workingDir = rootDir.resolve("../../..").normalize()
    commandLine("node", "platforms/android/scripts/generate-components-json.mjs")
}
