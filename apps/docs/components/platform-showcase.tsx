import Link from 'next/link';
import { native } from '../lib/native';
import { components } from '../lib/routes';
import { LandingShowcase } from './landing-showcase';
import { NativeImage } from './native-image';

/** The three platforms side by side: a live web component and real captures from the iOS and Android libraries. */
export function PlatformShowcase() {
  return (
    <ul className="platform-showcase">
      <li>
        <Link href="/ios" className="platform-device">
          <span className="device device--phone device--ios">
            <span className="device__island" aria-hidden="true" />
            <NativeImage platform="ios" name="showcase-sample" alt="" className="device__screen" />
          </span>
          <span className="platform-device__meta">
            <span className="platform-device__tech">SwiftUI</span>
            <span className="platform-device__name">iOS and iPadOS</span>
            <span className="platform-device__count">{native.ios.length} components</span>
          </span>
        </Link>
      </li>
      <li>
        <div className="platform-device platform-device--web">
          <span className="device device--browser">
            <span className="device__bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <span>stanceui.com</span>
            </span>
            <span className="device__viewport">
              <LandingShowcase compact />
            </span>
          </span>
          <Link href="/docs/installation" className="platform-device__meta">
            <span className="platform-device__tech">React</span>
            <span className="platform-device__name">Web</span>
            <span className="platform-device__count">{components.length} components</span>
          </Link>
        </div>
      </li>
      <li>
        <Link href="/android" className="platform-device">
          <span className="device device--phone device--android">
            <span className="device__camera" aria-hidden="true" />
            <NativeImage
              platform="android"
              name="showcase-sample"
              alt=""
              className="device__screen"
            />
          </span>
          <span className="platform-device__meta">
            <span className="platform-device__tech">Jetpack Compose</span>
            <span className="platform-device__name">Android</span>
            <span className="platform-device__count">{native.android.length} components</span>
          </span>
        </Link>
      </li>
    </ul>
  );
}
