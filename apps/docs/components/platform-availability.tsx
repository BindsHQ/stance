'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bindshq/stance-react';
import { nativeEquivalents, platformLabels, type NativePlatform } from '../lib/native';
import { Code } from './code';

/** Shows how a web component maps to its native iOS and Android counterparts. */
export function PlatformAvailability({
  slug,
  name,
  importLine,
}: {
  slug: string;
  name: string;
  importLine: string;
}) {
  const eq = nativeEquivalents(slug);
  const platforms = (['ios', 'android'] as NativePlatform[]).filter((p) => eq[p].length > 0);
  if (platforms.length === 0) return null;
  return (
    <section aria-labelledby="platforms">
      <h2 id="platforms" className="docs-h2">
        Platforms
      </h2>
      <p className="docs-muted">
        {name} has native counterparts. They share Stance tokens and intent, and use each platform’s
        own controls and conventions. The live previews on this page are the web implementation.
      </p>
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
            {eq[p].map((c) => (
              <div key={c.name} className="native-item">
                <p>
                  <a href={`/${p}/components#${c.name.toLowerCase()}`}>
                    <code>{c.name}</code>
                  </a>
                  : {c.summary}
                </p>
                <Code code={c.example} language={platformLabels[p].language} />
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
