plugins {
    alias(libs.plugins.kotlin.jvm)
    `maven-publish`
}

// The token file is generated (packages/tokens/scripts/build-tokens.mjs) and is the only source here.
java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    explicitApi()
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    testImplementation(libs.kotlin.test)
    testImplementation(libs.junit)
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            artifactId = "stance-tokens"
            pom {
                name.set("Stance Tokens")
                description.set("Design tokens for Stance, the Binds design system.")
                url.set("https://www.stanceui.com")
                licenses { license { name.set("MIT"); url.set("https://opensource.org/licenses/MIT") } }
            }
        }
    }
    repositories { maven { name = "localTest"; url = uri(rootProject.layout.buildDirectory.dir("repo")) } }
}
