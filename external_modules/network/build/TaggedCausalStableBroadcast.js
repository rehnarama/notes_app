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
var CausalBroadcast_1 = __importDefault(require("./CausalBroadcast"));
var VectorClock_1 = __importDefault(require("./VectorClock"));
var Hook_1 = __importDefault(require("./Hook"));
var TaggedCausalStableBroadcast = /** @class */ (function (_super) {
    __extends(TaggedCausalStableBroadcast, _super);
    function TaggedCausalStableBroadcast(network, header) {
        if (header === void 0) { header = "TCSB"; }
        var _this = _super.call(this, network, header) || this;
        /**
         * Map from peer id to timestamp
         */
        _this.delivered = new Map();
        _this.unstable = [];
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
            _this.tcsDeliver.call(msg.message, clock);
            _this.unstable.push({ source: msg.timestamp.id, clock: clock });
            _this.checkStability();
        };
        _this.tcDeliver.add(_this.onTCDeliver);
        for (var i = 0; i < network.connections.length + 1; i++) {
            // +1 since there connection are one less than number of peers (since the
            // local peer is not represented there!)
            _this.delivered.set(i, new VectorClock_1.default(network.connections.length + 1));
        }
        return _this;
    }
    TaggedCausalStableBroadcast.prototype.tcsBroadcast = function (message) {
        this.cBroadcast(message);
    };
    TaggedCausalStableBroadcast.prototype.checkStability = function () {
        for (var i = this.unstable.length - 1; i >= 0; i--) {
            // Start loop at end to avoid any side effects if a message has become
            // stable
            var msg = this.unstable[i];
            if (this.isStable(msg.clock, msg.source)) {
                this.tcsStable.call(msg.clock);
                this.unstable.splice(i, 1);
            }
        }
    };
    TaggedCausalStableBroadcast.prototype.isStable = function (ts, sourceId) {
        return ts.get(sourceId) <= this.lowerBound(sourceId);
    };
    /**
     * Gives the greatest lower bound on messages issued at j delivered at each
     * other node
     */
    TaggedCausalStableBroadcast.prototype.lowerBound = function (peerId) {
        var e_1, _a;
        var min = Number.MAX_SAFE_INTEGER;
        try {
            for (var _b = __values(this.delivered.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var clock = _c.value;
                min = Math.min(clock.get(peerId), min);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return min;
    };
    TaggedCausalStableBroadcast.prototype.toJSON = function () {
        return {
            delivered: Array.from(this.delivered.entries()),
            unstable: this.unstable
        };
    };
    return TaggedCausalStableBroadcast;
}(CausalBroadcast_1.default));
exports.default = TaggedCausalStableBroadcast;
//# sourceMappingURL=TaggedCausalStableBroadcast.js.map