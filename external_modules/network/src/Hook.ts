export default class Hook<T extends (...args: any[]) => any> {
  private queue: T[] = [];

  private lastCall: number = Number.MIN_SAFE_INTEGER;
  private throttleTimer: NodeJS.Timeout | number | null = null;

  public add(func: T) {
    this.queue.push(func);
  }

  public remove(func: T) {
    this.queue.splice(this.queue.findIndex(func), 1);
  }

  public call(...args: Parameters<T>) {
    for (const func of this.queue) {
      func(...args);
    }
    this.lastCall = performance.now();
  }

  public callThrottled(time: number, ...args: Parameters<T>) {
    const delta = performance.now() - this.lastCall;

    if (this.throttleTimer !== null) {
      clearTimeout(this.throttleTimer as number);
    }

    if (delta > time) {
        this.call(...args);
    } else {
      this.throttleTimer = setTimeout(() => {
        this.call(...args);
        this.throttleTimer = null;
      }, delta);
    }
  }
}
