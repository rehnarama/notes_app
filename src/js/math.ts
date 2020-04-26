export function easeOut(x: number): number {
  return Math.sqrt(x);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number, clamped = true) {
  if (clamped) {
    t = clamp(t, 0, 1);
  }
  const value = a * (1 - t) + b * t;

  return value;
}

export function easeOutInterpolation(
  a: number,
  b: number,
  t: number,
  clamped = true
) {
  return lerp(a, b, easeOut(t), clamped);
}
