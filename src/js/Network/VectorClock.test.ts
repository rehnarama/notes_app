import VectorClock from "./VectorClock";

describe("VectorClock", () => {
  describe("comparisons", () => {
    describe("::isEqual()", () => {
      test("should return true when equal", () => {
        const v1 = new VectorClock([5, 5, 5]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isEqual(v2)).toBe(true);
      });

      test("should return false when not equal (one differing counter)", () => {
        const v1 = new VectorClock([5, 4, 5]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isEqual(v2)).toBe(false);
      });

      test("should return false when not equal (many differing counters)", () => {
        const v1 = new VectorClock([5, 4, 5]);
        const v2 = new VectorClock([2, 5, 6]);

        expect(v1.isEqual(v2)).toBe(false);
      });
    });

    describe("::isLessOrEqual()", () => {
      test("should return true when equal", () => {
        const v1 = new VectorClock([5, 5, 5]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isLessOrEqual(v2)).toBe(true);
      });

      test("should return true when strictly less", () => {
        const v1 = new VectorClock([4, 4, 4]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isLessOrEqual(v2)).toBe(true);
      });

      test("should return true when less", () => {
        const v1 = new VectorClock([4, 5, 4]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isLessOrEqual(v2)).toBe(true);
      });

      test("should return false when greater", () => {
        const v1 = new VectorClock([5, 6, 6]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isLessOrEqual(v2)).toBe(false);
      });

      test("should return false when strictly greater", () => {
        const v1 = new VectorClock([6, 6, 6]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isLessOrEqual(v2)).toBe(false);
      });

      test("should return false when concurrent", () => {
        const v1 = new VectorClock([4, 6, 5]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isLessOrEqual(v2)).toBe(false);
      });
    });

    describe("::isStrictlyLess()", () => {
      test("should return false when equal", () => {
        const v1 = new VectorClock([5, 5, 5]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isStrictlyLess(v2)).toBe(false);
      });

      test("should return true when all is strictly less", () => {
        const v1 = new VectorClock([4, 4, 4]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isStrictlyLess(v2)).toBe(true);
      });

      test("should return true when partly strictly less", () => {
        const v1 = new VectorClock([4, 5, 4]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isStrictlyLess(v2)).toBe(true);
      });

      test("should return false when greater", () => {
        const v1 = new VectorClock([5, 6, 6]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isStrictlyLess(v2)).toBe(false);
      });

      test("should return false when strictly greater", () => {
        const v1 = new VectorClock([6, 6, 6]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isStrictlyLess(v2)).toBe(false);
      });

      test("should return false when concurrent", () => {
        const v1 = new VectorClock([4, 6, 5]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isStrictlyLess(v2)).toBe(false);
      });
    });

    describe("::isConcurrent()", () => {
      test("should return false when equal", () => {
        const v1 = new VectorClock([5, 5, 5]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isConcurrent(v2)).toBe(false);
      });

      test("should return false when strictly less", () => {
        const v1 = new VectorClock([4, 4, 4]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isConcurrent(v2)).toBe(false);
      });

      test("should return false when less", () => {
        const v1 = new VectorClock([4, 5, 4]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isConcurrent(v2)).toBe(false);
      });

      test("should return false when greater", () => {
        const v1 = new VectorClock([5, 6, 6]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isConcurrent(v2)).toBe(false);
      });

      test("should return false when strictly greater", () => {
        const v1 = new VectorClock([6, 6, 6]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isConcurrent(v2)).toBe(false);
      });

      test("should return true when concurrent", () => {
        const v1 = new VectorClock([4, 6, 5]);
        const v2 = new VectorClock([5, 5, 5]);

        expect(v1.isConcurrent(v2)).toBe(true);
      });
    });

    describe("bottomed out clocks", () => {
      test("a bottomed out clock should always be less than any non-bottomed out clock", () => {
        const v1 = new VectorClock([2, 2, 2]);
        const v2 = new VectorClock([1, 1, 1]);

        v1.bottomClock();

        expect(v1.isStrictlyLess(v2)).toBe(true);
        expect(v1.isLessOrEqual(v2)).toBe(true);
        expect(v1.isEqual(v2)).toBe(false);
        expect(v1.isConcurrent(v2)).toBe(false);
      });

      test("two bottomed out clocks should be equal", () => {
        const v1 = new VectorClock([2, 2, 2]);
        const v2 = new VectorClock([1, 1, 1]);

        v1.bottomClock();
        v2.bottomClock();

        expect(v1.isStrictlyLess(v2)).toBe(false);
        expect(v1.isLessOrEqual(v2)).toBe(true);
        expect(v1.isEqual(v2)).toBe(true);
        expect(v1.isConcurrent(v2)).toBe(false);
      });
    });
  });
});
