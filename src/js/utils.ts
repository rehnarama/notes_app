function clamp(n: number, lowerBound: number, upperBound: number) {
  return Math.max(lowerBound, Math.min(n, upperBound));
}
export { clamp };

export class Hook<T extends (...args: any) => any> {
  private queue: T[] = [];

  public add(func: T) {
    this.queue.push(func);
  }

  public remove(func: T) {
    this.queue.splice(this.queue.findIndex(func), 1);
  }

  public call(...args: Parameters<T>) {
    for (const func of this.queue) {
      func.apply(undefined, args);
    }
  }
}
