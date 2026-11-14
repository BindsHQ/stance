import legal from '../../../generated/legal.json';
import Link from 'next/link';

export default function License() {
  return (
    <>
      <p>
        The Stance code, including the React library, the SwiftUI and Jetpack Compose libraries and
        the design token files, is licensed under the Apache License, Version 2.0. You can use,
        modify and distribute it in personal and commercial work, as long as you keep the licence
        and the NOTICE file with it.
      </p>
      <p>
        The licence covers software only. The Binds and Stance names and logos are trademarks of
        Binds and are not licensed. Read the{' '}
        <Link href="/resources/trademarks">trademark policy</Link>.
      </p>
      <h2 className="docs-h2" id="notice">
        NOTICE
      </h2>
      <pre className="license-text" tabIndex={0} aria-label="NOTICE file">
        {legal.notice}
      </pre>
      <h2 className="docs-h2" id="license-text">
        Apache License, Version 2.0
      </h2>
      <pre className="license-text" tabIndex={0} aria-label="Apache License, Version 2.0">
        {legal.license}
      </pre>
    </>
  );
}
