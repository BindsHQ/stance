import { Code } from '../../../components/code';

export default function AndroidTheming() {
  return (
    <>
      <p>
        <code>StanceTheme</code> provides the active theme through <code>StanceTheme.colors</code>,{' '}
        <code>typography</code>, <code>shapes</code>, <code>elevation</code>, <code>motion</code>,{' '}
        <code>spacing</code> and <code>sizes</code>.
      </p>
      <ul>
        <li>
          <strong>Three themes:</strong> light, dark and high contrast, from the same tokens as the
          web and iOS.
        </li>
        <li>
          <strong>System</strong> follows the device. A request for more contrast wins over dark
          theme. The system contrast level is read on Android 14 and later, and the high contrast
          text setting on older versions.
        </li>
        <li>
          The choice is saved in SharedPreferences under <code>stance-theme</code>, with the same
          values as the web.
        </li>
      </ul>
      <h2 id="choosing">Letting people choose</h2>
      <Code
        language="kotlin"
        code={`var appearance by rememberStanceAppearance()

StanceTheme(appearance = appearance) {
    // StanceAppearance.System, Light, Dark or HighContrast
}`}
      />
      <h2 id="reading">Reading the theme</h2>
      <Code
        language="kotlin"
        code={`Text(
    text = "Deployed",
    color = StanceTheme.colors.fgMuted,
    style = StanceTheme.typography.body,
)`}
      />
      <h2 id="dynamic-colour">No dynamic colour</h2>
      <p>
        Material You dynamic colour is off on purpose. Binds has two brand colours, ivory and
        indigo, and every Stance theme is derived from them.
      </p>
      <h2 id="type">Typography and font scale</h2>
      <p>
        Type sizes are in <code>sp</code>, so text follows the system font size. The default
        typeface is the platform one. Pass a <code>FontFamily</code> to <code>StanceTheme</code> to
        use DM Sans.
      </p>
      <h2 id="motion">Motion</h2>
      <p>
        Motion uses the Stance duration and easing tokens. When the system has animations turned
        off, <code>StanceTheme.motion</code> returns <code>snap()</code> specs.
      </p>
    </>
  );
}
