/** Renders schema.org JSON-LD. `<` is escaped so content can never break out of the script element. */
export function JsonLd({ graph }: { graph: Record<string, unknown>[] }) {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
    /</g,
    '\\u003c',
  );
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
