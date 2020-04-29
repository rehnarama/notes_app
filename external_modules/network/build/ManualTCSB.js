"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// This is directly copied from `TaggedCausalStableBroadcast.ts` but revamped
// so that it doesn't track unstable ops automatically, but rather
// you have to supply it with list of timestamps to check
// stability for
var CausalBroadcast_1 = __importDefault(require("./CausalBroadcast"));
var VectorClock_1 = __importDefault(require("./VectorClock"));
var Hook_1 = __importDefault(require("./Hook"));
var ManualTCSB = /** @class */ (function (_super) {
    __extends(ManualTCSB, _super);
    function ManualTCSB(network, header) {
        if (header === void 0) { header = "MTCSB"; }
        var _this = _super.call(this, network, header) || this;
        /**
         * Map from peer id to timestamp
         */
        _this.delivered = new Map();
        /**
         * Hooks that is called when a timestamp is considered to be causally stable
         */
        _this.tcsStable = new Hook_1.default();
        _this.tcsDeliver = new Hook_1.default();
        /**
         * Overridden hook from CausalBroadcast
         */
        _this.onTCDeliver = function (msg) {
            var clock = VectorClock_1.default.fromJson(msg.timestamp.clock);
            _this.delivered.set(msg.timestamp.id, clock);
            _this.tcsDeliver.call(msg.message, { clock: clock, source: msg.timestamp.id });
        };
        _this.tcDeliver.add(_this.onTCDeliver);
        for (var i = 0; i < network.connections.length + 1; i++) {
            // +1 since there connection are one less than number of peers (since the
            // local peer is not represented there!)
            _this.delivered.set(i, new VectorClock_1.default(8 /*network.connections.length + 1*/));
        }
        return _this;
    }
    ManualTCSB.prototype.tcsBroadcast = function (message) {
        this.cBroadcast(message);
    };
    ManualTCSB.prototype.checkStability = function (messages) {
        var e_1, _a;
        try {
            for (var messages_1 = __values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()) {
                var message = messages_1_1.value;
                // Start loop at end to avoid any side effects if a message has become
                // stable
                if (this.isStable(message.clock, message.source)) {
                    this.tcsStable.call(message.clock);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    ManualTCSB.prototype.isStable = function (ts, sourceId) {
        return ts.get(sourceId) <= this.lowerBound(sourceId);
    };
    /**
     * Gives the greatest lower bound on messages issued at j delivered at each
     * other node
     */
    ManualTCSB.prototype.lowerBound = function (peerId) {
        var e_2, _a;
        var min = Number.MAX_SAFE_INTEGER;
        try {
            for (var _b = __values(this.delivered.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var clock = _c.value;
                min = Math.min(clock.get(peerId), min);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return min;
    };
    ManualTCSB.prototype.toJSON = function () {
        return {
            delivered: Array.from(this.delivered.entries()),
        };
    };
    return ManualTCSB;
}(CausalBroadcast_1.default));
exports.default = ManualTCSB;
//# sourceMappingURL=ManualTCSB.js.map