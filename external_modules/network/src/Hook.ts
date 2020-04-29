export default class Hook<T extends (...args: any) => any> {
  private queue: T[] = [];

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
  }
}
