pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
    versionCatalogs {
        create("libs") { from(files("../../../platforms/android/gradle/libs.versions.toml")) }
    }
}

rootProject.name = "StanceShowcase"

// Build the library from source, so the showcase always exercises the current code.
includeBuild("../../../platforms/android")

include(":app")
