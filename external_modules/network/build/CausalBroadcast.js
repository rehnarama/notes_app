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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var BasicBroadcast_1 = __importDefault(require("./BasicBroadcast"));
var VectorClock_1 = __importDefault(require("./VectorClock"));
var Hook_1 = __importDefault(require("./Hook"));
var CausalBroadcast = /** @class */ (function (_super) {
    __extends(CausalBroadcast, _super);
    function CausalBroadcast(network, header) {
        if (header === void 0) { header = "CC"; }
        var _this = _super.call(this, network, header) || this;
        _this.queue = [];
        _this.cDeliver = new Hook_1.default();
        _this.tcDeliver = new Hook_1.default();
        _this.onBasicDeliver = function (msg) {
            var localId = _this.network.localId;
            var remoteId = msg.timestamp.id;
            if (localId === undefined) {
                throw new Error("No local id found. Aborting deliver");
            }
            if (remoteId === localId) {
                // We can always deliver to ourselves
                _this.tcDeliver.call(msg);
                _this.cDeliver.call(msg.message);
            }
            else {
                _this.queue.push(msg);
                _this.processQueue();
            }
        };
        _this.isReadyToDeliver = function (message) {
            var _a = message.timestamp, remoteId = _a.id, jsonClock = _a.clock;
            var remoteClock = VectorClock_1.default.fromJson(jsonClock);
            var localClock = _this.clock;
            var isNextFromRemote = remoteClock.get(remoteId) === localClock.get(remoteId) + 1;
            var isCausallyOrderedBefore = true;
            for (var i = 0; i < _this.clock.size; i++) {
                if (remoteClock.get(i) > localClock.get(i) && i !== remoteId) {
                    isCausallyOrderedBefore = false;
                    break;
                }
            }
            return isNextFromRemote && isCausallyOrderedBefore;
        };
        // connections.length === number of remote connections, +1 to include local
        // peer
        _this.clock = new VectorClock_1.default(network.connections.length + 1);
        _this.bDeliver.add(_this.onBasicDeliver);
        return _this;
    }
    CausalBroadcast.prototype.cBroadcast = function (message) {
        var localId = this.network.localId;
        if (localId === undefined) {
            throw new Error("No local id found. Aborting broadcast");
        }
        this.clock.set(localId, this.clock.get(localId) + 1);
        var causalMessage = {
            message: message,
            timestamp: {
                id: localId,
                clock: this.clock.toJson()
            }
        };
        _super.prototype.bBroadcast.call(this, causalMessage);
    };
    CausalBroadcast.prototype.processQueue = function () {
        var runAgain;
        do {
            runAgain = false;
            for (var i = this.queue.length - 1; i >= 0; i--) {
                // Start from end so we don't have to deal with side effect if we remove
                // a message from the queue
                var msg = this.queue[i];
                if (this.isReadyToDeliver(msg)) {
                    // We only have to run again if we are not in the end of the queue
                    // since we'll process all messages in the queue anyway
                    runAgain = i !== this.queue.length - 1;
                    this.queue.splice(i, 1);
                    this.clock.set(msg.timestamp.id, this.clock.get(msg.timestamp.id) + 1);
                    this.tcDeliver.call(msg);
                    this.cDeliver.call(msg.message);
                }
            }
        } while (runAgain);
    };
    CausalBroadcast.prototype.toJSON = function () {
        return __assign({ clock: this.clock, queue: this.queue }, _super.prototype.toJSON.call(this));
    };
    return CausalBroadcast;
}(BasicBroadcast_1.default));
exports.default = CausalBroadcast;
//# sourceMappingURL=CausalBroadcast.js.map