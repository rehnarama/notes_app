export default class Hook<T extends (...args: any) => any> {
    private queue;
    add(func: T): void;
    remove(func: T): void;
    call(...args: Parameters<T>): void;
}
//# sourceMappingURL=Hook.d.ts.map