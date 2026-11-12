import { afterEach, describe, expect, it } from 'vitest';
import { getDirection, isRtl, logicalKey } from './direction';
import { computePosition } from './position';

afterEach(() => {
  document.documentElement.removeAttribute('dir');
  document.body.innerHTML = '';
});

function mount(html: string) {
  document.body.innerHTML = html;
  return document.getElementById('target')!;
}

describe('getDirection', () => {
  it('defaults to ltr, also for a missing element', () => {
    expect(getDirection(null)).toBe('ltr');
    expect(getDirection(mount('<div id="target"></div>'))).toBe('ltr');
  });

  it('reads the nearest dir attribute', () => {
    expect(getDirection(mount('<div dir="rtl"><p><span id="target"></span></p></div>'))).toBe(
      'rtl',
    );
    expect(
      isRtl(mount('<div dir="rtl"><div dir="ltr"><span id="target"></span></div></div>')),
    ).toBe(false);
  });

  it('follows the document direction', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    expect(isRtl(mount('<div id="target"></div>'))).toBe(true);
  });
});

describe('logicalKey', () => {
  it('swaps the horizontal arrows in RTL only', () => {
    const rtl = mount('<div dir="rtl" id="target"></div>');
    expect(logicalKey('ArrowLeft', rtl)).toBe('ArrowRight');
    expect(logicalKey('ArrowRight', rtl)).toBe('ArrowLeft');
    expect(logicalKey('ArrowUp', rtl)).toBe('ArrowUp');
    expect(logicalKey('Home', rtl)).toBe('Home');
    const ltr = mount('<div id="target"></div>');
    expect(logicalKey('ArrowLeft', ltr)).toBe('ArrowLeft');
    expect(logicalKey('ArrowRight', ltr)).toBe('ArrowRight');
  });
});

describe('computePosition in RTL', () => {
  const anchor = { x: 400, y: 100, width: 100, height: 30 };
  const floating = { width: 200, height: 80 };
  const viewport = { width: 1000, height: 800 };
  const base = {
    side: 'bottom' as const,
    sideOffset: 0,
    alignOffset: 0,
    collisionPadding: 8,
    avoidCollisions: true,
  };

  it('aligns start to the right edge and end to the left edge', () => {
    expect(computePosition(anchor, floating, viewport, { ...base, align: 'start' }).x).toBe(400);
    expect(
      computePosition(anchor, floating, viewport, { ...base, align: 'start', rtl: true }).x,
    ).toBe(300);
    expect(
      computePosition(anchor, floating, viewport, { ...base, align: 'end', rtl: true }).x,
    ).toBe(400);
    expect(
      computePosition(anchor, floating, viewport, { ...base, align: 'center', rtl: true }).x,
    ).toBe(350);
  });
});
