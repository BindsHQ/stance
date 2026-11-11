'use client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@bindshq/stance-react';

/** Questions stay in the page for search engines; answers open on demand. */
export function LandingFaq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Accordion type="single" collapsible defaultValue="q0" headingLevel={3} className="landing-faq">
      {items.map((f, i) => (
        <AccordionItem key={f.q} value={`q${i}`}>
          <AccordionTrigger>{f.q}</AccordionTrigger>
          <AccordionContent forceMount>{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
