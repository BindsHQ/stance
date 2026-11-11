import { IconGallery } from '@bindshq/stance-react';
import { Code } from '../../../components/code';

export default function Icons() {
  return (
    <>
      <p>
        Stance ships its own icon set, drawn on a 24px grid with a 1.75 stroke, round caps and
        joins. Icons inherit <code>currentColor</code> and are decorative by default. Pass a{' '}
        <code>label</code> when an icon carries meaning on its own.
      </p>
      <Code
        code={`import { Icon } from '@bindshq/stance-react';\n\n<Icon name="signature" size="md" />\n<Icon name="alert-triangle" label="Warning" />`}
      />
      <h2 id="gallery">Gallery</h2>
      <IconGallery />
    </>
  );
}
