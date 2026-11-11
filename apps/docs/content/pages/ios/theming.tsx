import { Code } from '../../../components/code';

export default function IosTheming() {
  return (
    <>
      <p>
        The three Stance themes are available on iOS from the same token source as the web. The
        preference is a <code>StanceAppearance</code>: system, light, dark or high contrast.
      </p>
      <ul>
        <li>
          <strong>System</strong> follows the device colour scheme. Increase Contrast selects the
          high-contrast theme.
        </li>
        <li>
          <strong>High contrast</strong> is a complete theme with full-strength boundaries, 7:1
          text, thicker focus rings and outlines in place of shadows.
        </li>
        <li>
          The preference is stored in UserDefaults under <code>stance-theme</code>, with the same
          values the web uses.
        </li>
      </ul>
      <h2 id="reading">Reading the theme</h2>
      <Code
        language="swift"
        code={`@Environment(\\.stanceTheme) private var theme

Text("Deployed")
    .foregroundStyle(theme.colors.fgMuted)
    .padding(StanceSpacing.md)
    .background(theme.colors.bgSurface)`}
      />
      <p>
        Colours are semantic roles named like the web roles, such as <code>bgSurface</code> and{' '}
        <code>fgMuted</code>.
      </p>
      <h2 id="choosing">Letting people choose</h2>
      <Code
        language="swift"
        code={`@AppStorage(StanceAppearance.storageKey)
private var appearance = StanceAppearance.system.rawValue`}
      />
      <h2 id="scoped">Scoped themes</h2>
      <Code language="swift" code={`PromoCard().stanceScopedTheme(.dark)`} />
      <h2 id="type">Typography and Dynamic Type</h2>
      <p>
        Every text style scales with Dynamic Type, up to the largest accessibility sizes. The
        default typeface is the system font. To use DM Sans, bundle the font in your app and pass
        its name:
      </p>
      <Code language="swift" code={`StanceThemeProvider(fontFamily: "DM Sans") { RootView() }`} />
      <h2 id="motion">Motion</h2>
      <p>
        Durations and easing come from the tokens. Stance animations are skipped when Reduce Motion
        is on.
      </p>
    </>
  );
}
