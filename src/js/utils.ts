function clamp(n: number, lowerBound: number, upperBound: number) {
  return Math.max(lowerBound, Math.min(n, upperBound));
}
export { clamp };
