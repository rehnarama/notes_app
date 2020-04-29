export default class VectorClock {
    /**
     * The internal counters that implements the clock. A null value signifies a
     * bottomed out clock (can be set via the bottomClock() function), which means
     * comparisons will always return that this clock is strictly lesser, unless
     * the other clock is also bottomed, in which case it will be equal
     */
    private counters;
    static BottomedClock: VectorClock;
    get size(): number;
    constructor(counters: number[], bottomed?: boolean);
    constructor(counters: Map<number, number>, bottomed?: boolean);
    constructor(size: number, bottomed?: boolean);
    get(id: number): number;
    set(id: number, value: number): void;
    keys(): IterableIterator<number> | never[];
    /**
     * Compares two clocks against each other. A bottomed clock will always be
     * stricly less than any other clock, unless the other clock is also bottomed,
     * in which case they will be stricly equal
     */
    compareTo(other: VectorClock): {
        hasGreater: boolean;
        hasLesser: boolean;
        hasEqual: boolean;
    };
    /**
     * "Bottoms" the clock. A bottomed clock will always be stricly less than any
     * other clock, unless the other clock is also bottomed, in which case they
     * will be stricly equal
     */
    bottomClock(): void;
    isEqual(other: VectorClock): boolean;
    isLessOrEqual(other: VectorClock): boolean;
    isStrictlyLess(other: VectorClock): boolean;
    isConcurrent(other: VectorClock): boolean;
    toJson(): string;
    toJSON(): any;
    static fromJson(json: string): VectorClock;
    clone(): VectorClock;
    toArray(): [number, number][];
}
//# sourceMappingURL=VectorClock.d.ts.map