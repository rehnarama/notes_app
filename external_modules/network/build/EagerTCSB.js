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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var ACK_HEADER = "ETCSB_ACK";
var EagerTCSB = /** @class */ (function (_super) {
    __extends(EagerTCSB, _super);
    function EagerTCSB(network, header) {
        var e_1, _a;
        if (header === void 0) { header = "ETCSB"; }
        var _this = _super.call(this, network, header) || this;
        /**
         * This map keeps tracks of how many ACKs a local message has received from
         * remote peers
         */
        _this.unstableAckCount = new Map();
        _this.ackQueue = [];
        /**
         * Hooks that is called when a timestamp is considered to be causally stable
         */
        _this.tcsStable = new Hook_1.default();
        _this.tcsDeliver = new Hook_1.default();
        _this.handleOnMessage = function (data) {
            var payload = JSON.parse(data);
            if (Array.isArray(payload) && payload[0] === ACK_HEADER) {
                var message = payload[1];
                _this.ackQueue.push({
                    originalClock: VectorClock_1.default.fromJson(message.originalClock),
                    timestamp: VectorClock_1.default.fromJson(message.timestamp)
                });
                _this.processAckQueue();
            }
        };
        _this.processAckQueue = function () {
            for (var i = _this.ackQueue.length - 1; i >= 0; i--) {
                var ack = _this.ackQueue[i];
                if (ack.timestamp.isLessOrEqual(_this.clock)) {
                    // We have to ensure causal delivery of this ACK message, with regards
                    // to the "real" messages sent over the CB
                    var key = ack.originalClock.toJson();
                    var currentCount = _this.unstableAckCount.get(key);
                    if (currentCount !== undefined) {
                        _this.unstableAckCount.set(key, currentCount + 1);
                        _this.checkStability(ack.originalClock);
                    }
                    _this.ackQueue.splice(i, 1);
                }
            }
        };
        _this.sendAck = function (peerId, clock) {
            var message = {
                originalClock: clock.toJson(),
                timestamp: _this.clock.toJson()
            };
            var payload = [ACK_HEADER, message];
            var data = JSON.stringify(payload);
            var c = _this.network.connections.find(function (con) { return con.remoteId === peerId; });
            if (c !== undefined) {
                c.send(data);
            }
        };
        _this.shareStablilityInfo = function (clock) {
            var message = {
                type: "stable",
                clock: clock.toJson()
            };
            _super.prototype.cBroadcast.call(_this, message);
        };
        _this.checkStability = function (clock) {
            var key = clock.toJson();
            var count = _this.unstableAckCount.get(key);
            if (count === _this.network.connections.length) {
                _this.unstableAckCount.delete(key);
                _this.shareStablilityInfo(clock);
                _this.markStable(clock);
            }
        };
        _this.markStable = function (clock) {
            _this.tcsStable.call(clock);
        };
        _this.tcsBroadcast = function (message) {
            var opMessage = {
                type: "op",
                message: message
            };
            _super.prototype.cBroadcast.call(_this, opMessage);
        };
        /**
         * Overridden hook from CausalBroadcast
         */
        _this.onTCDeliver = function (causalMessage) {
            var clock = VectorClock_1.default.fromJson(causalMessage.timestamp.clock);
            var message = causalMessage.message;
            if (message.type === "op") {
                // Deliver message to upper layer
                _this.tcsDeliver.call(message.message, clock);
                if (causalMessage.timestamp.id === _this.network.localId) {
                    // This means we sent this message, let's keep track of how many ACKs it
                    // has received in our map, right now, no one has ACK:ed, ergo the 0
                    _this.unstableAckCount.set(causalMessage.timestamp.clock, 0);
                }
                else {
                    // This is someone elses operation! Let's ACK we have delivered it
                    _this.sendAck(causalMessage.timestamp.id, clock);
                }
            }
            else if (message.type === "stable") {
                _this.markStable(VectorClock_1.default.fromJson(message.clock));
            }
        };
        _this.tcDeliver.add(_this.onTCDeliver);
        try {
            for (var _b = __values(network.connections), _c = _b.next(); !_c.done; _c = _b.next()) {
                var connection = _c.value;
                connection.onMessage.add(_this.handleOnMessage);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return _this;
    }
    EagerTCSB.prototype.toJSON = function () {
        return __assign({ unstableAckCount: Array.from(this.unstableAckCount.entries()), ackQueue: this.ackQueue }, _super.prototype.toJSON.call(this));
    };
    return EagerTCSB;
}(CausalBroadcast_1.default));
exports.default = EagerTCSB;
//# sourceMappingURL=EagerTCSB.js.map