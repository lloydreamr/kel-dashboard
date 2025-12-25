import { describe, expect, it } from 'vitest';

import { ANIMATION, EASING } from './animations';

describe('ANIMATION constants', () => {
  it('has expand animation with 0.2s duration', () => {
    expect(ANIMATION.expand.duration).toBe(0.2);
  });

  it('has collapse animation with 0.15s duration', () => {
    expect(ANIMATION.collapse.duration).toBe(0.15);
  });

  it('has fade animation', () => {
    expect(ANIMATION.fade.duration).toBe(0.15);
  });

  it('expand uses spring type', () => {
    expect(ANIMATION.expand.type).toBe('spring');
  });

  it('collapse uses spring type', () => {
    expect(ANIMATION.collapse.type).toBe('spring');
  });
});

describe('EASING constants', () => {
  it('has default easing curve', () => {
    expect(EASING.default).toEqual([0.4, 0, 0.2, 1]);
  });

  it('has easeOut curve', () => {
    expect(EASING.easeOut).toEqual([0, 0, 0.2, 1]);
  });

  it('has easeIn curve', () => {
    expect(EASING.easeIn).toEqual([0.4, 0, 1, 1]);
  });
});
