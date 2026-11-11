import { Code } from '../../../components/code';

export default function AndroidInstallation() {
  return (
    <>
      <p>
        Stance for Android is a Jetpack Compose library built on Material 3 for behaviour, semantics
        and accessibility, and themed with Stance tokens. It looks like Stance and behaves like
        Android.
      </p>
      <ul>
        <li>minSdk 24, compileSdk 37, Kotlin 2.4, Compose BOM 2026.09.00.</li>
        <li>Depends only on AndroidX, Compose and Material 3.</li>
        <li>
          Version 0.1.0, in development and not yet published. The Maven destination and the{' '}
          <code>com.bindshq</code> group are still to be confirmed by Binds.
        </li>
      </ul>
      <div className="docs-table-wrap" role="region" aria-label="Modules" tabIndex={0}>
        <table className="docs-table">
          <thead>
            <tr>
              <th scope="col">Artifact</th>
              <th scope="col">Contents</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <code>com.bindshq:stance-compose</code>
              </th>
              <td>Theme, components, icons, accessibility helpers and View interop.</td>
            </tr>
            <tr>
              <th scope="row">
                <code>com.bindshq:stance-tokens</code>
              </th>
              <td>Generated design tokens. Pure Kotlin with no Android dependency.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 id="gradle">Gradle</h2>
      <Code
        title="gradle/libs.versions.toml"
        language="toml"
        code={`[versions]
stance = "0.1.0"

[libraries]
stance-compose = { module = "com.bindshq:stance-compose", version.ref = "stance" }`}
      />
      <Code
        title="app/build.gradle.kts"
        language="kotlin"
        code={`dependencies {\n    implementation(libs.stance.compose)\n}`}
      />
      <h2 id="setup">Set up</h2>
      <p>
        Use <code>Theme.Stance</code> as the activity theme so the window shows the Stance canvas
        colour before Compose draws, then wrap your content in <code>StanceTheme</code>.
      </p>
      <Code
        language="xml"
        code={`<activity android:name=".MainActivity" android:theme="@style/Theme.Stance" />`}
      />
      <Code
        language="kotlin"
        code={`class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            var appearance by rememberStanceAppearance()
            StanceTheme(appearance = appearance) {
                StanceScaffold(topBar = { StanceTopAppBar("Templates") }) { padding ->
                    StanceButton("Save template", onClick = {}, modifier = Modifier.padding(padding))
                }
            }
        }
    }
}`}
      />
      <h2 id="material">Material 3 interop</h2>
      <p>
        <code>StanceTheme</code> also sets <code>MaterialTheme</code> from Stance tokens, so any
        Material 3 component inside it is on brand. Stance wraps a Material component only when it
        adds a Stance API such as semantic variants, sizes, or loading and error states. For
        everything else, use the Material component directly.
      </p>
    </>
  );
}
