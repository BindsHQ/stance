import type { IconName } from '@bindshq/stance-react';
import type { NativePlatform } from '../lib/native';

export interface PlatformFeature {
  icon: IconName;
  title: string;
  body: string;
}

export interface PlatformLanding {
  platform: NativePlatform;
  path: '/ios' | '/android';
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  eyebrow: string;
  title: [string, string];
  lede: string;
  install: { language: string; title: string; code: string };
  example: { language: string; code: string };
  features: PlatformFeature[];
  faq: { q: string; a: string }[];
  device: 'phone' | 'android';
  /** Real component renders floated around the hero device. */
  floats: [string, string, string, string];
  tablet: string;
  docs: { installation: string; theming: string; extra: { href: string; label: string } };
  requirements: string;
}

export const platformLandings: Record<NativePlatform, PlatformLanding> = {
  ios: {
    platform: 'ios',
    path: '/ios',
    seoTitle: 'StanceUI: SwiftUI design system for iOS and iPadOS',
    seoDescription:
      'StanceUI is an open-source SwiftUI component library for iPhone and iPad, with Dynamic Type, VoiceOver, dark mode and high contrast built in.',
    keywords: [
      'SwiftUI design system',
      'SwiftUI component library',
      'iOS design system',
      'iPadOS',
      'SwiftUI components',
      'Dynamic Type',
      'VoiceOver',
    ],
    eyebrow: 'StanceUI for iOS and iPadOS',
    title: ['Feels native.', 'Because it is.'],
    lede: 'SwiftUI components built on the controls people already know.',
    install: {
      language: 'swift',
      title: 'Package.swift',
      code: `.package(url: "https://github.com/BindsHQ/stance.git", from: "0.1.0")`,
    },
    example: {
      language: 'swift',
      code: `import StanceUI

struct TemplateSettings: View {
    @State private var name = "Sales team signature"
    @State private var autoApply = true

    var body: some View {
        StanceCard("Details") {
            StanceTextField("Template name", text: $name, isRequired: true)
            Toggle("Apply to new members", isOn: $autoApply)
                .toggleStyle(.stance)
            StanceButton("Deploy", leadingIcon: .send) {}
        }
    }
}`,
    },
    features: [
      {
        icon: 'layout-grid',
        title: 'System controls, your style',
        body: 'Navigation, sheets, menus and pickers stay Apple’s own. Stance adds the finish.',
      },
      {
        icon: 'type',
        title: 'Every text size',
        body: 'Each style follows Dynamic Type, up to the largest accessibility sizes.',
      },
      {
        icon: 'eye',
        title: 'VoiceOver ready',
        body: 'Labels, values and traits are set, and checked by Apple’s accessibility audit.',
      },
      {
        icon: 'contrast',
        title: 'Three appearances',
        body: 'Light, dark and high contrast, following Increase Contrast automatically.',
      },
      {
        icon: 'panel-left',
        title: 'iPhone and iPad',
        body: 'A tab bar on iPhone becomes a sidebar on iPad, with nothing to configure.',
      },
      {
        icon: 'code',
        title: 'UIKit welcome',
        body: 'Colours, fonts and hosting helpers bring Stance to existing screens.',
      },
    ],
    faq: [
      {
        q: 'What is StanceUI?',
        a: 'StanceUI is the SwiftUI library of Stance, the open-source design system by Binds. It provides themed components, styles and modifiers for iPhone and iPad that share their design tokens with the web and Android libraries.',
      },
      {
        q: 'Does StanceUI replace Apple’s controls?',
        a: 'No. StanceUI wraps and styles system controls such as navigation, sheets, alerts, menus and date pickers, so they keep their native behaviour. Custom views exist only where iOS has none, such as checkboxes, badges and a signature canvas.',
      },
      {
        q: 'Which iOS versions are supported?',
        a: 'iOS 17 and iPadOS 17 or later, with Swift 6 and no third-party dependencies. On iOS 26, system bars and sheets keep their Liquid Glass materials.',
      },
      {
        q: 'Is StanceUI accessible?',
        a: 'Yes. Every text style scales with Dynamic Type, controls have 44 point touch targets, VoiceOver labels are set throughout, Reduce Motion is respected, and Increase Contrast selects the high-contrast theme.',
      },
      {
        q: 'Can I use StanceUI in a UIKit app?',
        a: 'Yes. StanceUIKit provides colours that follow dark mode and contrast, fonts that scale with Dynamic Type, and a hosting controller for StanceUI screens.',
      },
    ],
    device: 'phone',
    floats: ['stance-toggle-style', 'stance-badge', 'stance-progress-view', 'stance-search-field'],
    tablet: 'showcase-sample-ipad',
    docs: {
      installation: '/ios/installation',
      theming: '/ios/theming',
      extra: { href: '/ios/uikit', label: 'UIKit' },
    },
    requirements: 'iOS 17 and iPadOS 17 or later · Swift 6 · No dependencies',
  },
  android: {
    platform: 'android',
    path: '/android',
    seoTitle: 'Stance for Android: Jetpack Compose design system',
    seoDescription:
      'Stance for Android is an open-source Jetpack Compose component library built on Material 3, with TalkBack support, font scaling, dark mode and high contrast.',
    keywords: [
      'Jetpack Compose design system',
      'Compose component library',
      'Android design system',
      'Material 3',
      'Jetpack Compose components',
      'TalkBack',
      'adaptive layouts',
    ],
    eyebrow: 'Stance for Android',
    title: ['At home on Android.', 'On every screen.'],
    lede: 'Jetpack Compose components for phones, tablets and foldables.',
    install: {
      language: 'kotlin',
      title: 'build.gradle.kts',
      code: `implementation("com.bindshq:stance-compose:0.1.0")`,
    },
    example: {
      language: 'kotlin',
      code: `@Composable
fun TemplateSettings() {
    var name by remember { mutableStateOf("Sales team signature") }
    var autoApply by remember { mutableStateOf(true) }

    StanceCard {
        StanceTextField(name, { name = it }, label = "Template name", required = true)
        StanceSwitch("Apply to new members", autoApply, { autoApply = it })
        StanceButton("Deploy", onClick = {})
    }
}`,
    },
    features: [
      {
        icon: 'layout-grid',
        title: 'Material 3 underneath',
        body: 'Behaviour and semantics come from Material. Stance brings the identity.',
      },
      {
        icon: 'maximize',
        title: 'Adapts to the window',
        body: 'Bottom bar, rail or drawer, chosen by the space available.',
      },
      {
        icon: 'eye',
        title: 'TalkBack ready',
        body: 'Roles, states and live regions on every component, with 48dp touch targets.',
      },
      {
        icon: 'type',
        title: 'Scales with the system',
        body: 'Text in sp follows the user’s font size, tested at 200%.',
      },
      {
        icon: 'contrast',
        title: 'Three appearances',
        body: 'Light, dark and high contrast, following the system contrast setting.',
      },
      {
        icon: 'code',
        title: 'Views welcome',
        body: 'Compose views and XML helpers bring Stance to existing screens.',
      },
    ],
    faq: [
      {
        q: 'What is Stance for Android?',
        a: 'Stance for Android is the Jetpack Compose library of Stance, the open-source design system by Binds. It provides themed composables built on Material 3 that share their design tokens with the web and iOS libraries.',
      },
      {
        q: 'How does it relate to Material 3?',
        a: 'Stance builds on Material 3 components for behaviour, semantics and accessibility, and maps its own tokens onto the Material theme. Any Material component used inside StanceTheme is on brand automatically.',
      },
      {
        q: 'Which Android versions are supported?',
        a: 'Android 7.0 (API 24) and later. The library depends only on AndroidX, Jetpack Compose and Material 3.',
      },
      {
        q: 'Does it support tablets and foldables?',
        a: 'Yes. StanceAdaptiveNavigation switches between a bottom bar, a navigation rail and a drawer by window width, and StanceScaffold handles edge-to-edge insets and predictive back.',
      },
      {
        q: 'Is Stance for Android accessible?',
        a: 'Yes. Components set TalkBack roles, states and labels, touch targets are at least 48dp, text scales with the system font size, focus is visible for keyboards, and swipe actions are exposed as accessibility actions.',
      },
    ],
    device: 'android',
    floats: [
      'stance-switch',
      'stance-filter-chip',
      'stance-progress-indicator',
      'stance-button-group',
    ],
    tablet: 'showcase-sample-tablet',
    docs: {
      installation: '/android/installation',
      theming: '/android/theming',
      extra: { href: '/android/adaptive', label: 'Adaptive and Views' },
    },
    requirements: 'Android 7.0 (API 24) or later · Material 3 · Kotlin',
  },
};
