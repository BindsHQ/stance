import { MarkdownRenderer } from '@bindshq/stance-react';
import legal from '../../../generated/legal.json';

/** Site links for the repository-relative links in TRADEMARK.md. */
const links: Record<string, string> = {
  './LICENSE': '/resources/license#license-text',
  './NOTICE': '/resources/license#notice',
  './brand': '/resources/brand',
};

export default function Trademarks() {
  const body = legal.trademark
    .replace(/^# .*\n+/, '')
    .replace(/\]\((\.\/[A-Za-z]+)\)/g, (match: string, path: string) =>
      links[path] ? `](${links[path]})` : match,
    );
  return <MarkdownRenderer headingBaseLevel={1}>{body}</MarkdownRenderer>;
}
