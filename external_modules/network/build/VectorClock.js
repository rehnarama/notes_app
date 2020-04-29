"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var VectorClock = /** @class */ (function () {
    function VectorClock(arg, bottomed) {
        if (bottomed === void 0) { bottomed = false; }
        if (bottomed) {
            this.counters = null;
        }
        else if (Array.isArray(arg)) {
            this.counters = new Map();
            for (var i = 0; i < arg.length; i++) {
                this.counters.set(i, arg[i]);
            }
        }
        else if (arg instanceof Map) {
            this.counters = arg;
        }
        else {
            this.counters = new Map();
            for (var i = 0; i < arg; i++) {
                this.counters.set(i, 0);
            }
        }
    }
    Object.defineProperty(VectorClock.prototype, "size", {
        get: function () {
            return this.counters !== null ? this.counters.size : 0;
        },
        enumerable: true,
        configurable: true
    });
    VectorClock.prototype.get = function (id) {
        if (this.counters === null) {
            return 0;
        }
        else {
            var counter = this.counters.get(id);
            if (counter !== undefined) {
                return counter;
            }
            else {
                return 0;
            }
        }
    };
    VectorClock.prototype.set = function (id, value) {
        if (this.counters !== null) {
            this.counters.set(id, value);
        }
    };
    VectorClock.prototype.keys = function () {
        if (this.counters !== null) {
            return this.counters.keys();
        }
        else {
            return [];
        }
    };
    /**
     * Compares two clocks against each other. A bottomed clock will always be
     * stricly less than any other clock, unless the other clock is also bottomed,
     * in which case they will be stricly equal
     */
    VectorClock.prototype.compareTo = function (other) {
        var e_1, _a;
        var hasGreater = false;
        var hasLesser = false;
        var hasEqual = false;
        if (this.counters === null && other.counters === null) {
            return { hasGreater: false, hasLesser: false, hasEqual: true };
        }
        else if (this.counters === null) {
            return { hasLesser: true, hasGreater: false, hasEqual: false };
        }
        else if (other.counters === null) {
            return { hasLesser: false, hasGreater: true, hasEqual: false };
        }
        if (this.size !== other.size) {
            throw new Error("Both vector clocks must be of same length. The first was of length " + this.size + " while the other was of length " + other.size);
        }
        try {
            for (var _b = __values(this.counters.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var id = _c.value;
                if (this.get(id) > other.get(id)) {
                    hasGreater = true;
                }
                else if (this.get(id) < other.get(id)) {
                    hasLesser = true;
                }
                else if (this.get(id) === other.get(id)) {
                    hasEqual = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return { hasGreater: hasGreater, hasLesser: hasLesser, hasEqual: hasEqual };
    };
    /**
     * "Bottoms" the clock. A bottomed clock will always be stricly less than any
     * other clock, unless the other clock is also bottomed, in which case they
     * will be stricly equal
     */
    VectorClock.prototype.bottomClock = function () {
        this.counters = null;
    };
    VectorClock.prototype.isEqual = function (other) {
        var comparison = this.compareTo(other);
        return (comparison.hasEqual && !comparison.hasLesser && !comparison.hasGreater);
    };
    VectorClock.prototype.isLessOrEqual = function (other) {
        var comparison = this.compareTo(other);
        return ((comparison.hasLesser || comparison.hasEqual) && !comparison.hasGreater);
    };
    VectorClock.prototype.isStrictlyLess = function (other) {
        return this.isLessOrEqual(other) && !this.isEqual(other);
    };
    VectorClock.prototype.isConcurrent = function (other) {
        var comparison = this.compareTo(other);
        return comparison.hasGreater && comparison.hasLesser;
    };
    VectorClock.prototype.toJson = function () {
        return JSON.stringify(this);
    };
    VectorClock.prototype.toJSON = function () {
        if (this.counters === null) {
            return null;
        }
        else {
            return Array.from(this.counters.entries());
        }
    };
    VectorClock.fromJson = function (json) {
        var counters = JSON.parse(json);
        if (counters === null) {
            return new VectorClock(0, true);
        }
        else {
            var v = new VectorClock(new Map(counters));
            return v;
        }
    };
    VectorClock.prototype.clone = function () {
        if (this.counters !== null) {
            return new VectorClock(new Map(this.counters));
        }
        else {
            return VectorClock.BottomedClock;
        }
    };
    VectorClock.prototype.toArray = function () {
        if (this.counters) {
            return Array.from(this.counters.entries());
        }
        else {
            return [];
        }
    };
    VectorClock.BottomedClock = new VectorClock(0, true);
    return VectorClock;
}());
exports.default = VectorClock;
//# sourceMappingURL=VectorClock.js.map