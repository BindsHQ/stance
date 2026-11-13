'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bindshq/stance-react';
import {
  nativeCoverage,
  nativePath,
  nativePlatforms,
  platformLabels,
  platformShortNames,
  previewName,
} from '../lib/native';
import { NativeImage, hasNativeImage } from './native-image';
import { Code } from './code';

/** Shows how a web component maps to its native iOS and Android counterparts, or the platform idiom. */
export function PlatformAvailability({
  slug,
  name,
  importLine,
}: {
  slug: string;
  name: string;
  importLine: string;
}) {
  const cover = nativeCoverage(slug);
  const platforms = nativePlatforms.filter((p) => cover[p].components.length > 0);
  const idioms = nativePlatforms.filter((p) => cover[p].idiom);
  if (platforms.length === 0 && idioms.length === 0) return null;
  const idiomList = idioms.length > 0 && (
    <ul className="native-idioms" aria-label="Platform idioms">
      {idioms.map((p) => (
        <li key={p}>
          <span className="native-idioms__platform">{platformShortNames[p]}</span>
          {cover[p].idiom}
        </li>
      ))}
    </ul>
  );
  if (platforms.length === 0)
    return (
      <section aria-labelledby="platforms">
        <h2 id="platforms" className="docs-h2">
          Platforms
        </h2>
        <p className="docs-muted">On iOS and Android, the system already does this well.</p>
        {idiomList}
      </section>
    );
  return (
    <section aria-labelledby="platforms">
      <h2 id="platforms" className="docs-h2">
        Platforms
      </h2>
      <p className="docs-muted">
        {idioms.length > 0
          ? `${name} has a native counterpart on ${platforms.map((p) => platformShortNames[p]).join(' and ')}. Elsewhere, the system already does this well.`
          : `${name} has native counterparts. They share Stance tokens and intent, and use each platform’s own controls and conventions.`}{' '}
        The live previews on this page are the web implementation.
      </p>
      {idiomList}
      <Tabs defaultValue="web">
        <TabsList aria-label="Platform">
          <TabsTrigger value="web">Web · React</TabsTrigger>
          {platforms.map((p) => (
            <TabsTrigger key={p} value={p}>
              {platformLabels[p].name} · {platformLabels[p].ui}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="web">
          <Code code={importLine} />
        </TabsContent>
        {platforms.map((p) => (
          <TabsContent key={p} value={p}>
            {cover[p].components.map((c) => (
              <div key={c.name} className="native-item">
                <p>
                  <a href={nativePath(p, c)}>
                    <code>{c.name}</code>
                  </a>
                  : {c.summary}
                </p>
                {previewName(c) && hasNativeImage(p, previewName(c)!) && (
                  <figure className="native-preview" data-platform={p}>
                    <NativeImage
                      platform={p}
                      name={previewName(c)!}
                      alt={`${c.name} rendered on ${platformLabels[p].name}`}
                    />
                    <figcaption>Rendered by the {platformLabels[p].ui} library</figcaption>
                  </figure>
                )}
                <Code code={c.example} language={platformLabels[p].language} />
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
