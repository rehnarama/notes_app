export default class VectorClock {
  /**
   * The internal counters that implements the clock. A null value signifies a
   * bottomed out clock (can be set via the bottomClock() function), which means
   * comparisons will always return that this clock is strictly lesser, unless
   * the other clock is also bottomed, in which case it will be equal
   */
  private counters: Map<number, number> | null;

  public static BottomedClock = new VectorClock(0, true);

  public get size() {
    return this.counters !== null ? this.counters.size : 0;
  }

  public constructor(counters: number[], bottomed?: boolean);
  public constructor(counters: Map<number, number>, bottomed?: boolean);
  public constructor(size: number, bottomed?: boolean);
  public constructor(
    arg: number | number[] | Map<number, number>,
    bottomed = false
  ) {
    if (bottomed) {
      this.counters = null;
    } else if (Array.isArray(arg)) {
      this.counters = new Map();
      for (let i = 0; i < arg.length; i++) {
        this.counters.set(i, arg[i]);
      }
    } else if (arg instanceof Map) {
      this.counters = arg;
    } else {
      this.counters = new Map();
      for (let i = 0; i < arg; i++) {
        this.counters.set(i, 0);
      }
    }
  }

  public get(id: number) {
    if (this.counters === null) {
      return 0;
    } else {
      const counter = this.counters.get(id);
      if (counter !== undefined) {
        return counter;
      } else {
        return 0;
      }
    }
  }

  public set(id: number, value: number) {
    if (this.counters !== null) {
      this.counters.set(id, value);
    }
  }

  public keys() {
    if (this.counters !== null) {
      return this.counters.keys();
    } else {
      return [];
    }
  }

  /**
   * Compares two clocks against each other. A bottomed clock will always be
   * stricly less than any other clock, unless the other clock is also bottomed,
   * in which case they will be stricly equal
   */
  public compareTo(other: VectorClock) {
    let hasGreater = false;
    let hasLesser = false;
    let hasEqual = false;

    if (this.counters === null && other.counters === null) {
      return { hasGreater: false, hasLesser: false, hasEqual: true };
    } else if (this.counters === null) {
      return { hasLesser: true, hasGreater: false, hasEqual: false };
    } else if (other.counters === null) {
      return { hasLesser: false, hasGreater: true, hasEqual: false };
    }

    if (this.size !== other.size) {
      throw new Error(
        `Both vector clocks must be of same length. The first was of length ${this.size} while the other was of length ${other.size}`
      );
    }

    for (const id of this.counters.keys()) {
      if (this.get(id) > other.get(id)) {
        hasGreater = true;
      } else if (this.get(id) < other.get(id)) {
        hasLesser = true;
      } else if (this.get(id) === other.get(id)) {
        hasEqual = true;
      }
    }

    return { hasGreater, hasLesser, hasEqual };
  }

  /**
   * "Bottoms" the clock. A bottomed clock will always be stricly less than any
   * other clock, unless the other clock is also bottomed, in which case they
   * will be stricly equal
   */
  public bottomClock() {
    this.counters = null;
  }

  public isEqual(other: VectorClock) {
    const comparison = this.compareTo(other);
    return (
      comparison.hasEqual && !comparison.hasLesser && !comparison.hasGreater
    );
  }

  public isLessOrEqual(other: VectorClock) {
    const comparison = this.compareTo(other);
    return (
      (comparison.hasLesser || comparison.hasEqual) && !comparison.hasGreater
    );
  }

  public isStrictlyLess(other: VectorClock) {
    return this.isLessOrEqual(other) && !this.isEqual(other);
  }

  public isConcurrent(other: VectorClock) {
    const comparison = this.compareTo(other);
    return comparison.hasGreater && comparison.hasLesser;
  }

  public toJson(): string {
    return JSON.stringify(this);
  }

  public toJSON(): any {
    if (this.counters === null) {
      return null;
    } else {
      return Array.from(this.counters.entries());
    }
  }

  public static fromJson(json: string): VectorClock {
    const counters = JSON.parse(json) as Array<[number, number]> | null;
    if (counters === null) {
      return new VectorClock(0, true);
    } else {
      const v = new VectorClock(new Map(counters));
      return v;
    }
  }

  public clone(): VectorClock {
    if (this.counters !== null) {
      return new VectorClock(new Map(this.counters));
    } else {
      return VectorClock.BottomedClock;
    }
  }
}
